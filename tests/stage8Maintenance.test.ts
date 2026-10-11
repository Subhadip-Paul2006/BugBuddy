/**
 * BugBuddy Knowledge Base — Stage 8 Maintenance & Corpus Audit Suite
 *
 * Verifies deterministic maintenance workflows:
 * - SHA-256 corpus fingerprinting and permutation invariance.
 * - Cache and index invalidation tracking.
 * - Duplicate ID, collision, and conflict detection.
 * - Immutability and overwrite protection during record staging.
 * - Production corpus quality audit across all six languages.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import {
  ingestKnowledgeDirectory,
  computeCorpusFingerprint,
  detectCorpusConflicts,
  auditCorpusQuality,
  validateAndStageUpdate,
  IndexInvalidationTracker,
  NormalizedKnowledgeRecord,
  KnowledgeEntry,
} from '../src/knowledge';

describe('BugBuddy Stage 8 — Maintenance & Operational Quality Suite', () => {
  it('1. computeCorpusFingerprint produces stable, permutation-invariant SHA-256 hashes', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });
    assert.strictEqual(ingest.records.length, 60);

    const hash1 = computeCorpusFingerprint(ingest.records);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64); // SHA-256 hex length

    // Permute array order
    const permuted = [...ingest.records].reverse();
    const hash2 = computeCorpusFingerprint(permuted);
    assert.strictEqual(hash1, hash2, 'Fingerprint must be invariant to record array ordering');

    // Modifying a single character must change the fingerprint
    const modified = [...ingest.records];
    modified[0] = { ...modified[0], title: modified[0].title + ' (edited)' };
    const hash3 = computeCorpusFingerprint(modified);
    assert.notStrictEqual(hash1, hash3, 'Fingerprint must detect field modifications');
  });

  it('2. computeCorpusFingerprint handles empty corpus gracefully without crashing', () => {
    const emptyHash = computeCorpusFingerprint([]);
    assert.strictEqual(typeof emptyHash, 'string');
    assert.strictEqual(emptyHash.length, 64);
  });

  it('3. IndexInvalidationTracker accurately tracks BM25 and vector index dirty states', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const tracker = new IndexInvalidationTracker(ingest.records);

    // Initially dirty until marked clean
    assert.strictEqual(tracker.isBM25Dirty(), true);
    assert.strictEqual(tracker.isVectorDirty(), true);

    tracker.markBM25Clean();
    assert.strictEqual(tracker.isBM25Dirty(), false);
    assert.strictEqual(tracker.isVectorDirty(), true);

    tracker.markVectorClean();
    assert.strictEqual(tracker.isVectorDirty(), false);

    // Modify corpus
    const modified = [...ingest.records];
    modified[0] = { ...modified[0], symptoms: modified[0].symptoms + ' updated' };
    tracker.updateCorpus(modified);

    assert.strictEqual(tracker.isBM25Dirty(), true, 'BM25 index must be dirty after corpus update');
    assert.strictEqual(tracker.isVectorDirty(), true, 'Vector index must be dirty after corpus update');
  });

  it('4. detectCorpusConflicts catches duplicate IDs across records', () => {
    const fakeRecords: KnowledgeEntry[] = [
      {
        id: 'c-test-duplicate',
        language: 'c',
        title: 'Original Title',
        category: 'runtime_error',
        difficulty: 'beginner',
        symptoms: 'Crash',
        roast: 'Roast',
        diagnosis: 'Diagnosis',
        debuggingSteps: ['Step 1'],
        badExample: 'int x = 0;',
        fixedExample: 'int x = 1;',
        whyItWorks: 'Fix works because x is 1',
        tests: 'assert(x == 1);',
        tags: ['c'],
        sources: [{ url: 'https://example.com' }],
      },
      {
        id: 'c-test-duplicate',
        language: 'c',
        title: 'Conflicting Title',
        category: 'runtime_error',
        difficulty: 'beginner',
        symptoms: 'Crash 2',
        roast: 'Roast 2',
        diagnosis: 'Diagnosis 2',
        debuggingSteps: ['Step 2'],
        badExample: 'int y = 0;',
        fixedExample: 'int y = 1;',
        whyItWorks: 'Fix works because y is 1',
        tests: 'assert(y == 1);',
        tags: ['c'],
        sources: [{ url: 'https://example.com' }],
      },
    ];

    const conflictReport = detectCorpusConflicts(fakeRecords);
    assert.strictEqual(conflictReport.hasErrors, true);
    assert.strictEqual(conflictReport.duplicateIds.includes('c-test-duplicate'), true);
  });

  it('5. detectCorpusConflicts catches near-identical titles within the same language', () => {
    const fakeRecords: KnowledgeEntry[] = [
      {
        id: 'py-leak-case-a',
        language: 'python',
        title: 'Memory Leak with Unclosed Database File Connection',
        category: 'resource_leak' as any,
        difficulty: 'beginner',
        symptoms: 'Connection count grows unbounded',
        roast: 'Close your files',
        diagnosis: 'File descriptor exhaustion',
        debuggingSteps: ['Use context manager'],
        badExample: 'f = open("data.txt")',
        fixedExample: 'with open("data.txt") as f: pass',
        whyItWorks: 'Context manager guarantees release',
        tests: 'assert True',
        tags: ['python', 'file'],
        sources: [{ url: 'https://docs.python.org/3' }],
      },
      {
        id: 'py-leak-case-b',
        language: 'python',
        title: 'Memory Leak with Unclosed Database File Connections',
        category: 'resource_leak' as any,
        difficulty: 'beginner',
        symptoms: 'Connection count grows unbounded in loop',
        roast: 'Close your files again',
        diagnosis: 'File descriptor exhaustion in loop',
        debuggingSteps: ['Use with statement'],
        badExample: 'f = open("data.txt")',
        fixedExample: 'with open("data.txt") as f: pass',
        whyItWorks: 'Context manager guarantees release',
        tests: 'assert True',
        tags: ['python', 'file'],
        sources: [{ url: 'https://docs.python.org/3' }],
      },
    ];

    const report = detectCorpusConflicts(fakeRecords);
    assert.ok(report.titleConflicts.length > 0, 'Should detect high title similarity collision');
  });

  it('6. validateAndStageUpdate rejects overwrites when allowOverwriteExisting is false', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);

    const existingRecord = ingest.records[0];
    const candidateUpdate: KnowledgeEntry = {
      ...existingRecord,
      title: 'Attempted Silent Overwrite Without Permission',
    };

    const result = validateAndStageUpdate(ingest.records, candidateUpdate, {
      allowOverwriteExisting: false,
    });

    assert.strictEqual(result.accepted, false);
    assert.ok(result.errors.some((e) => e.reason.includes('already exists')));
  });

  it('7. validateAndStageUpdate accepts valid updates and flags index invalidation', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);

    const candidateNew: KnowledgeEntry = {
      id: 'c-test-new-entry',
      language: 'c',
      title: 'Valid New Knowledge Entry for Testing',
      category: 'runtime_error',
      difficulty: 'beginner',
      symptoms: 'Test error message output',
      roast: 'ByteBuddy chuckles',
      diagnosis: 'Detailed diagnosis of the test bug condition',
      debuggingSteps: ['Step one check', 'Step two verify'],
      badExample: 'char *str = NULL; *str = 0;',
      fixedExample: 'char buf[16] = {0}; char *str = buf;',
      whyItWorks: 'Allocates valid stack memory before dereference',
      tests: 'assert(str != NULL);',
      tags: ['c', 'pointer', 'test'],
      sources: [{ title: 'C Reference', url: 'https://en.cppreference.com/w/c' }],
    };

    const result = validateAndStageUpdate(ingest.records, candidateNew);
    assert.strictEqual(result.accepted, true);
    assert.strictEqual(result.requiresIndexRebuild, true);
    assert.strictEqual(result.stagedCorpus?.length, 61);
  });

  it('8. auditCorpusQuality certifies all 60 production records pass with zero errors', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir, { strict: true });

    const audit = auditCorpusQuality(ingest.records);
    assert.strictEqual(audit.totalRecords, 60);
    assert.strictEqual(audit.recordsWithErrorsCount, 0, 'Production corpus must have zero quality errors');
    assert.strictEqual(audit.perLanguageMeetsTarget, true, 'All 6 languages must meet >=10 target');
    assert.strictEqual(audit.perfectRecordsCount, 60, 'All 60 records should pass clean quality standards');
  });
});
