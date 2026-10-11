/**
 * BugBuddy Knowledge Base — Stage 6: Hybrid Retrieval Engine
 * 
 * Combines BM25 keyword matching and dense vector similarity using
 * Reciprocal Rank Fusion (RRF) to avoid comparing raw mismatched scores.
 * 
 * Supports deterministic tie-breaking, configurable weights, multi-criteria filtering,
 * and safe, honest fallback when the optional embedding provider is unavailable.
 */

import { NormalizedKnowledgeRecord } from './types';
import { KnowledgeSearchIndex, SearchOptions, SearchResultItem } from './search';
import { VectorSearchIndex } from './vectorSearch';
import { EmbeddingError } from './embeddings';

/**
 * Configurable retrieval strategies.
 */
export type HybridRetrievalMode =
  | 'BM25_ONLY'
  | 'SEMANTIC_ONLY'
  | 'HYBRID_RRF'
  | 'HYBRID_WITH_FALLBACK';

export interface HybridSearchOptions extends SearchOptions {
  /** Strategy for combining or selecting retrieval backends (default: 'HYBRID_WITH_FALLBACK') */
  retrievalMode?: HybridRetrievalMode;
  /**
   * Reciprocal Rank Fusion smoothing parameter k (standard default: 60).
   * Formula: RRF_score(d) = sum( weight_m / (k + rank_m(d)) )
   */
  rrfK?: number;
  /** Relative weight for BM25 ranks in RRF fusion (default: 1.0) */
  bm25Weight?: number;
  /** Relative weight for Semantic ranks in RRF fusion (default: 1.0) */
  semanticWeight?: number;
  /** Number of candidate BM25 results to retrieve prior to fusion (default: 20) */
  bm25CandidateLimit?: number;
  /** Number of candidate Vector results to retrieve prior to fusion (default: 20) */
  semanticCandidateLimit?: number;
}

export interface HybridSearchResultItem extends SearchResultItem {
  /** Original BM25 score if item appeared in lexical search */
  bm25Score?: number;
  /** 1-based rank in BM25 candidate list */
  bm25Rank?: number;
  /** Original Cosine Similarity score if item appeared in vector search */
  semanticScore?: number;
  /** 1-based rank in vector candidate list */
  semanticRank?: number;
  /** Grounded mode that contributed to this result */
  effectiveRetrievalMode: 'BM25' | 'SEMANTIC' | 'HYBRID_RRF';
}

export interface HybridSearchDiagnostic {
  requestedMode: HybridRetrievalMode;
  effectiveMode: 'BM25' | 'SEMANTIC' | 'HYBRID_RRF';
  usedFallback: boolean;
  fallbackReason?: string;
  rrfK: number;
  bm25CandidatesCount: number;
  semanticCandidatesCount: number;
  providerName: string;
}

export interface HybridSearchResults {
  query: string;
  total: number;
  results: HybridSearchResultItem[];
  executionTimeMs: number;
  diagnostic: HybridSearchDiagnostic;
}

/**
 * Computes Reciprocal Rank Fusion (RRF) score for a given rank and weight.
 * Formula: weight / (k + rank)
 */
export function calculateRRFScore(rank: number, k: number = 60, weight: number = 1.0): number {
  if (rank <= 0) return 0;
  return weight / (k + rank);
}

/**
 * Hybrid Search Engine integrating BM25 lexical index and Vector dense index.
 */
export class HybridSearchEngine {
  private readonly bm25Index: KnowledgeSearchIndex;
  private readonly vectorIndex?: VectorSearchIndex;

  constructor(bm25Index: KnowledgeSearchIndex, vectorIndex?: VectorSearchIndex) {
    this.bm25Index = bm25Index;
    this.vectorIndex = vectorIndex;
  }

  /**
   * Retrieves the BM25 index.
   */
  public getBM25Index(): KnowledgeSearchIndex {
    return this.bm25Index;
  }

