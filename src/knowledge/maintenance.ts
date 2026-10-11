/**
 * BugBuddy Knowledge Base — Stage 8: Knowledge Maintenance & Operational Quality Engine
 * 
 * Provides deterministic workflows for:
 * 1. Safe record staging, validation, and immutability protection.
 * 2. Multi-record conflict, semantic collision, and duplicate detection.
 * 3. SHA-256 corpus fingerprinting and BM25 / Vector index invalidation tracking.
 * 4. Comprehensive corpus quality auditing (code examples, test assertions, official sources).
 * 5. High-reliability edge-case handling (empty corpora, malformed records, repeated ingestion).
 */

import { createHash } from 'node:crypto';
import type {
  CanonicalLanguage,
  KnowledgeEntry,
  NormalizedKnowledgeRecord,
  ValidationError,
  ValidationResult,
} from './types';
import { SUPPORTED_LANGUAGES } from './schema';
import { validateRecord, isValidHttpUrl } from './validator';
import { normalizeRecord } from './normalizer';

/**
 * Audit issue severity levels.
 */
export type AuditSeverity = 'error' | 'warning' | 'info';

export interface AuditIssue {
  recordId: string;
  language?: CanonicalLanguage;
  field?: string;
  severity: AuditSeverity;
  rule: string;
  message: string;
}

export interface ConflictAuditReport {
  hasErrors: boolean;
  duplicateIds: string[];
  titleConflicts: Array<{
    language: CanonicalLanguage;
    recordIdA: string;
    recordIdB: string;
    similarity: number;
    titleA: string;
    titleB: string;
  }>;
  sourceIssues: Array<{
    recordId: string;
    url: string;
    reason: string;
  }>;
  issues: AuditIssue[];
}

export interface CorpusQualityAuditReport {
  totalRecords: number;
  recordsByLanguage: Record<CanonicalLanguage, number>;
  perLanguageMeetsTarget: boolean;
  perfectRecordsCount: number;
  recordsWithWarningsCount: number;
  recordsWithErrorsCount: number;
  allIssues: AuditIssue[];
  fingerprint: string;
}

export interface MaintenanceStagingResult {
  accepted: boolean;
  stagedRecord?: NormalizedKnowledgeRecord;
  stagedCorpus?: NormalizedKnowledgeRecord[];
  errors: ValidationError[];
  warnings: ValidationError[];
  requiresIndexRebuild: boolean;
}

/**
 * Computes a deterministic SHA-256 fingerprint for a collection of knowledge records.
 * Records are sorted by ID to ensure consistency regardless of insertion order.
 */
