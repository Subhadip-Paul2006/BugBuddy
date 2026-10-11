/**
 * BugBuddy Knowledge Base — Stage 3 Search & Retrieval Test Suite
 * 
 * Verifies weighted BM25 relevance ranking, language/category filtering,
 * deterministic tie-breaking, top-K slicing, index lifecycle, and prompt context generation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

import {
  KnowledgeSearchIndex,
  searchKnowledgeBase,
  buildKnowledgePromptContext,
  tokenize,
  matchesFilter,
  DEFAULT_FIELD_WEIGHTS,
  ingestKnowledgeDirectory,
  KnowledgeEntry,
  NormalizedKnowledgeRecord,
} from '../src/knowledge';

function createMockEntry(overrides: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    id: 'mock-01',
    language: 'python',
    title: 'Default Mock Title',
    category: 'runtime_error',
    difficulty: 'beginner',
    symptoms: 'Default symptoms',
    roast: 'Default roast',
    diagnosis: 'Default diagnosis',
    debuggingSteps: ['Step 1', 'Step 2'],
    badExample: 'bad()',
    fixedExample: 'good()',
    whyItWorks: 'Default why it works',
    tests: 'test()',
    tags: ['test', 'mock'],
    sources: [{ title: 'Doc', url: 'https://example.com' }],
    ...overrides,
  };
}

describe('BugBuddy Knowledge Base — Stage 3 Search & Retrieval Suite', () => {
  // 1. Tokenization and Normalization
  it('1. should tokenize and preserve code-specific tokens including c++, c#, and identifiers', () => {
    const tokens = tokenize('Debugging C++ segmentation fault with NullPointerException and snake_case_var!');
    assert.ok(tokens.includes('c++'), 'Should preserve c++');
    assert.ok(tokens.includes('segmentation'), 'Should tokenize segmentation');
    assert.ok(tokens.includes('nullpointerexception') || tokens.includes('pointer'), 'Should split camelCase');
    assert.ok(tokens.includes('snake_case_var') || tokens.includes('snake'), 'Should preserve snake_case');
  });

  // 2. Keyword Search
  it('2. should find records by keyword across title, tags, and symptoms', () => {
    const entries = [
      createMockEntry({ id: 'py-01', title: 'Python Zero Division Error', tags: ['zero', 'math'] }),
      createMockEntry({ id: 'py-02', title: 'Python Type Error in Addition', tags: ['types', 'addition'] }),
      createMockEntry({ id: 'js-01', title: 'JavaScript Promise Rejection', language: 'javascript', tags: ['async'] }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const res = index.search('Zero Division');

    assert.strictEqual(res.results.length, 1);
    assert.strictEqual(res.results[0].record.id, 'py-01');
    assert.ok(res.results[0].score > 0);
    assert.ok(res.results[0].matchedTerms.includes('zero') || res.results[0].matchedTerms.includes('division'));
  });

  // 3. Weighted Relevance Ranking
  it('3. should rank title and tag matches higher than description or code matches', () => {
    const entries = [
      // Title match
      createMockEntry({
        id: 'rec-title',
        title: 'Buffer Overflow Vulnerability in C String Copy',
        symptoms: 'Crash on large inputs',
        diagnosis: 'Memory buffer boundary violation',
      }),
      // Body-only match (in whyItWorks)
      createMockEntry({
        id: 'rec-body',
        title: 'Safe String Handling Guidelines',
        symptoms: 'Program behaves unpredictably',
        diagnosis: 'General advice',
        whyItWorks: 'This prevents a buffer overflow from happening in the stack.',
      }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const res = index.search('Buffer Overflow');

    assert.strictEqual(res.results.length, 2);
    assert.strictEqual(res.results[0].record.id, 'rec-title', 'Title match should rank first');
    assert.ok(
      res.results[0].score > res.results[1].score,
      `Title score (${res.results[0].score}) should exceed body score (${res.results[1].score})`
    );
  });

  // 4. Language Filtering
  it('4. should strictly enforce language filtering', () => {
    const entries = [
      createMockEntry({ id: 'py-01', language: 'python', title: 'Python Syntax Error' }),
      createMockEntry({ id: 'js-01', language: 'javascript', title: 'JavaScript Syntax Error' }),
      createMockEntry({ id: 'ts-01', language: 'typescript', title: 'TypeScript Syntax Error' }),
    ];

    const index = new KnowledgeSearchIndex(entries);

    // Single language filter
    const pyOnly = index.search('Syntax Error', { filter: { language: 'python' } });
    assert.strictEqual(pyOnly.results.length, 1);
    assert.strictEqual(pyOnly.results[0].record.language, 'python');

    // Multi-language filter
    const multiLang = index.search('Syntax Error', { filter: { language: ['javascript', 'typescript'] } });
    assert.strictEqual(multiLang.results.length, 2);
    assert.ok(multiLang.results.every((r) => ['javascript', 'typescript'].includes(r.record.language)));
  });

  // 5. Category Filtering
  it('5. should strictly enforce category filtering', () => {
    const entries = [
      createMockEntry({ id: 'err-01', category: 'runtime_error', title: 'Array Index Out Of Bounds' }),
      createMockEntry({ id: 'err-02', category: 'syntax_error', title: 'Unexpected Token Semicolon' }),
      createMockEntry({ id: 'err-03', category: 'logic_error', title: 'Infinite Loop in While Condition' }),
    ];

    const index = new KnowledgeSearchIndex(entries);

    const runtimeOnly = index.search('Bounds Token Loop', { filter: { category: 'runtime_error' } });
    assert.strictEqual(runtimeOnly.results.length, 1);
    assert.strictEqual(runtimeOnly.results[0].record.id, 'err-01');
    assert.strictEqual(runtimeOnly.results[0].record.category, 'runtime_error');
  });

  // 6. Difficulty and Tag Filtering
  it('6. should filter by difficulty and tags correctly', () => {
    const entries = [
      createMockEntry({ id: 'd-01', difficulty: 'beginner', tags: ['basics', 'syntax'] }),
      createMockEntry({ id: 'd-02', difficulty: 'advanced', tags: ['concurrency', 'memory'] }),
    ];

    const index = new KnowledgeSearchIndex(entries);

    const advResults = index.search('', { filter: { difficulty: 'advanced' } });
    assert.strictEqual(advResults.results.length, 1);
    assert.strictEqual(advResults.results[0].record.id, 'd-02');

    const tagResults = index.search('', { filter: { tags: ['concurrency'] } });
    assert.strictEqual(tagResults.results.length, 1);
    assert.strictEqual(tagResults.results[0].record.id, 'd-02');
  });

  // 7. Combined Multi-Criteria Filtering
  it('7. should combine language, category, and difficulty filters without leak', () => {
    const entries = [
      createMockEntry({ id: 'e-1', language: 'python', category: 'runtime_error', difficulty: 'beginner', title: 'Zero Division' }),
      createMockEntry({ id: 'e-2', language: 'python', category: 'logic_error', difficulty: 'beginner', title: 'Off by One' }),
      createMockEntry({ id: 'e-3', language: 'python', category: 'runtime_error', difficulty: 'advanced', title: 'Recursion Depth' }),
      createMockEntry({ id: 'e-4', language: 'java', category: 'runtime_error', difficulty: 'beginner', title: 'Null Pointer' }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const filtered = index.search('', {
      filter: {
        language: 'python',
        category: 'runtime_error',
        difficulty: 'beginner',
      },
    });

    assert.strictEqual(filtered.results.length, 1);
    assert.strictEqual(filtered.results[0].record.id, 'e-1');
  });

  // 8. Deterministic Tie-Breaking
  it('8. should break score ties deterministically by record ID ascending', () => {
    const entries = [
      createMockEntry({ id: 'record-z', title: 'Identical Error Message Pattern' }),
      createMockEntry({ id: 'record-a', title: 'Identical Error Message Pattern' }),
      createMockEntry({ id: 'record-m', title: 'Identical Error Message Pattern' }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const res = index.search('Identical Error Message Pattern');

    assert.strictEqual(res.results.length, 3);
    // All 3 have identical content, so scores will be identical.
    // They must be ordered: record-a, record-m, record-z
    assert.strictEqual(res.results[0].record.id, 'record-a');
    assert.strictEqual(res.results[1].record.id, 'record-m');
    assert.strictEqual(res.results[2].record.id, 'record-z');
  });

  // 9. Empty and Whitespace Query Handling
  it('9. should handle empty or whitespace queries by returning filtered records', () => {
    const entries = [
      createMockEntry({ id: 'item-2', language: 'python' }),
      createMockEntry({ id: 'item-1', language: 'python' }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const res = index.search('   ', { filter: { language: 'python' } });

    assert.strictEqual(res.results.length, 2);
    // Should be deterministically sorted by ID
    assert.strictEqual(res.results[0].record.id, 'item-1');
    assert.strictEqual(res.results[1].record.id, 'item-2');
  });

  // 10. No Match Graceful Fallback
  it('10. should return empty results when no records match query', () => {
    const entries = [createMockEntry({ id: 'item-1', title: 'Python List Comprehension' })];
    const index = new KnowledgeSearchIndex(entries);
    const res = index.search('quantum-fluctuation-xyz-nonexistent');

    assert.strictEqual(res.results.length, 0);
    assert.strictEqual(res.total, 0);
  });

  // 11. Limit and Offset Pagination
  it('11. should respect limit and offset pagination parameters', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      createMockEntry({ id: `entry-${String(i).padStart(2, '0')}`, title: `Generic Memory Bug Item ${i}` })
    );

    const index = new KnowledgeSearchIndex(entries);
    const page1 = index.search('Memory Bug', { limit: 3, offset: 0 });
    const page2 = index.search('Memory Bug', { limit: 3, offset: 3 });

    assert.strictEqual(page1.results.length, 3);
    assert.strictEqual(page2.results.length, 3);
    assert.notStrictEqual(page1.results[0].record.id, page2.results[0].record.id);
  });

  // 12. Index Mutability Lifecycle
  it('12. should support adding, removing, retrieving, and clearing records dynamically', () => {
    const index = new KnowledgeSearchIndex();
    assert.strictEqual(index.size(), 0);

    const entry = createMockEntry({ id: 'dyn-01', title: 'Dynamic Memory Allocation Failure' });
    index.add(entry);
    assert.strictEqual(index.size(), 1);
    assert.ok(index.get('dyn-01'));

    const searchRes = index.search('Dynamic Memory');
    assert.strictEqual(searchRes.results.length, 1);

    const removed = index.remove('dyn-01');
    assert.strictEqual(removed, true);
    assert.strictEqual(index.size(), 0);
    assert.strictEqual(index.search('Dynamic Memory').results.length, 0);

    index.addAll([entry, createMockEntry({ id: 'dyn-02', title: 'Second Dynamic Entry' })]);
    assert.strictEqual(index.size(), 2);
    index.clear();
    assert.strictEqual(index.size(), 0);
  });

  // 13. searchKnowledgeBase Functional Helper
  it('13. should work seamlessly via searchKnowledgeBase standalone helper function', () => {
    const entries = [
      createMockEntry({ id: 'fn-01', title: 'Floating Point Precision Inaccuracy' }),
      createMockEntry({ id: 'fn-02', title: 'Integer Division Underflow' }),
    ];

    const res = searchKnowledgeBase(entries, 'Floating Point Precision');
    assert.strictEqual(res.results.length, 1);
    assert.strictEqual(res.results[0].record.id, 'fn-01');
  });

  // 14. Prompt Context Construction
  it('14. should format search results into structured Markdown for LLM prompt context grounding', () => {
    const entries = [
      createMockEntry({
        id: 'java-npe',
        language: 'java',
        title: 'Java NullPointerException on Method Invocation',
        symptoms: 'NullPointerException thrown when dereferencing null object reference',
        diagnosis: 'Attempted to invoke a method on an object reference that points to null',
        debuggingSteps: ['Check line number in stack trace', 'Verify object initialization'],
        badExample: 'String s = null; s.length();',
        fixedExample: 'String s = ""; s.length();',
        whyItWorks: 'Initializing reference ensures valid memory object',
        tags: ['npe', 'null-check'],
      }),
    ];

    const index = new KnowledgeSearchIndex(entries);
    const searchRes = index.search('NullPointerException');

    const promptContext = buildKnowledgePromptContext(searchRes.results, {
      maxEntries: 1,
      includeExamples: true,
      includeSteps: true,
    });

    assert.ok(promptContext.includes('### Relevant Knowledge Base References'));
    assert.ok(promptContext.includes('[java-npe]'));
    assert.ok(promptContext.includes('Java NullPointerException on Method Invocation'));
    assert.ok(promptContext.includes('**Symptoms:**'));
    assert.ok(promptContext.includes('**Diagnosis:**'));
    assert.ok(promptContext.includes('**Recommended Steps:**'));
    assert.ok(promptContext.includes('**Erroneous Code:**'));
    assert.ok(promptContext.includes('**Corrected Code:**'));
  });

  // 15. Integration with Real Corpus
  it('15. should successfully search the 60-entry production knowledge corpus across all languages', async () => {
    const ingestion = await ingestKnowledgeDirectory(path.resolve('knowledge'));
    assert.strictEqual(ingestion.success, true, 'Ingestion must succeed');
    assert.ok(ingestion.records.length >= 60, 'Must have at least 60 corpus entries');

    const index = new KnowledgeSearchIndex(ingestion.records);
    assert.strictEqual(index.size(), ingestion.records.length);

    // Test Python retrieval
    const pySearch = index.search('IndentationError unexpected indent', { filter: { language: 'python' } });
    assert.ok(pySearch.results.length > 0, 'Should find python indentation error');
    assert.strictEqual(pySearch.results[0].record.language, 'python');

    // Test C pointer / memory retrieval
    const cSearch = index.search('segmentation fault pointer memory', { filter: { language: 'c' } });
    assert.ok(cSearch.results.length > 0, 'Should find C pointer/memory error');
    assert.strictEqual(cSearch.results[0].record.language, 'c');

    // Test C++ retrieval
    const cppSearch = index.search('memory leak vector delete', { filter: { language: 'cpp' } });
    assert.ok(cppSearch.results.length > 0, 'Should find C++ memory or vector error');
    assert.strictEqual(cppSearch.results[0].record.language, 'cpp');

    // Test Java retrieval
    const javaSearch = index.search('NullPointerException', { filter: { language: 'java' } });
    assert.ok(javaSearch.results.length > 0, 'Should find Java NPE');
    assert.strictEqual(javaSearch.results[0].record.language, 'java');

    // Test JavaScript / TypeScript retrieval
    const jsSearch = index.search('undefined is not a function', { filter: { language: 'javascript' } });
    assert.ok(jsSearch.results.length > 0, 'Should find JavaScript TypeError');
    assert.strictEqual(jsSearch.results[0].record.language, 'javascript');

    const tsSearch = index.search('Type is not assignable to type', { filter: { language: 'typescript' } });
    assert.ok(tsSearch.results.length > 0, 'Should find TypeScript type assignment error');
    assert.strictEqual(tsSearch.results[0].record.language, 'typescript');
  });
});
