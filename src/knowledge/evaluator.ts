/**
 * BugBuddy Knowledge Base — Retrieval Evaluation Engine
 * 
 * Implements deterministic search evaluation against the BM25 retrieval index.
 * Calculates standard information-retrieval benchmarks:
 * - Recall@K (K=1, 3, 5)
 * - Precision@K (K=1, 3)
 * - Mean Reciprocal Rank (MRR)
 * - Top-1 Exact Accuracy
 * - Language filter compliance
 * - Ranking weakness diagnostics
 */

import { KnowledgeSearchIndex, SearchOptions } from './search';
import { EvaluationCase } from './evaluationData';
import { CanonicalLanguage } from './types';
import { HybridSearchEngine, HybridSearchOptions } from './hybridSearch';

export interface EvaluationOptions {
  /** Top K cutoff for evaluating recall and precision (default: 5) */
  topK?: number;
  /** Whether to apply language filter during retrieval (default: false, evaluates raw query power) */
  applyLanguageFilter?: boolean;
  /** Whether to apply category filter during retrieval if present in case (default: false) */
  applyCategoryFilter?: boolean;
  /** Additional search options forwarded to index */
  searchOptions?: Partial<SearchOptions>;
  /** Optional hybrid search options when running against a hybrid engine */
  hybridOptions?: Partial<HybridSearchOptions>;
}

export interface CaseEvaluationResult {
  caseId: string;
  query: string;
  expectedLanguage: CanonicalLanguage;
  expectedRecordIds: string[];
  primaryExpectedId: string;
  retrievedIds: string[];
  retrievedScores: number[];
  primaryRank: number | null; // 1-based, null if not in topK
  reciprocalRank: number;
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  precisionAt1: number;
  precisionAt3: number;
  hitAt1: boolean;
  hitAt3: boolean;
  hitAt5: boolean;
  filterCompliant: boolean;
  notes?: string;
}

export interface AggregateMetrics {
  totalCases: number;
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  precisionAt1: number;
  precisionAt3: number;
  mrr: number;
  top1Accuracy: number;
  filterComplianceRate: number;
}

export interface LanguageEvaluationSummary {
  language: CanonicalLanguage;
  caseCount: number;
  metrics: AggregateMetrics;
}

export interface RankingWeakness {
  caseId: string;
  language: CanonicalLanguage;
  query: string;
  primaryExpectedId: string;
  actualTopId: string | null;
  actualTopScore: number | null;
  expectedRank: number | null;
  expectedScore: number | null;
  diagnostic: string;
}

export interface RetrievalEvaluationReport {
  timestamp: string;
  totalCorpusRecords: number;
  totalEvaluatedCases: number;
  options: EvaluationOptions;
  overallMetrics: AggregateMetrics;
  perLanguage: Record<CanonicalLanguage, AggregateMetrics>;
  unknownExpectedIds: string[];
  rankingWeaknesses: RankingWeakness[];
  retrievalMode?: string;
  effectiveMode?: string;
  providerName?: string;
  usedFallback?: boolean;
  fallbackReason?: string;
}

/**
 * Validates that all expected IDs in the evaluation dataset exist in the indexed corpus.
 */
export function findUnknownExpectedIds(
  index: KnowledgeSearchIndex,
  dataset: EvaluationCase[]
): string[] {
  const allIndexedIds = new Set(index.getAllRecords().map((r) => r.id));
  const unknown = new Set<string>();

  for (const item of dataset) {
    if (item.isUnsupported) continue;
    for (const expId of item.expectedRecordIds) {
      if (!allIndexedIds.has(expId)) {
        unknown.add(expId);
      }
    }
  }

  return Array.from(unknown);
}

/**
 * Evaluates a single query case against the search index.
 */
