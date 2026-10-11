/**
 * BugBuddy Knowledge Base — Stage 6: In-Memory Vector Similarity Search Engine
 * 
 * Implements deterministic vector indexing, cosine similarity ranking,
 * metadata-aware filtering, dimension validation, and stable tie-breaking.
 */

import {
  NormalizedKnowledgeRecord,
} from './types';
import {
  matchesFilter,
  SearchOptions,
  SearchResults,
  SearchResultItem,
} from './search';
import {
  EmbeddingError,
  EmbeddingProvider,
  EmbeddingVector,
} from './embeddings';

/**
 * Computes Cosine Similarity between two numeric vectors.
 * 
 * Formula: (A · B) / (||A|| * ||B||)
 * 
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns Cosine similarity score in range [-1.0, 1.0] (or 0.0 for zero vectors)
 * @throws {EmbeddingError} If vectors have mismatched lengths or contain invalid numeric values.
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new EmbeddingError('Vectors must be arrays of numbers.', 'INVALID_VECTOR');
  }

  if (a.length !== b.length) {
    throw new EmbeddingError(
      `Vector dimension mismatch: vector A has length ${a.length}, but vector B has length ${b.length}.`,
      'DIMENSION_MISMATCH'
    );
  }

  if (a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];

    if (!Number.isFinite(valA) || !Number.isFinite(valB)) {
      throw new EmbeddingError(
        `Vector contains non-finite number (NaN or Infinity) at index ${i}.`,
        'INVALID_VECTOR'
      );
    }

    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator <= 0) {
    return 0; // Handle zero-norm vectors safely
  }

  const similarity = dotProduct / denominator;
  // Clamp floating-point boundary anomalies to [-1.0, 1.0]
  return Math.max(-1.0, Math.min(1.0, similarity));
}

/**
 * Composes rich textual representation of a knowledge record to embed for semantic retrieval.
 */
export function getRecordSearchableSemanticText(record: NormalizedKnowledgeRecord): string {
  const parts = [
    `Title: ${record.title}`,
    `Language: ${record.language}`,
    `Category: ${record.category}`,
    `Symptoms: ${record.symptoms}`,
    `Diagnosis: ${record.diagnosis}`,
    `Fix explanation: ${record.whyItWorks}`,
    `Keywords: ${record.tags.join(', ')}`,
    `Troubleshooting: ${record.debuggingSteps.join(' ')}`,
  ];
  return parts.join('\n');
}

export interface IndexedVectorDocument {
  record: NormalizedKnowledgeRecord;
  vector: EmbeddingVector;
  textHash: string;
}

/**
 * In-memory Vector Index for dense semantic retrieval.
 */
export class VectorSearchIndex {
  private readonly provider: EmbeddingProvider;
  private readonly documents: Map<string, IndexedVectorDocument> = new Map();
  private readonly vectorCache: Map<string, EmbeddingVector> = new Map();

  constructor(provider: EmbeddingProvider, initialRecords?: NormalizedKnowledgeRecord[]) {
    this.provider = provider;
    if (initialRecords && initialRecords.length > 0) {
      this.indexAllSyncOrQueued(initialRecords);
    }
  }

  /**
   * Returns current count of indexed vector documents.
   */
  public size(): number {
    return this.documents.size;
  }

  /**
   * Retrieves the configured embedding provider.
   */
  public getProvider(): EmbeddingProvider {
    return this.provider;
  }

  /**
   * Generates a cache key anchored to model identity, version, and record ID.
   */
  private getCacheKey(recordId: string): string {
    const info = this.provider.modelInfo;
    return `${info.name}@${info.version}::${recordId}`;
  }

  /**
   * Indexes a single record with either a pre-computed vector or by embedding on-demand.
   */
  public async indexRecord(
    record: NormalizedKnowledgeRecord,
    precomputedVector?: EmbeddingVector
  ): Promise<void> {
    const cacheKey = this.getCacheKey(record.id);

    let vector = precomputedVector;
    if (!vector) {
      if (this.vectorCache.has(cacheKey)) {
        vector = this.vectorCache.get(cacheKey)!;
      } else {
        const text = getRecordSearchableSemanticText(record);
        vector = await this.provider.embedText(text);
        this.vectorCache.set(cacheKey, vector);
      }
    }

    // Validate dimensionality against provider model info
    if (
      this.provider.modelInfo.dimensions > 0 &&
      vector.length !== this.provider.modelInfo.dimensions
    ) {
      throw new EmbeddingError(
        `Record '${record.id}' vector dimension (${vector.length}) does not match provider dimensions (${this.provider.modelInfo.dimensions}).`,
        'DIMENSION_MISMATCH'
      );
    }

    this.documents.set(record.id, {
      record,
      vector,
      textHash: record.id,
    });
  }

