/**
 * BugBuddy Knowledge Base — Stage 4: Structured Debugging Response Engine Test Suite
 * 
 * Verifies structured diagnosis response building, grounding, source preservation,
 * multi-match handling, language isolation, no-match honesty, and integration with the 60-record corpus.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

import {
  buildDiagnosisResponse,
  diagnoseProblem,
  formatDiagnosisResponseMarkdown,
  DEFAULT_MIN_RELEVANCE_SCORE,
  type DiagnosisResponse,
  type UserCodeContext,
  ingestKnowledgeDirectory,
  KnowledgeSearchIndex,
  searchKnowledgeBase,
  type KnowledgeEntry,
  type NormalizedKnowledgeRecord,
  normalizeRecord,
} from '../src/knowledge';

function createMockRecord(overrides: Partial<KnowledgeEntry>): NormalizedKnowledgeRecord {
  const baseEntry: KnowledgeEntry = {
    id: 'mock-01',
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
      '3. Initialize items = [] if items is None.',
    ],
    badExample: 'def add(item, items=[]): items.append(item); return items',
    fixedExample: 'def add(item, items=None): items = items or []; items.append(item); return items',
    whyItWorks: 'Using None instantiates a new list instance per invocation.',
    tests: 'pytest tests/test_inventory.py -v',
    tags: ['python', 'mutable', 'default-args', 'list'],
    sources: [
      {
        title: 'Python Docs Default Arguments',
        url: 'https://docs.python.org/3/tutorial/controlflow.html#default-arguments',
      },
    ],
    ...overrides,
  };

  return normalizeRecord(baseEntry, 'knowledge/python.json');
}

describe('BugBuddy Knowledge Base — Stage 4 Structured Response Engine Suite', () => {
  // 1. Building a response from a valid strong retrieval result
  it('1. should build a structured diagnosis response from a valid strong retrieval result', () => {
    const record = createMockRecord({});
    const response = buildDiagnosisResponse([record]);

    assert.ok(response);
    assert.equal(response.title, 'Mutable Default Argument Accumulation');
    assert.equal(response.responseMode, 'DIRECT_MATCH');
    assert.equal(response.matchedKnowledgeIds[0], 'mock-01');
  });

  // 2. Correct preservation of selected language and category
  it('2. should preserve the exact language and category from the matched record', () => {
    const record = createMockRecord({ language: 'cpp', category: 'runtime_error' });
    const response = buildDiagnosisResponse([record]);

    assert.equal(response.language, 'cpp');
    assert.equal(response.category, 'runtime_error');
  });

  // 3. Correct inclusion of roast and diagnosis
  it('3. should correctly include the curated roast and technical root-cause diagnosis', () => {
    const record = createMockRecord({
      roast: 'Testing custom roast string.',
      diagnosis: 'Testing custom root cause explanation.',
    });
    const response = buildDiagnosisResponse([record]);

    assert.equal(response.roast, 'Testing custom roast string.');
    assert.equal(response.rootCause, 'Testing custom root cause explanation.');
  });

  // 4. Inclusion of buggy and corrected examples where available
  it('4. should include both buggy and corrected code examples in suggestedFix', () => {
    const record = createMockRecord({});
    const response = buildDiagnosisResponse([record]);

    assert.ok(response.suggestedFix);
    assert.equal(response.suggestedFix.buggyExample, record.badExample);
    assert.equal(response.suggestedFix.fixedExample, record.fixedExample);
    assert.equal(response.suggestedFix.explanation, record.whyItWorks);
    assert.equal(response.suggestedFix.isDirectFix, true);
  });

  // 5. Preservation of debugging steps
  it('5. should preserve ordered debugging steps from the matched entry', () => {
    const record = createMockRecord({
      debuggingSteps: ['Check line 42', 'Run sanitizer', 'Inspect callstack'],
    });
    const response = buildDiagnosisResponse([record]);

    assert.deepEqual(response.debuggingSteps, ['Check line 42', 'Run sanitizer', 'Inspect callstack']);
  });

  // 6. Preservation of verification tests
  it('6. should preserve verification tests supplied by the matched record', () => {
    const record = createMockRecord({ tests: 'g++ -fsanitize=address main.cpp && ./a.out' });
    const response = buildDiagnosisResponse([record]);

    assert.equal(response.verificationTests, 'g++ -fsanitize=address main.cpp && ./a.out');
  });

  // 7. Preservation of exact source URLs and knowledge IDs
  it('7. should preserve exact source URLs and knowledge IDs from matched records', () => {
    const record = createMockRecord({
      id: 'test-exact-id-01',
      sources: [{ title: 'Official Spec', url: 'https://spec.example.org/v1/null-safety' }],
    });
    const response = buildDiagnosisResponse([record]);

    assert.deepEqual(response.matchedKnowledgeIds, ['test-exact-id-01']);
    assert.equal(response.sources.length, 1);
    assert.equal(response.sources[0].url, 'https://spec.example.org/v1/null-safety');
  });

  // 8. No fabricated citations
  it('8. should not fabricate citations when source metadata is empty', () => {
    const record = createMockRecord({ sources: [] });
    const response = buildDiagnosisResponse([record]);

    assert.deepEqual(response.sources, []);
  });

  // 9. Empty retrieval results
  it('9. should return an honest NO_MATCH response when search results are empty', () => {
    const response = buildDiagnosisResponse([]);

    assert.equal(response.responseMode, 'NO_MATCH');
    assert.equal(response.suggestedFix, null);
    assert.deepEqual(response.sources, []);
    assert.deepEqual(response.matchedKnowledgeIds, []);
    assert.ok(response.summary.includes('no verified records'));
  });

  // 10. Weak or insufficient retrieval evidence
  it('10. should treat search results below minRelevanceScore as NO_MATCH', () => {
    const record = createMockRecord({});
    const response = buildDiagnosisResponse(
      [{ record, score: 0.1, matchedTerms: ['unrelated'] }],
      { minRelevanceScore: 1.0 }
    );

    assert.equal(response.responseMode, 'NO_MATCH');
    assert.equal(response.suggestedFix, null);
  });

  // 11. Multiple relevant results
  it('11. should incorporate complementary information from multiple same-language matches', () => {
    const record1 = createMockRecord({ id: 'rec-1', debuggingSteps: ['Step A'] });
    const record2 = createMockRecord({ id: 'rec-2', debuggingSteps: ['Step B'], sources: [{ url: 'https://doc2.org' }] });

    const response = buildDiagnosisResponse([record1, record2], { maxRelatedEntries: 2 });

    assert.ok(response.matchedKnowledgeIds.includes('rec-1'));
    assert.ok(response.matchedKnowledgeIds.includes('rec-2'));
    assert.ok(response.debuggingSteps.some((s) => s.includes('Step B')));
    assert.ok(response.sources.some((s) => s.url === 'https://doc2.org'));
  });

  // 12. Conflicting or incompatible retrieved examples
  it('12. should identify AMBIGUOUS_EVIDENCE when top scores are virtually tied with different categories', () => {
    const record1 = createMockRecord({ id: 'rec-1', category: 'silly_mistake' });
    const record2 = createMockRecord({ id: 'rec-2', category: 'runtime_error' });

    const response = buildDiagnosisResponse([
      { record: record1, score: 5.0, matchedTerms: [] },
      { record: record2, score: 4.95, matchedTerms: [] },
    ]);

    assert.equal(response.responseMode, 'AMBIGUOUS_EVIDENCE');
    assert.ok(response.limitations.some((lim) => lim.includes('Multiple distinct error patterns')));
  });

  // 13. No accidental language mismatch
  it('13. should strictly reject records of mismatched languages when userContext specifies language', () => {
    const pythonRecord = createMockRecord({ language: 'python' });
    const userContext: UserCodeContext = { language: 'java' };

    const response = buildDiagnosisResponse([pythonRecord], {
      userContext,
      requireStrictLanguageMatch: true,
    });

    assert.equal(response.responseMode, 'NO_MATCH');
    assert.equal(response.suggestedFix, null);
    assert.ok(response.summary.includes("none matched the requested language 'java'"));
  });

  // 14. No mutation of input records
  it('14. should not mutate input records or their nested structures', () => {
    const record = createMockRecord({ debuggingSteps: ['Original Step'] });
    const originalSteps = [...record.debuggingSteps];
    const originalSources = [...record.sources];

    buildDiagnosisResponse([record], { maxRelatedEntries: 2 });

    assert.deepEqual(record.debuggingSteps, originalSteps);
    assert.deepEqual(record.sources, originalSources);
  });

  // 15. Correct behavior with the actual 60-entry corpus
  it('15. should successfully diagnose real queries against the full 60-entry production corpus', async () => {
    const corpusPath = path.resolve('knowledge');
    const ingestion = await ingestKnowledgeDirectory(corpusPath);
    assert.equal(ingestion.success, true);
    assert.equal(ingestion.totalRecords, 60);

    const index = new KnowledgeSearchIndex();
    index.addAll(ingestion.records);

    // Test a real query for each of the 6 languages
    const testQueries = [
      { query: 'mutable default argument list append', expectedLang: 'python' },
      { query: 'segmentation fault pointer null dereference', expectedLang: 'c' },
      { query: 'vector iterator invalidation push_back', expectedLang: 'cpp' },
      { query: 'NullPointerException auto-unboxing Integer', expectedLang: 'java' },
      { query: 'forEach async await promise unhandled', expectedLang: 'javascript' },
      { query: 'TS2532 Object is possibly undefined', expectedLang: 'typescript' },
    ];

    for (const testItem of testQueries) {
      const response = diagnoseProblem(index, testItem.query, {
        filter: { language: testItem.expectedLang as any },
      });

      assert.notEqual(response.responseMode, 'NO_MATCH', `Query '${testItem.query}' should match real corpus`);
      assert.equal(response.language, testItem.expectedLang);
      assert.ok(response.matchedKnowledgeIds.length >= 1);
      assert.ok(response.suggestedFix !== null);
      assert.ok(response.suggestedFix.fixedExample.length > 5);
      assert.ok(response.sources.length >= 1);
    }
  });

  // 16. Honest distinction between curated guidance and actual user-code analysis
  it('16. should set responseMode to RELATED_GUIDANCE when user code differs from curated template', () => {
    const record = createMockRecord({});
    const response = buildDiagnosisResponse([record], {
      userContext: {
        code: 'def my_custom_unique_player_inventory_func(): pass',
        language: 'python',
      },
    });

    assert.equal(response.responseMode, 'RELATED_GUIDANCE');
    assert.equal(response.suggestedFix?.isDirectFix, false);
    assert.ok(response.suggestedFix?.relatedPatternNote?.includes('derived from knowledge entry'));
  });

  // 17. Correct public exports and Markdown formatting
  it('17. should correctly format DiagnosisResponse into structured Markdown', () => {
    const record = createMockRecord({});
    const response = buildDiagnosisResponse([record]);
    const md = formatDiagnosisResponseMarkdown(response);

    assert.ok(md.includes('# 🛡️ BugBuddy Diagnosis:'));
    assert.ok(md.includes('### 🤖 The Roast'));
    assert.ok(md.includes('### 🔍 Root Cause & Symptoms'));
    assert.ok(md.includes('### 🛠️ Suggested Fix'));
    assert.ok(md.includes('### 🧪 Suggested Verification Tests'));
    assert.ok(md.includes('### ⚠️ Limitations & Evidence'));
  });
});