export function evaluateRetrievalCase(
  index: KnowledgeSearchIndex,
  evalCase: EvaluationCase,
  options: EvaluationOptions = {}
): CaseEvaluationResult {
  const topK = options.topK || 5;
  const searchFilter = { ...options.searchOptions?.filter };

  if (options.applyLanguageFilter && evalCase.expectedLanguage) {
    searchFilter.language = evalCase.expectedLanguage;
  }
  if (options.applyCategoryFilter && evalCase.expectedCategory) {
    searchFilter.category = evalCase.expectedCategory;
  }

  const searchResults = index.search(evalCase.query, {
    limit: topK,
    filter: Object.keys(searchFilter).length > 0 ? searchFilter : undefined,
    ...options.searchOptions,
  });

  const retrievedItems = searchResults.results.slice(0, topK);
  const retrievedIds = retrievedItems.map((r) => r.record.id);
  const retrievedScores = retrievedItems.map((r) => r.score);

  if (evalCase.isUnsupported) {
    const isHonestNoMatch = retrievedItems.length === 0 || (retrievedScores[0] || 0) < 1.0;
    return {
      caseId: evalCase.id,
      query: evalCase.query,
      expectedLanguage: evalCase.expectedLanguage || ('c' as CanonicalLanguage),
      expectedRecordIds: [],
      primaryExpectedId: '',
      retrievedIds,
      retrievedScores,
      primaryRank: null,
      reciprocalRank: isHonestNoMatch ? 1 : 0,
      recallAt1: isHonestNoMatch ? 1 : 0,
      recallAt3: isHonestNoMatch ? 1 : 0,
      recallAt5: isHonestNoMatch ? 1 : 0,
      precisionAt1: isHonestNoMatch ? 1 : 0,
      precisionAt3: isHonestNoMatch ? 1 : 0,
      hitAt1: isHonestNoMatch,
      hitAt3: isHonestNoMatch,
      hitAt5: isHonestNoMatch,
      filterCompliant: true,
      notes: isHonestNoMatch ? 'Honest no-match: unsupported query correctly avoided false positive' : 'Low confidence match on unsupported query',
    };
  }

  const primaryExpectedId = evalCase.expectedRecordIds[0];
  const expectedSet = new Set(evalCase.expectedRecordIds);

  // Determine rank of primary expected record
  const primaryIndex = retrievedIds.indexOf(primaryExpectedId);
  const primaryRank = primaryIndex >= 0 ? primaryIndex + 1 : null;
  const reciprocalRank = primaryRank !== null ? 1 / primaryRank : 0;

  // Recall@K: fraction of expected relevant items found in top K
  const hitsAt1 = retrievedIds.slice(0, 1).filter((id) => expectedSet.has(id)).length;
  const hitsAt3 = retrievedIds.slice(0, 3).filter((id) => expectedSet.has(id)).length;
  const hitsAt5 = retrievedIds.slice(0, 5).filter((id) => expectedSet.has(id)).length;

  const totalExpected = evalCase.expectedRecordIds.length;
  const recallAt1 = totalExpected > 0 ? hitsAt1 / totalExpected : 0;
  const recallAt3 = totalExpected > 0 ? hitsAt3 / totalExpected : 0;
  const recallAt5 = totalExpected > 0 ? hitsAt5 / totalExpected : 0;

  // Precision@K: fraction of top K retrieved items that are expected
  const precisionAt1 = retrievedIds.length >= 1 ? hitsAt1 / 1 : 0;
  const precisionAt3 = retrievedIds.length > 0 ? hitsAt3 / Math.min(3, retrievedIds.length) : 0;

  // Top-1 Accuracy: is primary expected record ranked #1?
  const hitAt1 = retrievedIds.length > 0 && retrievedIds[0] === primaryExpectedId;
  const hitAt3 = primaryRank !== null && primaryRank <= 3;
  const hitAt5 = primaryRank !== null && primaryRank <= 5;

  // Filter compliance verification
  let filterCompliant = true;
  if (options.applyLanguageFilter) {
    filterCompliant = retrievedItems.every(
      (item) => item.record.language === evalCase.expectedLanguage
    );
  }
  if (options.applyCategoryFilter && evalCase.expectedCategory && filterCompliant) {
    filterCompliant = retrievedItems.every(
      (item) => item.record.category === evalCase.expectedCategory
    );
  }

  return {
    caseId: evalCase.id,
    query: evalCase.query,
    expectedLanguage: evalCase.expectedLanguage,
    expectedRecordIds: evalCase.expectedRecordIds,
    primaryExpectedId,
    retrievedIds,
    retrievedScores,
    primaryRank,
    reciprocalRank,
    recallAt1,
    recallAt3,
    recallAt5,
    precisionAt1,
    precisionAt3,
    hitAt1,
    hitAt3,
    hitAt5,
    filterCompliant,
  };
}

/**
 * Computes aggregate summary metrics from a collection of case results.
 */