  /**
   * Indexes multiple records in batch.
   */
  public async indexAll(records: NormalizedKnowledgeRecord[]): Promise<void> {
    const uncomputed: { record: NormalizedKnowledgeRecord; index: number; text: string }[] = [];
    const vectorsByIndex: (EmbeddingVector | null)[] = new Array(records.length).fill(null);

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const cacheKey = this.getCacheKey(rec.id);
      if (this.vectorCache.has(cacheKey)) {
        vectorsByIndex[i] = this.vectorCache.get(cacheKey)!;
      } else {
        uncomputed.push({
          record: rec,
          index: i,
          text: getRecordSearchableSemanticText(rec),
        });
      }
    }

    if (uncomputed.length > 0) {
      const texts = uncomputed.map((u) => u.text);
      const computedVectors = await this.provider.embedBatch(texts);

      for (let j = 0; j < uncomputed.length; j++) {
        const target = uncomputed[j];
        const vec = computedVectors[j];
        const cacheKey = this.getCacheKey(target.record.id);
        this.vectorCache.set(cacheKey, vec);
        vectorsByIndex[target.index] = vec;
      }
    }

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const vec = vectorsByIndex[i]!;
      this.documents.set(rec.id, {
        record: rec,
        vector: vec,
        textHash: rec.id,
      });
    }
  }

  /**
   * Synchronous helper for initial constructor records if pre-cached or initialized.
   */
  private indexAllSyncOrQueued(records: NormalizedKnowledgeRecord[]): void {
    // Non-blocking background initialization
    this.indexAll(records).catch((err) => {
      // Handled silently; indexRecord can be awaited directly
    });
  }

  /**
   * Removes a record from the vector index.
   */
  public remove(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Clears all indexed documents.
   */
  public clear(): void {
    this.documents.clear();
  }

  /**
   * Clears the vector cache completely.
   */
  public clearCache(): void {
    this.vectorCache.clear();
  }

  /**
   * Executes a dense vector similarity search given an embedded query vector.
   */
  public searchByVector(queryVector: EmbeddingVector, options: SearchOptions = {}): SearchResults {
    const startTime = performance.now();
    const limit = options.limit !== undefined && options.limit > 0 ? options.limit : 10;
    const offset = options.offset !== undefined && options.offset >= 0 ? options.offset : 0;
    const minScore = options.minScore !== undefined ? options.minScore : -1.0;

    const scoredItems: SearchResultItem[] = [];

    for (const doc of this.documents.values()) {
      if (!matchesFilter(doc.record, options.filter)) {
        continue;
      }

      const score = cosineSimilarity(queryVector, doc.vector);
      if (score >= minScore) {
        scoredItems.push({
          record: doc.record,
          score: Number(score.toFixed(6)),
          matchedTerms: [],
        });
      }
    }

    // Deterministic sorting: similarity DESC, tie-break by record ID ASC
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.record.id.localeCompare(b.record.id);
    });

    const paged = scoredItems.slice(offset, offset + limit);
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      query: '[vector-query]',
      total: scoredItems.length,
      results: paged,
      executionTimeMs,
    };
  }

  /**
   * Executes semantic retrieval given natural language query text.
   * Embeds the text with the provider, then runs vector similarity search.
   * 
   * @throws {EmbeddingError} If embedding provider is unavailable or fails.
   */
  public async searchByText(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const cleanQuery = (query || '').trim();

    // Graceful empty-query handling: return filtered items deterministically by ID
    if (!cleanQuery) {
      const startTime = performance.now();
      const limit = options.limit !== undefined && options.limit > 0 ? options.limit : 10;
      const offset = options.offset !== undefined && options.offset >= 0 ? options.offset : 0;

      const items: SearchResultItem[] = [];
      for (const doc of this.documents.values()) {
        if (matchesFilter(doc.record, options.filter)) {
          items.push({
            record: doc.record,
            score: 0.0,
            matchedTerms: [],
          });
        }
      }
      items.sort((a, b) => a.record.id.localeCompare(b.record.id));
      const paged = items.slice(offset, offset + limit);

      return {
        query: '',
        total: items.length,
        results: paged,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    const available = await this.provider.isAvailable();
    if (!available) {
      throw new EmbeddingError(
        `Semantic search unavailable: provider '${this.provider.modelInfo.name}' is not ready.`,
        'MODEL_UNAVAILABLE'
      );
    }

    const queryVector = await this.provider.embedText(cleanQuery);
    const results = this.searchByVector(queryVector, options);
    results.query = cleanQuery;
    return results;
  }
}