export function computeCorpusFingerprint(
  records: Array<KnowledgeEntry | NormalizedKnowledgeRecord>
): string {
  if (!records || records.length === 0) {
    return createHash('sha256').update('__EMPTY_CORPUS__').digest('hex');
  }

  const sorted = [...records].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  const payload = sorted.map((r) => ({
    id: r.id,
    language: r.language,
    title: r.title,
    category: r.category,
    difficulty: r.difficulty,
    symptoms: r.symptoms,
    diagnosis: r.diagnosis,
    debuggingSteps: r.debuggingSteps,
    badExample: r.badExample,
    fixedExample: r.fixedExample,
    whyItWorks: r.whyItWorks,
    tests: r.tests,
    tags: r.tags,
    sources: r.sources,
  }));

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Calculates Jaccard token similarity between two strings.
 */
function calculateJaccardSimilarity(strA: string, strB: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((w) => (w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.endsWith('es') ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w))
    );

  const tokensA = tokenize(strA);
  const tokensB = tokenize(strB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? Number((intersection / union).toFixed(3)) : 0;
}

/**
 * Detects conflicts, duplicates, and suspicious semantic overlaps in a corpus.
 */
export function detectCorpusConflicts(
  records: Array<KnowledgeEntry | NormalizedKnowledgeRecord>
): ConflictAuditReport {
  const issues: AuditIssue[] = [];
  const duplicateIds: string[] = [];
  const seenIds = new Set<string>();
  const titleConflicts: ConflictAuditReport['titleConflicts'] = [];
  const sourceIssues: ConflictAuditReport['sourceIssues'] = [];

  for (const record of records) {
    if (!record.id) {
      issues.push({
        recordId: 'unknown',
        severity: 'error',
        rule: 'missing-id',
        message: 'Record is missing an ID.',
      });
      continue;
    }

    if (seenIds.has(record.id)) {
      duplicateIds.push(record.id);
      issues.push({
        recordId: record.id,
        language: record.language,
        severity: 'error',
        rule: 'duplicate-id',
        message: `Duplicate record ID detected: '${record.id}'.`,
      });
    } else {
      seenIds.add(record.id);
    }

    // Verify source URLs
    if (Array.isArray(record.sources)) {
      for (const src of record.sources) {
        if (!src.url || !isValidHttpUrl(src.url)) {
          sourceIssues.push({
            recordId: record.id,
            url: src.url || '',
            reason: 'Invalid or non-HTTP source URL format',
          });
          issues.push({
            recordId: record.id,
            language: record.language,
            field: 'sources',
            severity: 'error',
            rule: 'invalid-source-url',
            message: `Source URL '${src.url}' is not a valid HTTP/HTTPS URL.`,
          });
        }
      }
    }
  }

  // Cross-record title and symptom collision check within same language
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (a.language !== b.language) continue;

      const titleSim = calculateJaccardSimilarity(a.title, b.title);
      if (titleSim >= 0.7) {
        titleConflicts.push({
          language: a.language,
          recordIdA: a.id,
          recordIdB: b.id,
          similarity: titleSim,
          titleA: a.title,
          titleB: b.title,
        });
        issues.push({
          recordId: a.id,
          language: a.language,
          severity: titleSim >= 0.95 ? 'error' : 'warning',
          rule: 'title-collision',
          message: `High title similarity (${(titleSim * 100).toFixed(0)}%) with record '${b.id}': "${a.title}" vs "${b.title}".`,
        });
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    hasErrors,
    duplicateIds,
    titleConflicts,
    sourceIssues,
    issues,
  };
}

/**
 * Audits the technical quality, completeness, and consistency of all knowledge records.
 */
export function auditCorpusQuality(
  records: NormalizedKnowledgeRecord[]
): CorpusQualityAuditReport {
  const issues: AuditIssue[] = [];
  const recordsByLanguage: Record<CanonicalLanguage, number> = {
    c: 0,
    cpp: 0,
    java: 0,
    python: 0,
    javascript: 0,
    typescript: 0,
  };

  const recordsWithErrors = new Set<string>();
  const recordsWithWarnings = new Set<string>();

  for (const record of records) {
    if (record.language && recordsByLanguage[record.language] !== undefined) {
      recordsByLanguage[record.language]++;
    }

    // 1. Code example validation
    if (!record.badExample || record.badExample.trim().length < 10) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'badExample',
        severity: 'warning',
        rule: 'shallow-bad-example',
        message: 'Problematic code example is very short or trivial (< 10 chars).',
      });
      recordsWithWarnings.add(record.id);
    }
    if (!record.fixedExample || record.fixedExample.trim().length < 10) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'fixedExample',
        severity: 'warning',
        rule: 'shallow-fixed-example',
        message: 'Fixed code example is very short or trivial (< 10 chars).',
      });
      recordsWithWarnings.add(record.id);
    }
    if (
      record.badExample &&
      record.fixedExample &&
      record.badExample.trim() === record.fixedExample.trim()
    ) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'fixedExample',
        severity: 'error',
        rule: 'identical-examples',
        message: 'Bad example and fixed example are identical; fix provides no diff.',
      });
      recordsWithErrors.add(record.id);
    }

    // 2. Verification tests audit
    if (!record.tests || record.tests.trim().length < 5) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'tests',
        severity: 'warning',
        rule: 'missing-verification-tests',
        message: 'Verification test code is missing or trivial.',
      });
      recordsWithWarnings.add(record.id);
    }

    // 3. Technical rationale audit
    if (!record.whyItWorks || record.whyItWorks.trim().length < 20) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'whyItWorks',
        severity: 'warning',
        rule: 'shallow-rationale',
        message: 'Technical rationale (whyItWorks) is very short (< 20 chars).',
      });
      recordsWithWarnings.add(record.id);
    }

    // 4. Source URL audit
    if (!record.sources || record.sources.length === 0) {
      issues.push({
        recordId: record.id,
        language: record.language,
        field: 'sources',
        severity: 'warning',
        rule: 'no-sources',
        message: 'Record has no external documentation references.',
      });
      recordsWithWarnings.add(record.id);
    }
  }

  // Check language targets (>= 10 per language)
  let perLanguageMeetsTarget = true;
  for (const lang of SUPPORTED_LANGUAGES) {
    if ((recordsByLanguage[lang] || 0) < 10) {
      perLanguageMeetsTarget = false;
      issues.push({
        recordId: `corpus-${lang}`,
        language: lang,
        severity: 'error',
        rule: 'corpus-language-target-unmet',
        message: `Language '${lang}' has ${recordsByLanguage[lang] || 0} entries, below minimum threshold of 10.`,
      });
    }
  }

  const fingerprint = computeCorpusFingerprint(records);
  const total = records.length;
  const errorCount = recordsWithErrors.size;
  const warningCount = recordsWithWarnings.size;
  const perfectCount = total - new Set([...recordsWithErrors, ...recordsWithWarnings]).size;

  return {
    totalRecords: total,
    recordsByLanguage,
    perLanguageMeetsTarget,
    perfectRecordsCount: Math.max(0, perfectCount),
    recordsWithWarningsCount: warningCount,
    recordsWithErrorsCount: errorCount,
    allIssues: issues,
    fingerprint,
  };
}