function computeAggregate(results: CaseEvaluationResult[]): AggregateMetrics {
  const count = results.length;
  if (count === 0) {
    return {
      totalCases: 0,
      recallAt1: 0,
      recallAt3: 0,
      recallAt5: 0,
      precisionAt1: 0,
      precisionAt3: 0,
      mrr: 0,
      top1Accuracy: 0,
      filterComplianceRate: 1,
    };
  }

  const sumRecallAt1 = results.reduce((acc, r) => acc + r.recallAt1, 0);
  const sumRecallAt3 = results.reduce((acc, r) => acc + r.recallAt3, 0);
  const sumRecallAt5 = results.reduce((acc, r) => acc + r.recallAt5, 0);
  const sumPrecisionAt1 = results.reduce((acc, r) => acc + r.precisionAt1, 0);
  const sumPrecisionAt3 = results.reduce((acc, r) => acc + r.precisionAt3, 0);
  const sumMRR = results.reduce((acc, r) => acc + r.reciprocalRank, 0);
  const sumHitAt1 = results.reduce((acc, r) => acc + (r.hitAt1 ? 1 : 0), 0);
  const sumFilter = results.reduce((acc, r) => acc + (r.filterCompliant ? 1 : 0), 0);

  return {
    totalCases: count,
    recallAt1: Number((sumRecallAt1 / count).toFixed(4)),
    recallAt3: Number((sumRecallAt3 / count).toFixed(4)),
    recallAt5: Number((sumRecallAt5 / count).toFixed(4)),
    precisionAt1: Number((sumPrecisionAt1 / count).toFixed(4)),
    precisionAt3: Number((sumPrecisionAt3 / count).toFixed(4)),
    mrr: Number((sumMRR / count).toFixed(4)),
    top1Accuracy: Number((sumHitAt1 / count).toFixed(4)),
    filterComplianceRate: Number((sumFilter / count).toFixed(4)),
  };
}

/**
 * Runs a deterministic retrieval evaluation of the indexed corpus against an evaluation dataset.
 */
export function evaluateRetrieval(
  index: KnowledgeSearchIndex,
  dataset: EvaluationCase[],
  options: EvaluationOptions = {}
): RetrievalEvaluationReport {
  const unknownExpectedIds = findUnknownExpectedIds(index, dataset);
  const caseResults: CaseEvaluationResult[] = [];
  const rankingWeaknesses: RankingWeakness[] = [];

  const languages: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];
  const perLanguageResults: Record<CanonicalLanguage, CaseEvaluationResult[]> = {
    c: [],
    cpp: [],
    java: [],
    python: [],
    javascript: [],
    typescript: [],
  };

  for (const testCase of dataset) {
    const result = evaluateRetrievalCase(index, testCase, options);
    caseResults.push(result);

    if (perLanguageResults[testCase.expectedLanguage]) {
      perLanguageResults[testCase.expectedLanguage].push(result);
    }

    // Flag ranking weakness if primary expected match is not #1
    if (!result.hitAt1) {
      let diagnostic = 'Primary expected record not ranked at position 1.';
      if (result.primaryRank === null) {
        diagnostic = `Expected record '${result.primaryExpectedId}' did not appear in top ${options.topK || 5} results.`;
      } else {
        diagnostic = `Expected record '${result.primaryExpectedId}' ranked at position #${result.primaryRank} behind '${result.retrievedIds[0]}'.`;
      }

      rankingWeaknesses.push({
        caseId: testCase.id,
        language: testCase.expectedLanguage,
        query: testCase.query,
        primaryExpectedId: result.primaryExpectedId,
        actualTopId: result.retrievedIds.length > 0 ? result.retrievedIds[0] : null,
        actualTopScore: result.retrievedScores.length > 0 ? result.retrievedScores[0] : null,
        expectedRank: result.primaryRank,
        expectedScore: result.primaryRank !== null ? result.retrievedScores[result.primaryRank - 1] : null,
        diagnostic,
      });
    }
  }

  const overallMetrics = computeAggregate(caseResults);
  const perLanguage: Record<CanonicalLanguage, AggregateMetrics> = {} as any;

  for (const lang of languages) {
    perLanguage[lang] = computeAggregate(perLanguageResults[lang]);
  }

  return {
    timestamp: new Date().toISOString(),
    totalCorpusRecords: index.getAllRecords().length,
    totalEvaluatedCases: dataset.length,
    options,
    overallMetrics,
    perLanguage,
    unknownExpectedIds,
    rankingWeaknesses,
    retrievalMode: 'BM25_ONLY',
    effectiveMode: 'BM25',
    usedFallback: false,
  };
}

