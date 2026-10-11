import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  validateRecord,
  validateDataset,
  normalizeRecord,
  ingestKnowledgeFile,
  ingestKnowledgeDirectory,
  formatDiagnostics,
  formatIngestionSummary,
  SUPPORTED_LANGUAGES,
  type KnowledgeEntry,
} from '../src/knowledge';

function createValidEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'test-sample-bug',
    language: 'python',
    title: 'Sample Test Bug Title',
    category: 'runtime_error',
    difficulty: 'beginner',
    symptoms: 'Raises an unexpected exception at runtime.',
    roast: 'Your pickaxe broke because you tried to mine obsidian with wood.',
    diagnosis: 'The function fails because the input type is incompatible with the operation.',
    debuggingSteps: [
      'Inspect the input type using isinstance()',
      'Convert or validate the input parameter before evaluation',
    ],
    badExample: 'def add(a, b): return a + b\nadd(\"1\", 2)',
    fixedExample: 'def add(a, b): return int(a) + int(b)\nadd(\"1\", 2)',
    whyItWorks: 'Explicitly converting both arguments to integers guarantees arithmetic addition.',
    tests: 'assert add(\"1\", 2) == 3',
    tags: ['python', 'types', 'testing'],
    sources: [
      {
        title: 'Python Official Documentation',
        url: 'https://docs.python.org/3/library/functions.html#int',
      },
    ],
    ...overrides,
  };
}