/**
 * Validates and safely stages an addition or update to the knowledge corpus.
 * Prevents accidental overwrite of existing curated records and ensures
 * index invalidation flags are raised when content changes.
 */
export function validateAndStageUpdate(
  existingRecords: NormalizedKnowledgeRecord[],
  candidate: KnowledgeEntry,
  options: { allowOverwriteExisting?: boolean; sourceFile?: string } = {}
): MaintenanceStagingResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Strict schema validation of candidate
  const validation = validateRecord(candidate, { file: options.sourceFile });
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.isValid) {
    return {
      accepted: false,
      errors,
      warnings,
      requiresIndexRebuild: false,
    };
  }

  // 2. Overwrite protection
  const existingIdx = existingRecords.findIndex((r) => r.id === candidate.id);
  if (existingIdx !== -1 && !options.allowOverwriteExisting) {
    errors.push({
      id: candidate.id,
      field: 'id',
      reason: `Record ID '${candidate.id}' already exists in corpus. Set allowOverwriteExisting=true to update.`,
    });
    return {
      accepted: false,
      errors,
      warnings,
      requiresIndexRebuild: false,
    };
  }

  // 3. Conflict detection against existing corpus
  const simulatedCorpus = [...existingRecords];
  const stagedRecord = normalizeRecord(candidate, options.sourceFile || 'maintenance-staging');

  if (existingIdx !== -1) {
    simulatedCorpus[existingIdx] = stagedRecord;
  } else {
    simulatedCorpus.push(stagedRecord);
  }

  const conflicts = detectCorpusConflicts(simulatedCorpus);
  if (conflicts.hasErrors) {
    for (const issue of conflicts.issues.filter((i) => i.severity === 'error')) {
      errors.push({
        id: issue.recordId,
        field: issue.field,
        reason: `[Maintenance Error] ${issue.rule}: ${issue.message}`,
      });
    }
    return {
      accepted: false,
      errors,
      warnings,
      requiresIndexRebuild: false,
    };
  }

  // Flag any warnings
  for (const issue of conflicts.issues.filter((i) => i.severity === 'warning')) {
    warnings.push({
      id: issue.recordId,
      field: issue.field,
      reason: `[Maintenance Warning] ${issue.rule}: ${issue.message}`,
    });
  }

  // 4. Determine if index rebuilding is necessary
  const oldFingerprint = computeCorpusFingerprint(existingRecords);
  const newFingerprint = computeCorpusFingerprint(simulatedCorpus);
  const requiresIndexRebuild = oldFingerprint !== newFingerprint;

  return {
    accepted: true,
    stagedRecord,
    stagedCorpus: simulatedCorpus,
    errors: [],
    warnings,
    requiresIndexRebuild,
  };
}

/**
 * Manages cache and index invalidation state based on corpus fingerprints.
 */
export class IndexInvalidationTracker {
  private lastCorpusFingerprint: string | null = null;
  private bm25IndexFingerprint: string | null = null;
  private vectorIndexFingerprint: string | null = null;

  constructor(initialRecords: NormalizedKnowledgeRecord[] = []) {
    if (initialRecords.length > 0) {
      this.updateCorpus(initialRecords);
    }
  }

  public updateCorpus(records: NormalizedKnowledgeRecord[]): void {
    this.lastCorpusFingerprint = computeCorpusFingerprint(records);
  }

  public markBM25Clean(): void {
    this.bm25IndexFingerprint = this.lastCorpusFingerprint;
  }

  public markVectorClean(): void {
    this.vectorIndexFingerprint = this.lastCorpusFingerprint;
  }

  public isBM25Dirty(): boolean {
    if (!this.lastCorpusFingerprint) return false;
    return this.bm25IndexFingerprint !== this.lastCorpusFingerprint;
  }

  public isVectorDirty(): boolean {
    if (!this.lastCorpusFingerprint) return false;
    return this.vectorIndexFingerprint !== this.lastCorpusFingerprint;
  }

  public getCorpusFingerprint(): string | null {
    return this.lastCorpusFingerprint;
  }
}