/**
 * Evaluates a single query case against a HybridSearchEngine (async).
 */
export async function evaluateHybridRetrievalCase(
  engine: HybridSearchEngine,
  evalCase: EvaluationCase,
  options: EvaluationOptions = {}
): Promise<CaseEvaluationResult> {
  const topK = options.topK || 5;
  const searchFilter = { ...options.searchOptions?.filter };

  if (options.applyLanguageFilter && evalCase.expectedLanguage) {
    searchFilter.language = evalCase.expectedLanguage;
  }
  if (options.applyCategoryFilter && evalCase.expectedCategory) {
    searchFilter.category = evalCase.expectedCategory;
  }

  const searchResults = await engine.search(evalCase.query, {
    limit: topK,
    filter: Object.keys(searchFilter).length > 0 ? searchFilter : undefined,
    ...options.searchOptions,
    ...options.hybridOptions,
  });

  const retrievedItems = searchResults.results.slice(0, topK);
  const retrievedIds = retrievedItems.map((r) => r.record.id);
  const retrievedScores = retrievedItems.map((r) => r.score);

  if (evalCase.isUnsupported) {
    const isHonestNoMatch = retrievedItems.length === 0 || (retrievedScores[0] || 0) < 1.0;
    return {
      caseId: evalCase.id,
      query: evalCase.query,
      expectedLanguage: evalCase.expectedLanguage || ('c' as CanonicalLanguage),
      expectedRecordIds: [],
      primaryExpectedId: '',
      retrievedIds,
      retrievedScores,
      primaryRank: null,
      reciprocalRank: isHonestNoMatch ? 1 : 0,
      recallAt1: isHonestNoMatch ? 1 : 0,
      recallAt3: isHonestNoMatch ? 1 : 0,
      recallAt5: isHonestNoMatch ? 1 : 0,
      precisionAt1: isHonestNoMatch ? 1 : 0,
      precisionAt3: isHonestNoMatch ? 1 : 0,
      hitAt1: isHonestNoMatch,
      hitAt3: isHonestNoMatch,
      hitAt5: isHonestNoMatch,
      filterCompliant: true,
      notes: isHonestNoMatch ? 'Honest no-match: unsupported query correctly avoided false positive' : 'Low confidence match on unsupported query',
    };
  }

  const primaryExpectedId = evalCase.expectedRecordIds[0];
  const expectedSet = new Set(evalCase.expectedRecordIds);

  const primaryIndex = retrievedIds.indexOf(primaryExpectedId);
  const primaryRank = primaryIndex >= 0 ? primaryIndex + 1 : null;
  const reciprocalRank = primaryRank !== null ? 1 / primaryRank : 0;

  const hitsAt1 = retrievedIds.slice(0, 1).filter((id) => expectedSet.has(id)).length;
  const hitsAt3 = retrievedIds.slice(0, 3).filter((id) => expectedSet.has(id)).length;
  const hitsAt5 = retrievedIds.slice(0, 5).filter((id) => expectedSet.has(id)).length;

  const totalExpected = evalCase.expectedRecordIds.length;
  const recallAt1 = totalExpected > 0 ? hitsAt1 / totalExpected : 0;
  const recallAt3 = totalExpected > 0 ? hitsAt3 / totalExpected : 0;
  const recallAt5 = totalExpected > 0 ? hitsAt5 / totalExpected : 0;

  const precisionAt1 = retrievedIds.length >= 1 ? hitsAt1 / 1 : 0;
  const precisionAt3 = retrievedIds.length > 0 ? hitsAt3 / Math.min(3, retrievedIds.length) : 0;

  const hitAt1 = retrievedIds.length > 0 && retrievedIds[0] === primaryExpectedId;
  const hitAt3 = primaryRank !== null && primaryRank <= 3;
  const hitAt5 = primaryRank !== null && primaryRank <= 5;

  let filterCompliant = true;
  if (options.applyLanguageFilter) {
    filterCompliant = retrievedItems.every(
      (item) => item.record.language === evalCase.expectedLanguage
    );
  }
  if (options.applyCategoryFilter && evalCase.expectedCategory && filterCompliant) {
    filterCompliant = retrievedItems.every(
      (item) => item.record.category === evalCase.expectedCategory
    );
  }

  return {
    caseId: evalCase.id,
    query: evalCase.query,
    expectedLanguage: evalCase.expectedLanguage,
    expectedRecordIds: evalCase.expectedRecordIds,
    primaryExpectedId,
    retrievedIds,
    retrievedScores,
    primaryRank,
    reciprocalRank,
    recallAt1,
    recallAt3,
    recallAt5,
    precisionAt1,
    precisionAt3,
    hitAt1,
    hitAt3,
    hitAt5,
    filterCompliant,
  };
}