  /**
   * Retrieves the optional Vector index.
   */
  public getVectorIndex(): VectorSearchIndex | undefined {
    return this.vectorIndex;
  }

  /**
   * Executes hybrid search using Reciprocal Rank Fusion or selected mode.
   */
  public async search(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<HybridSearchResults> {
    const startTime = performance.now();
    const cleanQuery = (query || '').trim();

    const mode = options.retrievalMode || 'HYBRID_WITH_FALLBACK';
    const rrfK = options.rrfK !== undefined && options.rrfK > 0 ? options.rrfK : 60;
    const bm25Weight = options.bm25Weight ?? 1.0;
    const semanticWeight = options.semanticWeight ?? 1.0;
    const limit = options.limit !== undefined && options.limit > 0 ? options.limit : 10;
    const offset = options.offset !== undefined && options.offset >= 0 ? options.offset : 0;
    const candidateLimit = Math.max(limit * 2, 20);

    const providerName = this.vectorIndex?.getProvider().modelInfo.name || 'none';

    // 1. Direct BM25 Only Mode
    if (mode === 'BM25_ONLY') {
      const bm25Results = this.bm25Index.search(cleanQuery, options);
      const items: HybridSearchResultItem[] = bm25Results.results.map((r, idx) => ({
        ...r,
        bm25Score: r.score,
        bm25Rank: idx + 1,
        effectiveRetrievalMode: 'BM25',
      }));

      return {
        query: cleanQuery,
        total: bm25Results.total,
        results: items,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        diagnostic: {
          requestedMode: mode,
          effectiveMode: 'BM25',
          usedFallback: false,
          rrfK,
          bm25CandidatesCount: bm25Results.results.length,
          semanticCandidatesCount: 0,
          providerName,
        },
      };
    }

    // 2. Check Vector Provider Availability
    let isVectorAvailable = false;
    let vectorInitError: string | undefined;

    if (this.vectorIndex) {
      try {
        isVectorAvailable = await this.vectorIndex.getProvider().isAvailable();
      } catch (err: any) {
        isVectorAvailable = false;
        vectorInitError = err?.message || String(err);
      }
    } else {
      vectorInitError = 'No vector index provided.';
    }

    // 3. Direct Semantic Only Mode
    if (mode === 'SEMANTIC_ONLY') {
      if (!isVectorAvailable || !this.vectorIndex) {
        throw new EmbeddingError(
          `Semantic retrieval requested but vector provider is unavailable: ${vectorInitError || 'provider not ready'}`,
          'MODEL_UNAVAILABLE'
        );
      }

      const vectorResults = await this.vectorIndex.searchByText(cleanQuery, options);
      const items: HybridSearchResultItem[] = vectorResults.results.map((r, idx) => ({
        ...r,
        semanticScore: r.score,
        semanticRank: idx + 1,
        effectiveRetrievalMode: 'SEMANTIC',
      }));

      return {
        query: cleanQuery,
        total: vectorResults.total,
        results: items,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        diagnostic: {
          requestedMode: mode,
          effectiveMode: 'SEMANTIC',
          usedFallback: false,
          rrfK,
          bm25CandidatesCount: 0,
          semanticCandidatesCount: vectorResults.results.length,
          providerName,
        },
      };
    }

    // 4. Handle Hybrid when Vector is Unavailable
    if (!isVectorAvailable || !this.vectorIndex) {
      if (mode === 'HYBRID_RRF') {
        throw new EmbeddingError(
          `Hybrid search (HYBRID_RRF) requires an active embedding provider, but provider '${providerName}' is unavailable: ${vectorInitError || 'not ready'}`,
          'MODEL_UNAVAILABLE'
        );
      }

      // Safe, transparent fallback to BM25
      const fallbackResults = this.bm25Index.search(cleanQuery, options);
      const items: HybridSearchResultItem[] = fallbackResults.results.map((r, idx) => ({
        ...r,
        bm25Score: r.score,
        bm25Rank: idx + 1,
        effectiveRetrievalMode: 'BM25',
      }));

      return {
        query: cleanQuery,
        total: fallbackResults.total,
        results: items,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        diagnostic: {
          requestedMode: mode,
          effectiveMode: 'BM25',
          usedFallback: true,
          fallbackReason: vectorInitError || 'Vector provider unavailable; safely fell back to BM25.',
          rrfK,
          bm25CandidatesCount: fallbackResults.results.length,
          semanticCandidatesCount: 0,
          providerName,
        },
      };
    }

    // 5. Full Reciprocal Rank Fusion (RRF) Hybrid Search
    // Retrieve top candidates from both engines
    const bm25Candidates = this.bm25Index.search(cleanQuery, {
      ...options,
      limit: options.bm25CandidateLimit || candidateLimit,
      offset: 0,
    });

    const vectorCandidates = await this.vectorIndex.searchByText(cleanQuery, {
      ...options,
      limit: options.semanticCandidateLimit || candidateLimit,
      offset: 0,
    });

    // Maps to aggregate fused RRF data by record ID
    const fusedMap = new Map<
      string,
      {
        record: NormalizedKnowledgeRecord;
        rrfScore: number;
        bm25Score?: number;
        bm25Rank?: number;
        semanticScore?: number;
        semanticRank?: number;
        matchedTerms: string[];
      }
    >();

    // Accumulate BM25 candidate ranks
    for (let i = 0; i < bm25Candidates.results.length; i++) {
      const item = bm25Candidates.results[i];
      const rank = i + 1;
      const rrfContribution = calculateRRFScore(rank, rrfK, bm25Weight);

      fusedMap.set(item.record.id, {
        record: item.record,
        rrfScore: rrfContribution,
        bm25Score: item.score,
        bm25Rank: rank,
        matchedTerms: [...item.matchedTerms],
      });
    }

    // Accumulate Semantic candidate ranks
    for (let j = 0; j < vectorCandidates.results.length; j++) {
      const item = vectorCandidates.results[j];
      const rank = j + 1;
      const rrfContribution = calculateRRFScore(rank, rrfK, semanticWeight);

      if (fusedMap.has(item.record.id)) {
        const existing = fusedMap.get(item.record.id)!;
        existing.rrfScore += rrfContribution;
        existing.semanticScore = item.score;
        existing.semanticRank = rank;
      } else {
        fusedMap.set(item.record.id, {
          record: item.record,
          rrfScore: rrfContribution,
          semanticScore: item.score,
          semanticRank: rank,
          matchedTerms: [],
        });
      }
    }

    const fusedItems = Array.from(fusedMap.values());

    // Deterministic sorting: Fused RRF score DESC, tie-break by record.id ASC
    fusedItems.sort((a, b) => {
      if (b.rrfScore !== a.rrfScore) {
        return b.rrfScore - a.rrfScore;
      }
      return a.record.id.localeCompare(b.record.id);
    });

    // Paging
    const paged = fusedItems.slice(offset, offset + limit).map((f) => ({
      record: f.record,
      score: Number(f.rrfScore.toFixed(6)),
      matchedTerms: f.matchedTerms,
      bm25Score: f.bm25Score,
      bm25Rank: f.bm25Rank,
      semanticScore: f.semanticScore,
      semanticRank: f.semanticRank,
      effectiveRetrievalMode: 'HYBRID_RRF' as const,
    }));

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      query: cleanQuery,
      total: fusedItems.length,
      results: paged,
      executionTimeMs,
      diagnostic: {
        requestedMode: mode,
        effectiveMode: 'HYBRID_RRF',
        usedFallback: false,
        rrfK,
        bm25CandidatesCount: bm25Candidates.results.length,
        semanticCandidatesCount: vectorCandidates.results.length,
        providerName,
      },
    };
  }
}