describe('BugBuddy Knowledge Base — Stage 2 Ingestion & Validation Suite', () => {
  // Test 1: A valid knowledge entry
  it('1. should successfully validate a canonical, complete knowledge entry', () => {
    const valid = createValidEntry();
    const result = validateRecord(valid, { file: 'test.json' });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  // Test 2: A missing required field
  it('2. should reject an entry missing a required field (e.g. category)', () => {
    const invalid: any = createValidEntry();
    delete invalid.category;

    const result = validateRecord(invalid, { file: 'test.json' });
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'category' && e.reason.includes("Missing required field")),
      'Should report missing category error'
    );
  });

  // Test 3: An unsupported language
  it('3. should reject an entry with an unsupported language', () => {
    const invalid: any = createValidEntry({ language: 'cobol' as any });
    const result = validateRecord(invalid);
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'language' && e.reason.includes('Unsupported language')),
      'Should report unsupported language'
    );
  });

  // Test 4: An invalid difficulty value
  it('4. should reject an entry with an invalid difficulty value', () => {
    const invalid: any = createValidEntry({ difficulty: 'impossible' as any });
    const result = validateRecord(invalid);
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'difficulty' && e.reason.includes('Invalid difficulty')),
      'Should report invalid difficulty'
    );
  });

  // Test 5: A blank required string
  it('5. should reject an entry containing a blank or whitespace-only required string', () => {
    const invalid = createValidEntry({ title: '   \t  ' });
    const result = validateRecord(invalid);
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'title' && e.reason.includes('cannot be blank')),
      'Should report blank title'
    );
  });

  // Test 6: A missing buggy or corrected example
  it('6. should reject missing badExample, missing fixedExample, or identical code examples', () => {
    const missingBad: any = createValidEntry({ badExample: '' });
    const resBad = validateRecord(missingBad);
    assert.strictEqual(resBad.isValid, false);
    assert.ok(resBad.errors.some((e) => e.field === 'badExample'));

    const identical = createValidEntry({
      badExample: 'const x = 10;',
      fixedExample: 'const x = 10;',
    });
    const resIdentical = validateRecord(identical);
    assert.strictEqual(resIdentical.isValid, false);
    assert.ok(
      resIdentical.errors.some(
        (e) => e.field === 'fixedExample' && e.reason.includes('must differ from')
      ),
      'Should reject identical buggy and fixed code'
    );
  });

  // Test 7: A missing verification test
  it('7. should reject an entry with missing or empty verification tests', () => {
    const invalid: any = createValidEntry({ tests: '   ' });
    const result = validateRecord(invalid);
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'tests' && e.reason.includes('cannot be blank')),
      'Should report empty verification test'
    );
  });

  // Test 8: An invalid source URL
  it('8. should reject an entry containing an invalid or non-HTTP/HTTPS source URL', () => {
    const invalid = createValidEntry({
      sources: [
        {
          title: 'Invalid Source',
          url: 'ftp://not-http.example.com/doc',
        },
      ],
    });
    const result = validateRecord(invalid);
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'sources[0].url' && e.reason.includes('invalid HTTP/HTTPS URL')),
      'Should reject non-http/https URL'
    );

    const malformedUrl = createValidEntry({
      sources: [
        {
          title: 'Not A URL',
          url: 'just-some-text',
        },
      ],
    });
    const resMalformed = validateRecord(malformedUrl);
    assert.strictEqual(resMalformed.isValid, false);
  });

  // Test 9: Duplicate IDs within one file / dataset
  it('9. should detect duplicate IDs within the same dataset or file', () => {
    const entry1 = createValidEntry({ id: 'duplicate-slug' });
    const entry2 = createValidEntry({ id: 'duplicate-slug' });

    const result = validateDataset([entry1, entry2], { file: 'test_file.json' });
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((e) => e.field === 'id' && e.reason.includes('Duplicate ID detected')),
      'Should detect duplicate ID within dataset'
    );
  });

  // Test 10: Duplicate IDs across multiple files
  it('10. should detect duplicate IDs across multiple files during directory ingestion', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bb-kb-dup-'));
    try {
      const fileA = path.join(tempDir, 'file_a.json');
      const fileB = path.join(tempDir, 'file_b.json');

      const entryA = createValidEntry({ id: 'shared-cross-id' });
      const entryB = createValidEntry({ id: 'shared-cross-id', title: 'Another title' });

      await fs.writeFile(fileA, JSON.stringify([entryA]), 'utf-8');
      await fs.writeFile(fileB, JSON.stringify([entryB]), 'utf-8');

      const result = await ingestKnowledgeDirectory(tempDir);
      assert.strictEqual(result.success, false);
      assert.ok(
        result.errors.some((e) => e.field === 'id' && e.reason.includes('Duplicate ID detected')),
        'Should detect duplicate ID across files'
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 11: A malformed input file
  it('11. should handle malformed JSON files gracefully with clear diagnostic errors', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bb-kb-malformed-'));
    try {
      const brokenFile = path.join(tempDir, 'broken.json');
      await fs.writeFile(brokenFile, '{ invalid json string syntax: true, ', 'utf-8');

      const result = await ingestKnowledgeFile(brokenFile);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.totalRecords, 0);
      assert.ok(
        result.errors.some((e) => e.file === brokenFile && e.reason.includes('Malformed JSON')),
        'Should report malformed JSON error with file reference'
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 12: A successful ingestion of the existing corpus
  it('12. should successfully ingest and validate the entire production knowledge corpus', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const result = await ingestKnowledgeDirectory(knowledgeDir);

    assert.strictEqual(result.success, true, 'Corpus ingestion must succeed without errors');
    assert.strictEqual(result.errors.length, 0, 'Must have 0 validation errors');
    assert.ok(result.totalFiles >= 6, 'Must process at least 6 language files');
    assert.ok(result.totalRecords >= 60, 'Must ingest at least 60 total records');
  });

  // Test 13: Accurate total and per-language counts
  it('13. should verify accurate total (>=60) and per-language (>=10 each) counts', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const result = await ingestKnowledgeDirectory(knowledgeDir);

    assert.strictEqual(result.totalRecords, 60, 'Total records count must be exactly 60');

    for (const lang of SUPPORTED_LANGUAGES) {
      const count = result.recordsByLanguage[lang];
      assert.strictEqual(
        count,
        10,
        `Language '${lang}' must have exactly 10 curated entries, found ${count}`
      );
    }
  });

  // Test 14: Useful diagnostics for invalid entries
  it('14. should produce actionable human-readable diagnostics containing file, ID, field, and reason', () => {
    const invalidEntry = createValidEntry({
      id: 'diagnostic-sample-id',
      difficulty: 'extreme' as any,
    });
    const validation = validateRecord(invalidEntry, { file: 'sample_file.json' });
    const diagnosticsText = formatDiagnostics(validation.errors);

    assert.ok(diagnosticsText.includes('File: sample_file.json'), 'Should include file in diagnostic output');
    assert.ok(diagnosticsText.includes('ID: diagnostic-sample-id'), 'Should include ID in diagnostic output');
    assert.ok(diagnosticsText.includes('Field: difficulty'), 'Should include field in diagnostic output');
    assert.ok(diagnosticsText.includes('Invalid difficulty'), 'Should include actionable reason');
  });

  // Test 15: An empty or missing knowledge directory
  it('15. should fail cleanly when targeting a missing or empty directory', async () => {
    // Missing directory
    const missingDir = path.join(os.tmpdir(), 'non_existent_bb_dir_' + Date.now());
    const resultMissing = await ingestKnowledgeDirectory(missingDir);
    assert.strictEqual(resultMissing.success, false);
    assert.ok(
      resultMissing.errors.some((e) => e.reason.includes('not accessible or missing')),
      'Should report missing directory error'
    );

    // Empty directory
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bb-empty-'));
    try {
      const resultEmpty = await ingestKnowledgeDirectory(emptyDir);
      assert.strictEqual(resultEmpty.success, false);
      assert.ok(
        resultEmpty.errors.some((e) => e.reason.includes('contains no .json files')),
        'Should report empty directory error'
      );
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });

  // Normalizer & Provenance preservation check
  it('should preserve provenance and generate Stage 3 searchContent during normalization', () => {
    const valid = createValidEntry({
      id: 'norm-provenance-test',
      language: 'c++' as any, // alias to be normalized to 'cpp'
    });
    const normalized = normalizeRecord(valid, 'knowledge/cpp.json');

    assert.strictEqual(normalized.language, 'cpp', 'Should normalize language alias c++ to cpp');
    assert.strictEqual(normalized.sourceFile, 'knowledge/cpp.json', 'Should preserve sourceFile');
    assert.strictEqual(normalized.sources.length, 1);
    assert.strictEqual(normalized.sources[0].url, 'https://docs.python.org/3/library/functions.html#int');
    assert.ok(normalized.searchContent.length > 50, 'Should build composite search content');
    assert.ok(normalized.searchContent.includes('Sample Test Bug Title'));
    assert.ok(normalized.ingestedAt !== undefined);
  });
});