/**
 * Runs a deterministic hybrid retrieval evaluation against an evaluation dataset.
 */
export async function evaluateHybridRetrieval(
  engine: HybridSearchEngine,
  dataset: EvaluationCase[],
  options: EvaluationOptions = {}
): Promise<RetrievalEvaluationReport> {
  const bm25Index = engine.getBM25Index();
  const unknownExpectedIds = findUnknownExpectedIds(bm25Index, dataset);
  const caseResults: CaseEvaluationResult[] = [];
  const rankingWeaknesses: RankingWeakness[] = [];

  const languages: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];
  const perLanguageResults: Record<CanonicalLanguage, CaseEvaluationResult[]> = {
    c: [],
    cpp: [],
    java: [],
    python: [],
    javascript: [],
    typescript: [],
  };

  for (const testCase of dataset) {
    const result = await evaluateHybridRetrievalCase(engine, testCase, options);
    caseResults.push(result);

    if (perLanguageResults[testCase.expectedLanguage]) {
      perLanguageResults[testCase.expectedLanguage].push(result);
    }

    if (!result.hitAt1) {
      let diagnostic = 'Primary expected record not ranked at position 1.';
      if (result.primaryRank === null) {
        diagnostic = `Expected record '${result.primaryExpectedId}' did not appear in top ${options.topK || 5} results.`;
      } else {
        diagnostic = `Expected record '${result.primaryExpectedId}' ranked at position #${result.primaryRank} behind '${result.retrievedIds[0]}'.`;
      }

      rankingWeaknesses.push({
        caseId: testCase.id,
        language: testCase.expectedLanguage,
        query: testCase.query,
        primaryExpectedId: result.primaryExpectedId,
        actualTopId: result.retrievedIds.length > 0 ? result.retrievedIds[0] : null,
        actualTopScore: result.retrievedScores.length > 0 ? result.retrievedScores[0] : null,
        expectedRank: result.primaryRank,
        expectedScore: result.primaryRank !== null ? result.retrievedScores[result.primaryRank - 1] : null,
        diagnostic,
      });
    }
  }

  const overallMetrics = computeAggregate(caseResults);
  const perLanguage: Record<CanonicalLanguage, AggregateMetrics> = {} as any;

  for (const lang of languages) {
    perLanguage[lang] = computeAggregate(perLanguageResults[lang]);
  }

  // Diagnostic sample
  const sample = await engine.search('diagnostic sample', options.hybridOptions);
  const diag = sample.diagnostic;

  return {
    timestamp: new Date().toISOString(),
    totalCorpusRecords: bm25Index.getAllRecords().length,
    totalEvaluatedCases: dataset.length,
    options,
    overallMetrics,
    perLanguage,
    unknownExpectedIds,
    rankingWeaknesses,
    retrievalMode: diag.requestedMode,
    effectiveMode: diag.effectiveMode,
    providerName: diag.providerName,
    usedFallback: diag.usedFallback,
    fallbackReason: diag.fallbackReason,
  };
}

/**
 * Formats a RetrievalEvaluationReport into markdown suitable for documentation or CLI logs.
 */
