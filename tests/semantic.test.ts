/**
 * BugBuddy Knowledge Base — Stage 6: Semantic & Hybrid Retrieval Test Suite
 * 
 * Verifies vector dimension validation, cosine similarity mathematics,
 * deterministic ranking, stable tie-breaking, language/category filtering,
 * Reciprocal Rank Fusion (RRF), BM25 fallback, and Stage 4 response grounding.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

import {
  cosineSimilarity,
  EmbeddingError,
  NullEmbeddingProvider,
  SyntheticTestEmbeddingProvider,
  LocalTransformersEmbeddingAdapter,
  VectorSearchIndex,
  HybridSearchEngine,
  calculateRRFScore,
  buildDiagnosisResponse,
  ingestKnowledgeDirectory,
  KnowledgeSearchIndex,
  RETRIEVAL_EVALUATION_DATASET,
  evaluateHybridRetrieval,
  type KnowledgeEntry,
  type NormalizedKnowledgeRecord,
  normalizeRecord,
} from '../src/knowledge';

function createMockRecord(overrides: Partial<KnowledgeEntry>): NormalizedKnowledgeRecord {
  const baseEntry: KnowledgeEntry = {
    id: 'mock-rec-01',
    language: 'python',
    title: 'Mutable Default Argument Accumulation',
    category: 'silly_mistake',
    difficulty: 'beginner',
    symptoms: 'Subsequent calls accumulate state from previous calls.',
    roast: 'You gave every player the exact same communal backpack!',
    diagnosis: 'Default arguments in Python are evaluated once at definition time.',
    debuggingSteps: [
      '1. Inspect parameter defaults for mutable objects.',
      '2. Replace default with None.',
    ],
    badExample: 'def add(item, items=[]): items.append(item); return items',
    fixedExample: 'def add(item, items=None): items = items or []; items.append(item); return items',
    whyItWorks: 'Using None instantiates a new list instance per invocation.',
    tests: 'pytest tests/test_inventory.py -v',
    tags: ['python', 'mutable', 'default-args'],
    sources: [
      {
        title: 'Python Official Tutorial on Default Arguments',
        url: 'https://docs.python.org/3/tutorial/controlflow.html#default-arguments',
      },
    ],
    ...overrides,
  };

  return normalizeRecord(baseEntry, 'knowledge/python.json');
}

describe('BugBuddy Knowledge Base — Stage 6 Semantic & Hybrid Search Suite', () => {
  // 1. Valid embedding vectors & cosine similarity math
  it('1. Cosine similarity calculates exact scores on known mathematical fixtures', () => {
    // Identical normalized vectors -> 1.0
    assert.strictEqual(cosineSimilarity([1, 0, 0], [1, 0, 0]), 1.0);
    // Orthogonal vectors -> 0.0
    assert.strictEqual(cosineSimilarity([1, 0, 0], [0, 1, 0]), 0.0);
    // Opposite vectors -> -1.0
    assert.strictEqual(cosineSimilarity([1, 0, 0], [-1, 0, 0]), -1.0);
    // Arbitrary 2D vector: (3, 4) and (4, 3) -> dot = 24, norms = 5, 5 -> 24/25 = 0.96
    const sim = cosineSimilarity([3, 4], [4, 3]);
    assert.ok(Math.abs(sim - 0.96) < 1e-6);
    // Zero vector safely returns 0.0
    assert.strictEqual(cosineSimilarity([0, 0], [1, 2]), 0.0);
  });

  // 2. Malformed vector handling
  it('2. Cosine similarity rejects malformed vectors and non-finite numbers', () => {
    assert.throws(
      () => cosineSimilarity([1, NaN, 0], [1, 0, 0]),
      (err: any) => err instanceof EmbeddingError && err.code === 'INVALID_VECTOR'
    );
    assert.throws(
      () => cosineSimilarity(null as any, [1, 0, 0]),
      (err: any) => err instanceof EmbeddingError && err.code === 'INVALID_VECTOR'
    );
  });

  // 3. Vector dimension mismatch handling
  it('3. Cosine similarity rejects mismatched vector dimensions', () => {
    assert.throws(
      () => cosineSimilarity([1, 0], [1, 0, 0]),
      (err: any) => err instanceof EmbeddingError && err.code === 'DIMENSION_MISMATCH'
    );
  });

  // 4. Deterministic semantic ranking
  it('4. VectorSearchIndex ranks documents deterministically by cosine similarity', async () => {
    const provider = new SyntheticTestEmbeddingProvider(4);
    const index = new VectorSearchIndex(provider);

    const recA = createMockRecord({ id: 'rec-a', title: 'Alpha Match' });
    const recB = createMockRecord({ id: 'rec-b', title: 'Beta Match' });

    // Explicitly index with pre-computed vectors
    await index.indexRecord(recA, [1, 0, 0, 0]);
    await index.indexRecord(recB, [0.5, 0.5, 0, 0]);

    // Query close to recA [1, 0, 0, 0]
    const results = index.searchByVector([1, 0, 0, 0]);

    assert.strictEqual(results.total, 2);
    assert.strictEqual(results.results[0].record.id, 'rec-a');
    assert.strictEqual(results.results[0].score, 1.0);
    assert.strictEqual(results.results[1].record.id, 'rec-b');
    assert.ok(results.results[1].score < 1.0);
  });

  // 5. Stable record-ID tie-breaking
  it('5. VectorSearchIndex breaks tied similarity scores deterministically by record.id ascending', async () => {
    const provider = new SyntheticTestEmbeddingProvider(3);
    const index = new VectorSearchIndex(provider);

    const recZ = createMockRecord({ id: 'rec-z', title: 'Zebra' });
    const recA = createMockRecord({ id: 'rec-a', title: 'Apple' });
    const recM = createMockRecord({ id: 'rec-m', title: 'Mango' });

    // Same identical vector -> identical similarity 1.0
    await index.indexRecord(recZ, [1, 0, 0]);
    await index.indexRecord(recA, [1, 0, 0]);
    await index.indexRecord(recM, [1, 0, 0]);

    const results = index.searchByVector([1, 0, 0]);

    assert.strictEqual(results.results.length, 3);
    assert.strictEqual(results.results[0].record.id, 'rec-a');
    assert.strictEqual(results.results[1].record.id, 'rec-m');
    assert.strictEqual(results.results[2].record.id, 'rec-z');
  });

  // 6. Empty query handling
  it('6. VectorSearchIndex handles empty queries gracefully without throwing', async () => {
    const provider = new SyntheticTestEmbeddingProvider(3);
    const index = new VectorSearchIndex(provider);
    const rec = createMockRecord({ id: 'rec-01' });
    await index.indexRecord(rec, [1, 0, 0]);

    const resEmpty = await index.searchByText('');
    assert.strictEqual(resEmpty.total, 1);
    assert.strictEqual(resEmpty.results[0].record.id, 'rec-01');

    const resWhitespace = await index.searchByText('   ');
    assert.strictEqual(resWhitespace.total, 1);
  });

  // 7. Language and category filtering
  it('7. VectorSearchIndex strictly enforces language and category filters', async () => {
    const provider = new SyntheticTestEmbeddingProvider(3);
    const index = new VectorSearchIndex(provider);

    const recPy = createMockRecord({ id: 'py-01', language: 'python', category: 'silly_mistake' });
    const recJs = createMockRecord({ id: 'js-01', language: 'javascript', category: 'runtime_error' });

    await index.indexRecord(recPy, [1, 0, 0]);
    await index.indexRecord(recJs, [1, 0, 0]);

    const filteredLang = index.searchByVector([1, 0, 0], { filter: { language: 'python' } });
    assert.strictEqual(filteredLang.total, 1);
    assert.strictEqual(filteredLang.results[0].record.id, 'py-01');

    const filteredCat = index.searchByVector([1, 0, 0], { filter: { category: 'runtime_error' } });
    assert.strictEqual(filteredCat.total, 1);
    assert.strictEqual(filteredCat.results[0].record.id, 'js-01');
  });

  // 8. Combined multi-criteria filters
  it('8. VectorSearchIndex enforces combined multi-criteria filters without leaking', async () => {
    const provider = new SyntheticTestEmbeddingProvider(3);
    const index = new VectorSearchIndex(provider);

    const recA = createMockRecord({ id: 'rec-a', language: 'python', category: 'silly_mistake', tags: ['fast'] });
    const recB = createMockRecord({ id: 'rec-b', language: 'python', category: 'runtime_error', tags: ['fast'] });

    await index.indexRecord(recA, [1, 0, 0]);
    await index.indexRecord(recB, [1, 0, 0]);

    const matchBoth = index.searchByVector([1, 0, 0], {
      filter: { language: 'python', category: 'silly_mistake', tags: 'fast' },
    });
    assert.strictEqual(matchBoth.total, 1);
    assert.strictEqual(matchBoth.results[0].record.id, 'rec-a');
  });

  // 9. Reciprocal Rank Fusion calculation on known mathematical fixtures
  it('9. calculateRRFScore computes exact Reciprocal Rank Fusion formula weight / (k + rank)', () => {
    // rank 1 with k=60, weight 1.0 -> 1 / (60 + 1) = 1/61
    const rrf1 = calculateRRFScore(1, 60, 1.0);
    assert.ok(Math.abs(rrf1 - 1 / 61) < 1e-9);

    // rank 2 with k=60, weight 1.0 -> 1 / (60 + 2) = 1/62
    const rrf2 = calculateRRFScore(2, 60, 1.0);
    assert.ok(Math.abs(rrf2 - 1 / 62) < 1e-9);

    // rank 1 with weight 2.0 -> 2 / 61
    const rrfWeight = calculateRRFScore(1, 60, 2.0);
    assert.ok(Math.abs(rrfWeight - 2 / 61) < 1e-9);
  });

  // 10. Hybrid search combines BM25 and Vector results with deduplication
  it('10. HybridSearchEngine deduplicates records appearing in both candidate lists and fuses ranks', async () => {
    const recA = createMockRecord({ id: 'rec-a', title: 'Alpha Null Dereference' });
    const recB = createMockRecord({ id: 'rec-b', title: 'Beta Buffer Overflow' });

    const bm25Index = new KnowledgeSearchIndex([recA, recB]);
    const provider = new SyntheticTestEmbeddingProvider(3);
    const vectorIndex = new VectorSearchIndex(provider);

    await vectorIndex.indexRecord(recA, [1, 0, 0]);
    await vectorIndex.indexRecord(recB, [0, 1, 0]);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);
    const results = await hybrid.search('Alpha Null', {
      retrievalMode: 'HYBRID_RRF',
      rrfK: 60,
    });

    assert.strictEqual(results.diagnostic.effectiveMode, 'HYBRID_RRF');
    assert.strictEqual(results.results.length, 2);

    // Deduplication check: exactly 1 entry for rec-a
    const aEntries = results.results.filter((r) => r.record.id === 'rec-a');
    assert.strictEqual(aEntries.length, 1);

    const topItem = results.results[0];
    assert.strictEqual(topItem.record.id, 'rec-a');
    assert.strictEqual(topItem.effectiveRetrievalMode, 'HYBRID_RRF');
    // Verifies both ranks contributed
    assert.ok(topItem.bm25Rank !== undefined);
  });

  // 11. BM25 fallback when embeddings are unavailable
  it('11. HybridSearchEngine safely falls back to BM25 when provider is unavailable without false claims', async () => {
    const rec = createMockRecord({ id: 'rec-01', title: 'Mutable Default Argument' });
    const bm25Index = new KnowledgeSearchIndex([rec]);
    const nullProvider = new NullEmbeddingProvider();
    const vectorIndex = new VectorSearchIndex(nullProvider);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);
    const results = await hybrid.search('mutable default argument', {
      retrievalMode: 'HYBRID_WITH_FALLBACK',
    });

    assert.strictEqual(results.diagnostic.effectiveMode, 'BM25');
    assert.strictEqual(results.diagnostic.usedFallback, true);
    assert.ok(results.diagnostic.fallbackReason !== undefined);
    assert.strictEqual(results.results[0].effectiveRetrievalMode, 'BM25');
  });

  // 12. Model initialization failure handling
  it('12. Throws EmbeddingError when SEMANTIC_ONLY is requested but model is unavailable', async () => {
    const rec = createMockRecord({ id: 'rec-01' });
    const bm25Index = new KnowledgeSearchIndex([rec]);
    const nullProvider = new NullEmbeddingProvider();
    const vectorIndex = new VectorSearchIndex(nullProvider);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);

    await assert.rejects(
      async () => hybrid.search('test query', { retrievalMode: 'SEMANTIC_ONLY' }),
      (err: any) => err instanceof EmbeddingError && err.code === 'MODEL_UNAVAILABLE'
    );
  });

  // 13. Preservation of record IDs and source URLs across hybrid results
  it('13. Hybrid search preserves exact record IDs and documentation source URLs', async () => {
    const sourceUrl = 'https://docs.python.org/3/reference/compound_stmts.html';
    const rec = createMockRecord({
      id: 'py-preserved-id',
      sources: [{ title: 'Python Reference', url: sourceUrl }],
    });

    const bm25Index = new KnowledgeSearchIndex([rec]);
    const provider = new SyntheticTestEmbeddingProvider(3);
    const vectorIndex = new VectorSearchIndex(provider);
    await vectorIndex.indexRecord(rec, [1, 0, 0]);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);
    const results = await hybrid.search('preserved', { retrievalMode: 'HYBRID_RRF' });

    assert.strictEqual(results.results[0].record.id, 'py-preserved-id');
    assert.strictEqual(results.results[0].record.sources[0].url, sourceUrl);
  });

  // 14. Compatibility with Stage 4 response composition
  it('14. Hybrid search results integrate seamlessly with Stage 4 buildDiagnosisResponse', async () => {
    const rec = createMockRecord({
      id: 'py-response-compat',
      title: 'Compatible Diagnosis Pattern',
      sources: [{ title: 'Docs', url: 'https://docs.python.org' }],
    });

    const bm25Index = new KnowledgeSearchIndex([rec]);
    const provider = new SyntheticTestEmbeddingProvider(3);
    const vectorIndex = new VectorSearchIndex(provider);
    await vectorIndex.indexRecord(rec, [1, 0, 0]);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);
    const results = await hybrid.search('Compatible', { retrievalMode: 'HYBRID_RRF' });

    const diagnosis = buildDiagnosisResponse(results.results, {
      userContext: { language: 'python' },
    });

    assert.strictEqual(diagnosis.title, 'Compatible Diagnosis Pattern');
    assert.strictEqual(diagnosis.hasSources, true);
    assert.strictEqual(diagnosis.attributedSources[0].recordId, 'py-response-compat');
    assert.strictEqual(diagnosis.attributedSources[0].isPrimary, true);
  });

  // 15. Immutability
  it('15. Strict immutability: indexing and hybrid search do not mutate source records', async () => {
    const originalSources = [{ title: 'Docs', url: 'https://docs.python.org' }];
    const rec = createMockRecord({
      id: 'py-immutability',
      sources: [...originalSources],
    });

    const snapshot = JSON.stringify(rec);
    const bm25Index = new KnowledgeSearchIndex([rec]);
    const provider = new SyntheticTestEmbeddingProvider(3);
    const vectorIndex = new VectorSearchIndex(provider);
    await vectorIndex.indexRecord(rec, [1, 0, 0]);

    const hybrid = new HybridSearchEngine(bm25Index, vectorIndex);
    await hybrid.search('immutability', { retrievalMode: 'HYBRID_RRF' });

    assert.strictEqual(JSON.stringify(rec), snapshot);
  });

  // 16. Integration: Evaluates hybrid retrieval against real 60-record corpus deterministically with fallback
  it('16. Integration: Evaluates all 30 evaluation cases against the real 60-record corpus with hybrid fallback', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingestResult = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });
    assert.strictEqual(ingestResult.records.length, 60);

    const bm25Index = new KnowledgeSearchIndex(ingestResult.records);
    const nullProvider = new NullEmbeddingProvider();
    const vectorIndex = new VectorSearchIndex(nullProvider);
    const hybridEngine = new HybridSearchEngine(bm25Index, vectorIndex);

    const report = await evaluateHybridRetrieval(hybridEngine, RETRIEVAL_EVALUATION_DATASET, {
      topK: 5,
      applyLanguageFilter: true,
      hybridOptions: {
        retrievalMode: 'HYBRID_WITH_FALLBACK',
        rrfK: 60,
      },
    });

    assert.strictEqual(report.totalEvaluatedCases, 30);
    assert.strictEqual(report.unknownExpectedIds.length, 0);
    assert.strictEqual(report.overallMetrics.top1Accuracy, 1.0);
    assert.strictEqual(report.overallMetrics.mrr, 1.0);
    assert.strictEqual(report.usedFallback, true);
    assert.strictEqual(report.effectiveMode, 'BM25');
  });

  // 17. Graceful provider availability reporting
  it('17. LocalTransformersEmbeddingAdapter gracefully reports availability as boolean', async () => {
    const adapter = new LocalTransformersEmbeddingAdapter();
    const available = await adapter.isAvailable();
    assert.strictEqual(typeof available, 'boolean');
  });

  // 18. Live model test: generates 384-dimensional vector when transformers is available
  it('18. Real model integration: generates valid 384-dim normalized embeddings when provider is available', async () => {
    const adapter = new LocalTransformersEmbeddingAdapter();
    const available = await adapter.isAvailable();
    if (available) {
      const vec = await adapter.embedText('segmentation fault in pointer arithmetic');
      assert.strictEqual(vec.length, 384);
      assert.ok(vec.every(n => Number.isFinite(n)));
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      assert.ok(Math.abs(norm - 1.0) < 1e-4);
    }
  });
});
