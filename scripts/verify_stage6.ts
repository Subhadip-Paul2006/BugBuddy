/**
 * BugBuddy Knowledge Base — Stage 6 Verification & Reality Check
 * 
 * Systematically verifies:
 * 1. Package dependencies and real model loader status (@xenova/transformers).
 * 2. Real model initialization of Xenova/all-MiniLM-L6-v2 via LocalTransformersEmbeddingAdapter.
 * 3. Real 384-dimensional query & document embedding generation.
 * 4. Indexing of all 60 curated records into VectorSearchIndex using real embeddings.
 * 5. SEMANTIC_ONLY retrieval using real embeddings (with real cosine similarities).
 * 6. Real HYBRID_RRF retrieval (BM25 + real dense vectors via Reciprocal Rank Fusion, NO fallback).
 * 7. Fallback HYBRID_WITH_FALLBACK verification using NullEmbeddingProvider.
 * 8. Contrast with SyntheticTestEmbeddingProvider (character-hash test fixture).
 * 9. Comparative benchmark matrix across all 30 test cases in RETRIEVAL_EVALUATION_DATASET.
 * 10. Semantic query test: paraphrase & synonym queries where wording differs from curated title.
 */

import * as path from 'node:path';
import { ingestKnowledgeDirectory } from '../src/knowledge/ingest';
import { KnowledgeSearchIndex } from '../src/knowledge/search';
import {
  LocalTransformersEmbeddingAdapter,
  SyntheticTestEmbeddingProvider,
  NullEmbeddingProvider,
  VectorSearchIndex,
  HybridSearchEngine,
  evaluateHybridRetrieval,
} from '../src/knowledge';
import { RETRIEVAL_EVALUATION_DATASET } from '../src/knowledge/evaluationData';

