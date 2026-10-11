/**
 * BugBuddy Knowledge Base — Stage 5: Source Attribution and Retrieval Evaluation Test Suite
 * 
 * Verifies citation provenance, zero-fabrication rules, honest missing-source handling,
 * deterministic retrieval quality evaluation, metric precision, and corpus integration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

import {
  buildDiagnosisResponse,
  formatDiagnosisResponseMarkdown,
  ingestKnowledgeDirectory,
  KnowledgeSearchIndex,
  type KnowledgeEntry,
  type NormalizedKnowledgeRecord,
  normalizeRecord,
  RETRIEVAL_EVALUATION_DATASET,
  evaluateRetrieval,
  evaluateRetrievalCase,
  findUnknownExpectedIds,
  type EvaluationCase,
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

describe('BugBuddy Knowledge Base — Stage 5 Attribution & Retrieval Evaluation', () => {
  // 1. Direct match preserves original source URLs
  it('1. Direct match preserves its original source URLs faithfully', () => {
    const record = createMockRecord({
      id: 'py-source-check',
      sources: [
        {
          title: 'Official Python Language Reference',
          url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions',
        },
      ],
    });

    const response = buildDiagnosisResponse([record]);

    assert.strictEqual(response.hasSources, true);
    assert.strictEqual(response.sources.length, 1);
    assert.strictEqual(
      response.sources[0].url,
      'https://docs.python.org/3/reference/compound_stmts.html#function-definitions'
    );
    assert.strictEqual(
      response.attributedSources[0].url,
      'https://docs.python.org/3/reference/compound_stmts.html#function-definitions'
    );
  });

  // 2. Source titles and knowledge IDs remain associated correctly
  it('2. Source titles and knowledge IDs remain associated correctly with provenance', () => {
    const record = createMockRecord({
      id: 'c-malloc-leak',
      language: 'c',
      title: 'Dynamic Heap Allocation Memory Leak',
      category: 'resource_leak',
      sources: [
        {
          title: 'SEI CERT C Coding Standard MEM30-C',
          url: 'https://wiki.sei.cmu.edu/confluence/display/c/MEM30-C',
        },
      ],
    });

    const response = buildDiagnosisResponse([record]);

    assert.strictEqual(response.attributedSources.length, 1);
    const attr = response.attributedSources[0];
    assert.strictEqual(attr.recordId, 'c-malloc-leak');
    assert.strictEqual(attr.recordTitle, 'Dynamic Heap Allocation Memory Leak');
    assert.strictEqual(attr.language, 'c');
    assert.strictEqual(attr.category, 'resource_leak');
    assert.strictEqual(attr.isPrimary, true);
    assert.strictEqual(attr.title, 'SEI CERT C Coding Standard MEM30-C');
  });

  // 3. Multiple matching entries preserve correct provenance
  it('3. Multiple matching entries preserve distinct record provenance and primary flags', () => {
    const primary = createMockRecord({
      id: 'primary-01',
      title: 'Primary Uncaught Exception',
      sources: [
        {
          title: 'Primary Spec',
          url: 'https://specs.example.org/primary',
        },
      ],
    });

    const related = createMockRecord({
      id: 'related-02',
      title: 'Secondary Context Entry',
      sources: [
        {
          title: 'Secondary Manual',
          url: 'https://manuals.example.org/secondary',
        },
      ],
    });

    const response = buildDiagnosisResponse([primary, related]);

    assert.strictEqual(response.attributedSources.length, 2);
    const [attr1, attr2] = response.attributedSources;

    assert.strictEqual(attr1.recordId, 'primary-01');
    assert.strictEqual(attr1.isPrimary, true);
    assert.strictEqual(attr1.url, 'https://specs.example.org/primary');

    assert.strictEqual(attr2.recordId, 'related-02');
    assert.strictEqual(attr2.isPrimary, false);
    assert.strictEqual(attr2.url, 'https://manuals.example.org/secondary');
  });

  // 4. No fabricated citations are introduced
  it('4. Never invents or fabricates citations not present in the retrieved records', () => {
    const record = createMockRecord({
      id: 'no-citation-entry',
      sources: [],
    });

    const response = buildDiagnosisResponse([record]);

    assert.strictEqual(response.hasSources, false);
    assert.strictEqual(response.sources.length, 0);
    assert.strictEqual(response.attributedSources.length, 0);
    // Does not inject placeholder URLs
    assert.ok(
      !response.limitations.some((lim) => lim.includes('http://') || lim.includes('https://'))
    );
  });

  // 5. Duplicate citation links are handled consistently
  it('5. Duplicate citation links are deduplicated cleanly across records', () => {
    const sharedUrl = 'https://docs.oracle.com/javase/8/docs/api/java/util/ConcurrentModificationException.html';
    const recA = createMockRecord({
      id: 'java-rec-a',
      language: 'java',
      sources: [{ title: 'Java SE 8 Docs', url: sharedUrl }],
    });
    const recB = createMockRecord({
      id: 'java-rec-b',
      language: 'java',
      sources: [{ title: 'Java SE 8 Docs Duplicated', url: sharedUrl }],
    });

    const response = buildDiagnosisResponse([recA, recB]);

    // Backward compatible sources list is deduplicated by URL
    assert.strictEqual(response.sources.length, 1);
    assert.strictEqual(response.sources[0].url, sharedUrl);
  });

  // 6. Missing source metadata is represented honestly
  it('6. Missing source metadata is represented honestly without placeholders', () => {
    const record = createMockRecord({
      id: 'entry-without-url',
      sources: [],
    });

    const response = buildDiagnosisResponse([record]);

    assert.strictEqual(response.hasSources, false);
    assert.ok(
      response.limitations.some((l) =>
        l.includes('No external documentation citations are available')
      )
    );

    const markdown = formatDiagnosisResponseMarkdown(response);
    assert.ok(markdown.includes('No external source citations available for this entry'));
    assert.ok(!markdown.includes('http'));
  });

  // 7. Language-incompatible records do not contribute citations
  it('7. Language-incompatible records do not bleed citations into strict response', () => {
    const pyRecord = createMockRecord({
      id: 'py-rec',
      language: 'python',
      sources: [{ title: 'Python Docs', url: 'https://docs.python.org' }],
    });
    const jsRecord = createMockRecord({
      id: 'js-rec',
      language: 'javascript',
      sources: [{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }],
    });

    const response = buildDiagnosisResponse(
      [
        { record: pyRecord, score: 5.0, matchedTerms: [] },
        { record: jsRecord, score: 9.0, matchedTerms: [] },
      ],
      {
        userContext: { language: 'py' },
        requireStrictLanguageMatch: true,
      }
    );

    assert.strictEqual(response.language, 'python');
    assert.strictEqual(response.sources.length, 1);
    assert.strictEqual(response.sources[0].url, 'https://docs.python.org');
    assert.ok(!response.sources.some((s) => s.url.includes('mozilla')));
  });

  // 8. No-match responses do not display citations from unrelated records
  it('8. No-match responses do not display citations from unrelated records', () => {
    const response = buildDiagnosisResponse([], {
      userContext: { language: 'cpp', errorMessage: 'Undefined symbol' },
    });

    assert.strictEqual(response.responseMode, 'NO_MATCH');
    assert.strictEqual(response.hasSources, false);
    assert.strictEqual(response.sources.length, 0);
    assert.strictEqual(response.attributedSources.length, 0);
    assert.strictEqual(response.matchedKnowledgeIds.length, 0);
  });

  // 9. Structured response formatting preserves citation information
  it('9. Structured response formatting preserves citation information and provenance badges', () => {
    const rec1 = createMockRecord({
      id: 'py-01',
      title: 'Title 1',
      sources: [{ title: 'Python Reference', url: 'https://python.org/ref' }],
    });
    const rec2 = createMockRecord({
      id: 'py-02',
      title: 'Title 2',
      sources: [{ title: 'PEP 484', url: 'https://peps.python.org/pep-0484' }],
    });

    const response = buildDiagnosisResponse([rec1, rec2]);
    const markdown = formatDiagnosisResponseMarkdown(response);

    assert.ok(markdown.includes('### 🔗 Verified Documentation Sources'));
    assert.ok(markdown.includes('[Primary] [Python Reference](https://python.org/ref) *(from `py-01`)*'));
    assert.ok(markdown.includes('[Related: py-02] [PEP 484](https://peps.python.org/pep-0484) *(from `py-02`)*'));
  });

  // 10. The evaluation runner detects unknown expected record IDs
  it('10. The evaluation runner detects unknown expected record IDs as corpus integrity failures', () => {
    const dummyRecord = createMockRecord({ id: 'real-01' });
    const index = new KnowledgeSearchIndex([dummyRecord]);

    const datasetWithInvalid: EvaluationCase[] = [
      {
        id: 'test-case-bad',
        query: 'test query',
        expectedLanguage: 'python',
        expectedRecordIds: ['non-existent-id-999'],
        queryType: 'exact_error',
        explanation: 'Invalid reference test',
      },
    ];

    const unknown = findUnknownExpectedIds(index, datasetWithInvalid);
    assert.strictEqual(unknown.length, 1);
    assert.strictEqual(unknown[0], 'non-existent-id-999');

    const report = evaluateRetrieval(index, datasetWithInvalid);
    assert.deepStrictEqual(report.unknownExpectedIds, ['non-existent-id-999']);
  });

  // 11. Retrieval metrics are calculated correctly for known synthetic fixtures
  it('11. Retrieval metrics (Recall@K, Precision@K, MRR, Top-1) calculate correctly on synthetic fixtures', () => {
    const recA = createMockRecord({ id: 'rec-a', title: 'Target Alpha' });
    const recB = createMockRecord({ id: 'rec-b', title: 'Target Beta' });
    const recC = createMockRecord({ id: 'rec-c', title: 'Target Gamma' });

    const index = new KnowledgeSearchIndex([recA, recB, recC]);

    const fixtureCase: EvaluationCase = {
      id: 'fixture-01',
      query: 'Alpha',
      expectedLanguage: 'python',
      expectedRecordIds: ['rec-a', 'rec-b'],
      queryType: 'exact_error',
      explanation: 'Synthetic test case',
    };

    const caseResult = evaluateRetrievalCase(index, fixtureCase, { topK: 3 });

    // Since 'rec-a' is expected and ranked #1:
    assert.strictEqual(caseResult.hitAt1, true);
    assert.strictEqual(caseResult.primaryRank, 1);
    assert.strictEqual(caseResult.reciprocalRank, 1.0);
    // Recall@1: 1 hit out of 2 expected = 0.5
    assert.strictEqual(caseResult.recallAt1, 0.5);
    // Precision@1: 1 hit out of 1 retrieved = 1.0
    assert.strictEqual(caseResult.precisionAt1, 1.0);
  });

  // 12. Evaluation results are deterministic
  it('12. Evaluation results are completely deterministic across multiple runs', () => {
    const rec1 = createMockRecord({ id: 'rec-1', title: 'Alpha Beta Gamma' });
    const rec2 = createMockRecord({ id: 'rec-2', title: 'Alpha Delta Epsilon' });
    const index = new KnowledgeSearchIndex([rec1, rec2]);

    const dataset: EvaluationCase[] = [
      {
        id: 'det-01',
        query: 'Alpha Beta',
        expectedLanguage: 'python',
        expectedRecordIds: ['rec-1'],
        queryType: 'concept',
        explanation: 'Deterministic test',
      },
    ];

    const run1 = evaluateRetrieval(index, dataset);
    const run2 = evaluateRetrieval(index, dataset);

    assert.strictEqual(run1.overallMetrics.mrr, run2.overallMetrics.mrr);
    assert.strictEqual(run1.overallMetrics.top1Accuracy, run2.overallMetrics.top1Accuracy);
    assert.strictEqual(run1.overallMetrics.recallAt1, run2.overallMetrics.recallAt1);
    assert.deepStrictEqual(run1.unknownExpectedIds, run2.unknownExpectedIds);
  });

  // 13. Integration test against the actual 60-record corpus
  it('13. Integration: Evaluates all 30 evaluation cases against the actual 60-record corpus', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingestResult = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });

    assert.strictEqual(ingestResult.success, true);
    assert.strictEqual(ingestResult.records.length, 60);

    const index = new KnowledgeSearchIndex(ingestResult.records);

    // Verify all expected IDs in RETRIEVAL_EVALUATION_DATASET exist in corpus
    const unknownIds = findUnknownExpectedIds(index, RETRIEVAL_EVALUATION_DATASET);
    assert.deepStrictEqual(
      unknownIds,
      [],
      `Found unknown expected IDs in evaluation dataset: ${unknownIds.join(', ')}`
    );

    // Run scoped evaluation
    const scopedReport = evaluateRetrieval(index, RETRIEVAL_EVALUATION_DATASET, {
      topK: 5,
      applyLanguageFilter: true,
    });

    assert.strictEqual(scopedReport.totalEvaluatedCases, 30);
    assert.strictEqual(scopedReport.unknownExpectedIds.length, 0);
    // Baseline quality checks on real corpus
    assert.ok(
      scopedReport.overallMetrics.mrr >= 0.70,
      `Scoped MRR should be >= 0.70 (got ${scopedReport.overallMetrics.mrr})`
    );
    assert.ok(
      scopedReport.overallMetrics.recallAt5 >= 0.80,
      `Scoped Recall@5 should be >= 0.80 (got ${scopedReport.overallMetrics.recallAt5})`
    );
  });
});
