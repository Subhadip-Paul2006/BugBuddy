#!/usr/bin/env node
/**
 * BugBuddy Knowledge Base — Retrieval Quality Evaluation CLI
 * 
 * Runs deterministic retrieval evaluations of the BM25 search index against
 * the independent evaluation dataset covering all 6 programming languages.
 * 
 * Usage:
 *   npm run evaluate:retrieval
 *   npx tsx scripts/evaluate_retrieval.ts
 */

import * as path from 'node:path';
import { ingestKnowledgeDirectory } from '../src/knowledge/ingest';
import { KnowledgeSearchIndex } from '../src/knowledge/search';
import {
  RETRIEVAL_EVALUATION_DATASET,
  HELD_OUT_EVALUATION_DATASET,
} from '../src/knowledge/evaluationData';
import {
  evaluateRetrieval,
  formatEvaluationReportMarkdown,
} from '../src/knowledge/evaluator';

async function main() {
  const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
  console.log(`[BugBuddy KB] Ingesting knowledge directory: ${knowledgeDir}`);

  const ingestResult = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });
  if (!ingestResult.success || ingestResult.records.length === 0) {
    console.error(`[BugBuddy KB] Ingestion failed or returned 0 records.`);
    process.exit(1);
  }

  console.log(`[BugBuddy KB] Indexing ${ingestResult.records.length} records into BM25 Search Index...`);
  const index = new KnowledgeSearchIndex(ingestResult.records);

  console.log(`\n============================================================`);
  console.log(`RUN 1: Raw Keyword Retrieval (Without Language Filter)`);
  console.log(`Tests raw query discriminating power across all 60 corpus records`);
  console.log(`============================================================\n`);

  const rawReport = evaluateRetrieval(index, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: false,
  });

  console.log(formatEvaluationReportMarkdown(rawReport));

  console.log(`\n============================================================`);
  console.log(`RUN 2: Language-Scoped Retrieval (With Language Filter)`);
  console.log(`Tests search precision when developer selects active language`);
  console.log(`============================================================\n`);

  const scopedReport = evaluateRetrieval(index, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
  });

  console.log(formatEvaluationReportMarkdown(scopedReport));

  // Exit with error if any expected record ID is missing from corpus
  if (rawReport.unknownExpectedIds.length > 0) {
    console.error(
      `[BugBuddy KB] Evaluation failed: ${rawReport.unknownExpectedIds.length} expected IDs do not exist in corpus!`
    );
    process.exit(1);
  }

  // Ensure reasonable baseline thresholds
  if (scopedReport.overallMetrics.mrr < 0.70 || scopedReport.overallMetrics.recallAt5 < 0.80) {
    console.error(
      `[BugBuddy KB] Evaluation failed: Scoped retrieval below minimum quality thresholds (MRR >= 0.70, Recall@5 >= 0.80).`
    );
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`RUN 3: Real Semantic Retrieval (Dense Vectors Only)`);
  console.log(`Tests pure embedding similarity without keyword tokens`);
  console.log(`============================================================\n`);

  const {
    LocalTransformersEmbeddingAdapter,
    NullEmbeddingProvider,
    VectorSearchIndex,
    HybridSearchEngine,
    evaluateHybridRetrieval,
  } = await import('../src/knowledge');

  const localAdapter = new LocalTransformersEmbeddingAdapter();
  const isModelAvail = await localAdapter.isAvailable();
  console.log(`[BugBuddy KB] Local embedding model available: ${isModelAvail}`);

  const vectorIndex = new VectorSearchIndex(localAdapter);
  if (isModelAvail) {
    console.log(`[BugBuddy KB] Embedding ${ingestResult.records.length} records into dense vector index...`);
    await vectorIndex.indexAll(ingestResult.records);
  }

  const hybridEngine = new HybridSearchEngine(index, vectorIndex);

  let semanticReport;
  if (isModelAvail) {
    semanticReport = await evaluateHybridRetrieval(hybridEngine, RETRIEVAL_EVALUATION_DATASET, {
      topK: 5,
      applyLanguageFilter: true,
      hybridOptions: {
        retrievalMode: 'SEMANTIC_ONLY',
      },
    });
    console.log(formatEvaluationReportMarkdown(semanticReport));
  } else {
    console.log('[BugBuddy KB] Skipping Run 3: Local embedding model unavailable.');
  }

  console.log(`\n============================================================`);
  console.log(`RUN 4: Real Hybrid Retrieval (BM25 + Dense Vectors via RRF)`);
  console.log(`Tests Reciprocal Rank Fusion of keyword and vector candidates`);
  console.log(`============================================================\n`);

  const hybridReport = await evaluateHybridRetrieval(hybridEngine, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: {
      retrievalMode: isModelAvail ? 'HYBRID_RRF' : 'HYBRID_WITH_FALLBACK',
      rrfK: 60,
    },
  });

  console.log(formatEvaluationReportMarkdown(hybridReport));

  console.log(`\n============================================================`);
  console.log(`RUN 5: Graceful Fallback Mode (Simulated Unavailable Model)`);
  console.log(`Proves transparent fallback to BM25 when model is offline`);
  console.log(`============================================================\n`);

  const fallbackEngine = new HybridSearchEngine(index, new VectorSearchIndex(new NullEmbeddingProvider()));
  const fallbackReport = await evaluateHybridRetrieval(fallbackEngine, RETRIEVAL_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: true,
    hybridOptions: {
      retrievalMode: 'HYBRID_WITH_FALLBACK',
      rrfK: 60,
    },
  });

  console.log(formatEvaluationReportMarkdown(fallbackReport));

  console.log(`\n============================================================`);
  console.log(`RUN 6: Stage 8 Held-Out Benchmark Evaluation (30 Cases)`);
  console.log(`Evaluates 24 challenging language cases + 6 unsupported queries`);
  console.log(`============================================================\n`);

  const heldOutBM25Report = evaluateRetrieval(index, HELD_OUT_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: false,
  });

  console.log('--- Held-Out Benchmark (BM25 Raw Retrieval) ---');
  console.log(formatEvaluationReportMarkdown(heldOutBM25Report));

  const heldOutHybridReport = await evaluateHybridRetrieval(hybridEngine, HELD_OUT_EVALUATION_DATASET, {
    topK: 5,
    applyLanguageFilter: false,
    hybridOptions: {
      retrievalMode: 'HYBRID_RRF',
      rrfK: 60,
    },
  });

  console.log('--- Held-Out Benchmark (Hybrid RRF Retrieval) ---');
  console.log(formatEvaluationReportMarkdown(heldOutHybridReport));

  console.log(`\n============================================================`);
  console.log(`Comprehensive Benchmark Comparison Summary`);
  console.log(`============================================================`);
  console.log(`[Development Benchmark (30 Cases)]`);
  console.log(`- BM25 Scoped Top-1 Accuracy: ${(scopedReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${scopedReport.overallMetrics.mrr.toFixed(4)}`);
  if (semanticReport) {
    console.log(`- Semantic-Only Top-1 Acc   : ${(semanticReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${semanticReport.overallMetrics.mrr.toFixed(4)}`);
  }
  console.log(`- Hybrid RRF Top-1 Accuracy : ${(hybridReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${hybridReport.overallMetrics.mrr.toFixed(4)}`);
  console.log(`- Simulated Fallback Top-1  : ${(fallbackReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% (Fallback: ${fallbackReport.usedFallback})`);
  console.log(`\n[Held-Out Benchmark (30 Cases: 24 Language Cases + 6 Unsupported)]`);
  console.log(`- Held-Out BM25 Top-1 Acc   : ${(heldOutBM25Report.overallMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${heldOutBM25Report.overallMetrics.mrr.toFixed(4)}`);
  console.log(`- Held-Out Hybrid Top-1 Acc : ${(heldOutHybridReport.overallMetrics.top1Accuracy * 100).toFixed(1)}% | MRR: ${heldOutHybridReport.overallMetrics.mrr.toFixed(4)}`);
  console.log(`- Recall@3: BM25=${(heldOutBM25Report.overallMetrics.recallAt3 * 100).toFixed(1)}% | Hybrid=${(heldOutHybridReport.overallMetrics.recallAt3 * 100).toFixed(1)}%`);
  console.log(`- Recall@5: BM25=${(heldOutBM25Report.overallMetrics.recallAt5 * 100).toFixed(1)}% | Hybrid=${(heldOutHybridReport.overallMetrics.recallAt5 * 100).toFixed(1)}%`);
  console.log(`============================================================\n`);

  console.log(`[BugBuddy KB] Retrieval evaluation completed successfully!`);
}

main().catch((err) => {
  console.error('[BugBuddy KB] Unexpected error running retrieval evaluation:', err);
  process.exit(1);
});