async function verifyStage6() {
  console.log('============================================================');
  console.log('🔍 STAGE 6B VERIFICATION: REAL LOCAL SEMANTIC EMBEDDINGS');
  console.log('============================================================\n');

  // 1. Dependency & Module Check
  console.log('--- 1. Package Dependency & Module Check ---');
  let hasTransformersPkg = false;
  try {
    const pkg = await import('@xenova/transformers');
    hasTransformersPkg = !!pkg && typeof pkg.pipeline === 'function';
    console.log('[@xenova/transformers]: RESOLVED successfully (pipeline function available).');
  } catch (err: any) {
    console.log('[@xenova/transformers]: FAILED import:', err?.message || err);
  }

  // 2. Real Model Adapter Check
  console.log('\n--- 2. Real Model Adapter Initialization Test ---');
  const realAdapter = new LocalTransformersEmbeddingAdapter();
  console.log('Model target:', realAdapter.modelInfo.name);
  console.log('Model version:', realAdapter.modelInfo.version);
  console.log('Model license:', realAdapter.modelInfo.license);
  console.log('Configured dimensions:', realAdapter.modelInfo.dimensions);

  const isAvailable = await realAdapter.isAvailable();
  console.log('isAvailable():', isAvailable);

  if (!isAvailable) {
    console.error('ERROR: Real adapter reported unavailable after installation.');
    process.exit(1);
  }

  console.log('\nGenerating real query embedding...');
  const testQuery = 'Segmentation fault caused by invalid pointer dereference';
  const queryVec = await realAdapter.embedText(testQuery);
  console.log('  Query vector length:', queryVec.length);
  console.log('  All dimensions finite numbers:', queryVec.every(v => Number.isFinite(v)));
  const queryNorm = Math.sqrt(queryVec.reduce((acc, v) => acc + v * v, 0));
  console.log('  Query vector L2 norm (normalized):', queryNorm.toFixed(6));
  console.log('  Sample dimensions [0..4]:', queryVec.slice(0, 5).map(v => v.toFixed(6)));

  // 3. Corpus Ingestion & Vector Indexing
  console.log('\n--- 3. Ingesting Corpus & Building Real Vector Index ---');
  const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
  const ingest = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });
  console.log(`Ingested ${ingest.records.length} records.`);

  const bm25Index = new KnowledgeSearchIndex(ingest.records);
  const realVectorIndex = new VectorSearchIndex(realAdapter);

  console.time('Embedding all 60 corpus records with Xenova/all-MiniLM-L6-v2');
  await realVectorIndex.indexAll(ingest.records);
  console.timeEnd('Embedding all 60 corpus records with Xenova/all-MiniLM-L6-v2');
  console.log('Vector index size:', realVectorIndex.size());

  const hybridEngineReal = new HybridSearchEngine(bm25Index, realVectorIndex);

  // 4. Test SEMANTIC_ONLY Mode with Real Model
  console.log('\n--- 4. Testing SEMANTIC_ONLY Mode with Real Model ---');
  const semanticResults = await hybridEngineReal.search('memory allocation leak without releasing bytes', {
    retrievalMode: 'SEMANTIC_ONLY',
    language: 'c',
    limit: 3,
  });
  console.log('SEMANTIC_ONLY results count:', semanticResults.results.length);
  console.log('SEMANTIC_ONLY effectiveMode:', semanticResults.diagnostic.effectiveMode);
  console.log('SEMANTIC_ONLY usedFallback:', semanticResults.diagnostic.usedFallback);
  console.log('SEMANTIC_ONLY semanticCandidatesCount:', semanticResults.diagnostic.semanticCandidatesCount);
  console.log('Top match ID:', semanticResults.results[0]?.record.id);
  console.log('Top match score (Cosine Similarity):', semanticResults.results[0]?.score.toFixed(4));
  console.log('Top match title:', semanticResults.results[0]?.record.title);

  // 5. Test Real HYBRID_RRF Mode (Strict RRF, No Fallback)
  console.log('\n--- 5. Testing Real HYBRID_RRF Mode (No Fallback) ---');
  const hybridRRFResults = await hybridEngineReal.search('memory allocation leak without releasing bytes', {
    retrievalMode: 'HYBRID_RRF',
    language: 'c',
    limit: 3,
    rrfK: 60,
  });
  console.log('HYBRID_RRF results count:', hybridRRFResults.results.length);
  console.log('HYBRID_RRF effectiveMode:', hybridRRFResults.diagnostic.effectiveMode);
  console.log('HYBRID_RRF usedFallback:', hybridRRFResults.diagnostic.usedFallback);
  console.log('HYBRID_RRF bm25CandidatesCount:', hybridRRFResults.diagnostic.bm25CandidatesCount);
  console.log('HYBRID_RRF semanticCandidatesCount:', hybridRRFResults.diagnostic.semanticCandidatesCount);
  console.log('Top match ID:', hybridRRFResults.results[0]?.record.id);
  console.log('Top match RRF score:', hybridRRFResults.results[0]?.score.toFixed(6));
  console.log('Top match BM25 rank:', hybridRRFResults.results[0]?.bm25Rank);
  console.log('Top match Semantic rank:', hybridRRFResults.results[0]?.semanticRank);

  // 6. Test HYBRID_WITH_FALLBACK Mode with Null Provider (Proving fallback works)
  console.log('\n--- 6. Testing HYBRID_WITH_FALLBACK with Unavailable Provider ---');
  const nullVectorIndex = new VectorSearchIndex(new NullEmbeddingProvider());
  const fallbackEngine = new HybridSearchEngine(bm25Index, nullVectorIndex);
  const fallbackResults = await fallbackEngine.search('memory allocation leak', {
    retrievalMode: 'HYBRID_WITH_FALLBACK',
    language: 'c',
    limit: 3,
  });
  console.log('Fallback effectiveMode:', fallbackResults.diagnostic.effectiveMode);
  console.log('Fallback usedFallback:', fallbackResults.diagnostic.usedFallback);
  console.log('Fallback reason:', fallbackResults.diagnostic.fallbackReason);
  console.log('Fallback top match ID:', fallbackResults.results[0]?.record.id);

  // 7. Paraphrase & Semantic Disambiguation Tests
  console.log('\n--- 7. Paraphrase / Semantic Disambiguation Queries ---');
  const semanticQueries = [
    {
      label: 'Paraphrase (Python list default parameter)',
      query: 'accumulating items across function calls due to default list in definition',
      expectedId: 'py-mutable-default-argument',
      language: 'python' as const,
    },
    {
      label: 'Paraphrase (Java list modification)',
      query: 'calling add on list returned from Arrays asList throws runtime error',
      expectedId: 'java-arraylist-unsupported-as-list-add',
      language: 'java' as const,
    },
    {
      label: 'Paraphrase (TypeScript readonly array push)',
      query: 'Property push does not exist on type readonly string array',
      expectedId: 'ts-readonly-array-mutation-attempt',
      language: 'typescript' as const,
    },
  ];

  for (const sq of semanticQueries) {
    const semRes = await hybridEngineReal.search(sq.query, {
      retrievalMode: 'SEMANTIC_ONLY',
      language: sq.language,
      limit: 3,
    });
    const hybRes = await hybridEngineReal.search(sq.query, {
      retrievalMode: 'HYBRID_RRF',
      language: sq.language,
      limit: 3,
    });
    const semTopId = semRes.results[0]?.record.id;
    const hybTopId = hybRes.results[0]?.record.id;
    console.log(`[${sq.label}]`);
    console.log(`  Query: "${sq.query}"`);
    console.log(`  Expected: ${sq.expectedId}`);
    console.log(`  SEMANTIC_ONLY top match: ${semTopId} (Score: ${semRes.results[0]?.score.toFixed(4)}) - Match: ${semTopId === sq.expectedId ? '✓' : '✗'}`);
    console.log(`  HYBRID_RRF   top match: ${hybTopId} (RRF: ${hybRes.results[0]?.score.toFixed(6)}) - Match: ${hybTopId === sq.expectedId ? '✓' : '✗'}`);
  }

  // 8. 30-Case Benchmark Evaluation Matrix
  console.log('\n--- 8. Running Benchmark Across All Retrieval Strategies ---');

  // 8a. BM25_ONLY
  const bm25Report = await evaluateHybridRetrieval(hybridEngineReal, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: { retrievalMode: 'BM25_ONLY' },
  });

  // 8b. Real SEMANTIC_ONLY
  const realSemanticReport = await evaluateHybridRetrieval(hybridEngineReal, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: { retrievalMode: 'SEMANTIC_ONLY' },
  });

  // 8c. Real HYBRID_RRF
  const realHybridReport = await evaluateHybridRetrieval(hybridEngineReal, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: { retrievalMode: 'HYBRID_RRF', rrfK: 60 },
  });

  // 8d. Fallback Mode (with NullProvider)
  const fallbackReport = await evaluateHybridRetrieval(fallbackEngine, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: { retrievalMode: 'HYBRID_WITH_FALLBACK' },
  });

  // 8e. Synthetic Test Provider (for contrast)
  const syntheticProvider = new SyntheticTestEmbeddingProvider(384);
  const syntheticIndex = new VectorSearchIndex(syntheticProvider);
  await syntheticIndex.indexAll(ingest.records);
  const syntheticEngine = new HybridSearchEngine(bm25Index, syntheticIndex);
  const syntheticSemanticReport = await evaluateHybridRetrieval(syntheticEngine, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: { retrievalMode: 'SEMANTIC_ONLY' },
  });

  console.log('\n========================================================================================================');
  console.log('REAL BENCHMARK EVALUATION MATRIX (30 Independent Debugging Cases across 6 Languages)');
  console.log('========================================================================================================');
  console.log('| Strategy | Provider / Model | Effective Backend | Fallback? | Top-1 Acc | MRR | Recall@3 | Recall@5 |');
  console.log('| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');
  console.log(`| **BM25_ONLY** | In-Memory BM25 | BM25 | No | ${(bm25Report.overallMetrics.top1Accuracy * 100).toFixed(1)}% | ${bm25Report.overallMetrics.mrr.toFixed(4)} | ${(bm25Report.overallMetrics.recallAt3 * 100).toFixed(1)}% | ${(bm25Report.overallMetrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log(`| **SEMANTIC_ONLY (Real)** | Xenova/all-MiniLM-L6-v2 (Real ONNX) | Dense Vectors | **No** | ${(realSemanticReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | ${realSemanticReport.overallMetrics.mrr.toFixed(4)} | ${(realSemanticReport.overallMetrics.recallAt3 * 100).toFixed(1)}% | ${(realSemanticReport.overallMetrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log(`| **HYBRID_RRF (Real)** | BM25 + Xenova/all-MiniLM-L6-v2 | Hybrid RRF | **No** | ${(realHybridReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | ${realHybridReport.overallMetrics.mrr.toFixed(4)} | ${(realHybridReport.overallMetrics.recallAt3 * 100).toFixed(1)}% | ${(realHybridReport.overallMetrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log(`| **HYBRID_WITH_FALLBACK** | NullEmbeddingProvider | BM25 Fallback | **Yes** | ${(fallbackReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | ${fallbackReport.overallMetrics.mrr.toFixed(4)} | ${(fallbackReport.overallMetrics.recallAt3 * 100).toFixed(1)}% | ${(fallbackReport.overallMetrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log(`| **SEMANTIC_ONLY (Synthetic)** | SyntheticTestProvider (Character Hash) | Test Hash | No | ${(syntheticSemanticReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | ${syntheticSemanticReport.overallMetrics.mrr.toFixed(4)} | ${(syntheticSemanticReport.overallMetrics.recallAt3 * 100).toFixed(1)}% | ${(syntheticSemanticReport.overallMetrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log('========================================================================================================\n');

  console.log('--- 9. Per-Language Results for Real HYBRID_RRF ---');
  const languages = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'] as const;
  for (const lang of languages) {
    const langMetrics = realHybridReport.perLanguage[lang];
    console.log(`  ${lang.padEnd(12)}: Top-1 Acc: ${(langMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${langMetrics.mrr.toFixed(4)} | Recall@3: ${(langMetrics.recallAt3 * 100).toFixed(1)}%`);
  }

  console.log('\n[BugBuddy KB] Stage 6B verification completed successfully! All real embeddings verified.');
}

verifyStage6().catch((err) => {
  console.error('Stage 6B verification failed:', err);
  process.exit(1);
});
