/**
 * BugBuddy Knowledge Base — Stage 6: Embedding Provider Abstraction
 * 
 * Defines typed interfaces and contracts for vector embedding providers.
 * Keeps vector representations decoupled from the canonical knowledge schema
 * so that curated JSON records remain clean, human-readable, and offline.
 */

export type EmbeddingVector = number[];

/**
 * Metadata describing an embedding model's identity, dimensionality, and runtime properties.
 */
export interface EmbeddingModelInfo {
  /** Model identifier (e.g. 'all-MiniLM-L6-v2') */
  name: string;
  /** Exact model version or revision string */
  version: string;
  /** Vector dimensionality (e.g. 384 for MiniLM-L6-v2) */
  dimensions: number;
  /** Provider runtime classification */
  runtime: 'local_onnx' | 'local_wasm' | 'synthetic_test' | 'unavailable';
  /** Model license (e.g. 'Apache-2.0') */
  license: string;
  /** Maximum supported input token length */
  maxInputTokens?: number;
  /** Brief human-readable description */
  description?: string;
}

/**
 * Standard error raised when embedding operations fail, models are unavailable,
 * or vector dimensions mismatch.
 */
export class EmbeddingError extends Error {
  public readonly code:
    | 'MODEL_UNAVAILABLE'
    | 'DIMENSION_MISMATCH'
    | 'INVALID_VECTOR'
    | 'INFERENCE_FAILED';

  constructor(
    message: string,
    code: 'MODEL_UNAVAILABLE' | 'DIMENSION_MISMATCH' | 'INVALID_VECTOR' | 'INFERENCE_FAILED'
  ) {
    super(message);
    this.name = 'EmbeddingError';
    this.code = code;
  }
}

/**
 * Contract that any embedding provider must implement.
 */
export interface EmbeddingProvider {
  /** Metadata regarding model name, dimensionality, license, and runtime */
  readonly modelInfo: EmbeddingModelInfo;

  /**
   * Checks whether the embedding model and runtime are initialized and operational.
   */
  isAvailable(): Promise<boolean> | boolean;

  /**
   * Generates a vector embedding for a single text input.
   * 
   * @throws {EmbeddingError} If the model is unavailable or inference fails.
   */
  embedText(text: string): Promise<EmbeddingVector>;

  /**
   * Generates vector embeddings for a batch of text inputs.
   * 
   * @throws {EmbeddingError} If the model is unavailable or inference fails.
   */
  embedBatch(texts: string[]): Promise<EmbeddingVector[]>;
}

/**
 * Default Null Provider used when no embedding model is configured.
 * Always reports unavailable and safely triggers BM25 fallback in hybrid search.
 */
export class NullEmbeddingProvider implements EmbeddingProvider {
  public readonly modelInfo: EmbeddingModelInfo = {
    name: 'none',
    version: '0.0.0',
    dimensions: 0,
    runtime: 'unavailable',
    license: 'none',
    description: 'No embedding model configured. Semantic search disabled.',
  };

  public isAvailable(): boolean {
    return false;
  }

  public async embedText(_text: string): Promise<EmbeddingVector> {
    throw new EmbeddingError(
      'No embedding provider configured. Semantic retrieval is unavailable.',
      'MODEL_UNAVAILABLE'
    );
  }

  public async embedBatch(_texts: string[]): Promise<EmbeddingVector[]> {
    throw new EmbeddingError(
      'No embedding provider configured. Semantic retrieval is unavailable.',
      'MODEL_UNAVAILABLE'
    );
  }
}

/**
 * Deterministic Synthetic Provider strictly for unit testing vector mathematics,
 * similarity ranking, and hybrid fusion without downloading weights or making network calls.
 * 
 * Note: Clearly labeled as synthetic; NOT used as real semantic retrieval.
 */
export class SyntheticTestEmbeddingProvider implements EmbeddingProvider {
  public readonly modelInfo: EmbeddingModelInfo;

  constructor(dimensions: number = 384) {
    this.modelInfo = {
      name: 'synthetic-test-model',
      version: '1.0.0',
      dimensions,
      runtime: 'synthetic_test',
      license: 'MIT',
      description: 'Deterministic pseudo-embedding provider strictly for unit testing invariant math.',
    };
  }