export function formatEvaluationReportMarkdown(report: RetrievalEvaluationReport): string {
  const lines: string[] = [];
  const o = report.overallMetrics;

  lines.push('# 📊 BugBuddy Retrieval Evaluation Report');
  lines.push(`- **Evaluated At:** ${report.timestamp}`);
  lines.push(`- **Corpus Size:** ${report.totalCorpusRecords} records across 6 languages`);
  lines.push(`- **Evaluation Cases:** ${report.totalEvaluatedCases} cases`);
  lines.push(`- **Retrieval Mode:** \`${report.retrievalMode || 'BM25_ONLY'}\` (Effective: \`${report.effectiveMode || report.retrievalMode || 'BM25'}\`)`);
  if (report.providerName) {
    lines.push(`- **Embedding Provider:** \`${report.providerName}\``);
  }
  if (report.usedFallback) {
    lines.push(`- **Used Fallback:** \`Yes\` (${report.fallbackReason || 'provider unavailable'})`);
  }
  lines.push(`- **Language Filter Applied:** ${report.options.applyLanguageFilter ? 'Yes' : 'No'}`);
  lines.push(`- **Category Filter Applied:** ${report.options.applyCategoryFilter ? 'Yes' : 'No'}`);
  lines.push('');

  if (report.unknownExpectedIds.length > 0) {
    lines.push('### ⚠️ Corpus Inconsistency: Unknown Expected Record IDs');
    lines.push('The following expected IDs in the evaluation dataset DO NOT exist in the corpus:');
    for (const uid of report.unknownExpectedIds) {
      lines.push(`- \`${uid}\``);
    }
    lines.push('');
  }

  lines.push('### 🎯 Overall Benchmark Metrics');
  lines.push('| Metric | Value | Interpretation |');
  lines.push('| :--- | :--- | :--- |');
  lines.push(`| **Top-1 Accuracy** | \`${(o.top1Accuracy * 100).toFixed(1)}%\` | Fraction of queries where primary match is rank #1 |`);
  lines.push(`| **MRR (Mean Reciprocal Rank)** | \`${o.mrr.toFixed(4)}\` | Average reciprocal rank of the target match (1.0 = perfect) |`);
  lines.push(`| **Recall@1** | \`${(o.recallAt1 * 100).toFixed(1)}%\` | Target record captured at rank #1 |`);
  lines.push(`| **Recall@3** | \`${(o.recallAt3 * 100).toFixed(1)}%\` | Target record captured within top 3 results |`);
  lines.push(`| **Recall@5** | \`${(o.recallAt5 * 100).toFixed(1)}%\` | Target record captured within top 5 results |`);
  lines.push(`| **Precision@1** | \`${(o.precisionAt1 * 100).toFixed(1)}%\` | Top result relevance precision |`);
  lines.push(`| **Precision@3** | \`${(o.precisionAt3 * 100).toFixed(1)}%\` | Top 3 result relevance density |`);
  lines.push(`| **Filter Compliance** | \`${(o.filterComplianceRate * 100).toFixed(1)}%\` | Language/category filter enforcement fidelity |`);
  lines.push('');

  lines.push('### 🌐 Per-Language Performance');
  lines.push('| Language | Cases | Top-1 Acc | MRR | Recall@3 | Recall@5 |');
  lines.push('| :--- | :---: | :---: | :---: | :---: | :---: |');
  for (const [lang, m] of Object.entries(report.perLanguage)) {
    lines.push(
      `| \`${lang}\` | ${m.totalCases} | ${(m.top1Accuracy * 100).toFixed(1)}% | ${m.mrr.toFixed(3)} | ${(m.recallAt3 * 100).toFixed(1)}% | ${(m.recallAt5 * 100).toFixed(1)}% |`
    );
  }
  lines.push('');

  if (report.rankingWeaknesses.length > 0) {
    lines.push(`### 🔍 Ranking Weaknesses (${report.rankingWeaknesses.length} cases below Rank #1)`);
    for (const w of report.rankingWeaknesses) {
      lines.push(`#### [${w.caseId}] \`${w.language}\`: "${w.query}"`);
      lines.push(`- **Target:** \`${w.primaryExpectedId}\` (Rank: ${w.expectedRank !== null ? '#' + w.expectedRank : 'Not in top K'}, Score: ${w.expectedScore?.toFixed(2) ?? 'N/A'})`);
      lines.push(`- **Top Result:** \`${w.actualTopId ?? 'None'}\` (Score: ${w.actualTopScore?.toFixed(2) ?? 'N/A'})`);
      lines.push(`- **Diagnostic:** ${w.diagnostic}`);
      lines.push('');
    }
  } else {
    lines.push('### ✨ Ranking Status');
    lines.push('All evaluation cases achieved perfect Rank #1 retrieval in this mode.');
    lines.push('');
  }

  return lines.join('\n');
}