  public isAvailable(): boolean {
    return true;
  }

  /**
   * Produces a deterministic normalized pseudo-vector based on string character hashes.
   */
  public async embedText(text: string): Promise<EmbeddingVector> {
    const dims = this.modelInfo.dimensions;
    const vec = new Array<number>(dims).fill(0);
    const clean = (text || '').toLowerCase().trim();

    if (!clean) {
      return vec; // Zero vector for empty input
    }

    // Deterministic distribution across dimensions based on character codes
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      const targetDim = (code * 31 + i * 17) % dims;
      vec[targetDim] += (code % 13) + 1;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < dims; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < dims; i++) {
        vec[i] /= norm;
      }
    }

    return vec;
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
    const results: EmbeddingVector[] = [];
    for (const t of texts) {
      results.push(await this.embedText(t));
    }
    return results;
  }
}

/**
 * Specification for the recommended local production embedding model:
 * Xenova/all-MiniLM-L6-v2 (384 dimensions, Apache 2.0).
 */
export const LOCAL_MINILM_MODEL_INFO: EmbeddingModelInfo = {
  name: 'Xenova/all-MiniLM-L6-v2',
  version: '2.17.2',
  dimensions: 384,
  runtime: 'local_onnx',
  license: 'Apache-2.0',
  maxInputTokens: 256,
  description: 'Sentence-Transformers 384-dimensional embedding model running via ONNX Runtime.',
};

/**
 * Optional Adapter for local ONNX/Transformers models (e.g. @xenova/transformers).
 * Lazily loads the model upon first request if the library is installed.
 * If the optional dependency is not installed or initialization fails,
 * cleanly reports unavailable without crashing.
 */
export class LocalTransformersEmbeddingAdapter implements EmbeddingProvider {
  public readonly modelInfo: EmbeddingModelInfo;
  private pipelineInstance: any = null;
  private isInitialized = false;
  private initError: string | null = null;

  constructor(modelInfo: EmbeddingModelInfo = LOCAL_MINILM_MODEL_INFO) {
    this.modelInfo = modelInfo;
  }

  /**
   * Attempts lazy loading of the local transformers pipeline.
   */
  public async isAvailable(): Promise<boolean> {
    if (this.isInitialized && this.pipelineInstance) {
      return true;
    }
    if (this.initError) {
      return false;
    }

    try {
      // Dynamic import to avoid hard dependency on optional heavy package
      const transformers = await import('@xenova/transformers' as any).catch(() => null);
      if (!transformers || !transformers.pipeline) {
        this.initError = '@xenova/transformers package is not installed in local environment.';
        return false;
      }

      this.pipelineInstance = await transformers.pipeline('feature-extraction', this.modelInfo.name, {
        quantized: true,
      });
      this.isInitialized = true;
      return true;
    } catch (err: any) {
      this.initError = `Failed to load local ONNX embedding pipeline: ${err?.message || String(err)}`;
      return false;
    }
  }

  public async embedText(text: string): Promise<EmbeddingVector> {
    const available = await this.isAvailable();
    if (!available || !this.pipelineInstance) {
      throw new EmbeddingError(
        this.initError || 'Local embedding model is unavailable.',
        'MODEL_UNAVAILABLE'
      );
    }

    try {
      const output = await this.pipelineInstance(text, {
        pooling: 'mean',
        normalize: true,
      });

      const raw = Array.from(output.data) as number[];
      if (raw.length !== this.modelInfo.dimensions) {
        throw new EmbeddingError(
          `Model output dimension (${raw.length}) does not match configured dimensions (${this.modelInfo.dimensions}).`,
          'DIMENSION_MISMATCH'
        );
      }
      return raw;
    } catch (err: any) {
      if (err instanceof EmbeddingError) throw err;
      throw new EmbeddingError(`Inference failed: ${err?.message || String(err)}`, 'INFERENCE_FAILED');
    }
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
    const results: EmbeddingVector[] = [];
    for (const t of texts) {
      results.push(await this.embedText(t));
    }
    return results;
  }
}
