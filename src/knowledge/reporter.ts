/**
 * BugBuddy Knowledge Base — Diagnostics & Audit Reporter
 * Generates human-readable terminal and Markdown reports from ingestion and validation results.
 */

import type { IngestionResult, ValidationError } from './types';
import { SUPPORTED_LANGUAGES } from './schema';

export function formatDiagnostics(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors found.';
  }

  const lines = errors.map((err, idx) => {
    const parts: string[] = [];
    if (err.file) parts.push(`File: ${err.file}`);
    if (err.id) parts.push(`ID: ${err.id}`);
    if (err.field) parts.push(`Field: ${err.field}`);
    const loc = parts.length > 0 ? ` [${parts.join(' | ')}]` : '';
    return `  ${idx + 1}.${loc} ${err.reason}`;
  });

  return `Validation Diagnostics (${errors.length} error${errors.length === 1 ? '' : 's'}):\n${lines.join('\n')}`;
}

export function formatIngestionSummary(result: IngestionResult): string {
  const statusStr = result.success ? 'PASSED' : 'FAILED';
  const tableRows = SUPPORTED_LANGUAGES.map((lang) => {
    const count = result.recordsByLanguage[lang] || 0;
    const met = count >= 10 ? '✓' : '✗ (<10)';
    return `  - ${lang.padEnd(12)}: ${String(count).padStart(3)} entries ${met}`;
  }).join('\n');

  let output = `
==================================================
 BugBuddy Knowledge Base Ingestion Summary
 Status: ${statusStr}
 Files Processed: ${result.totalFiles}
 Valid Records Ingested: ${result.totalRecords}
 Errors Encountered: ${result.errors.length}
 Warnings Encountered: ${result.warnings.length}
--------------------------------------------------
 Per-Language Breakdown (Target: >=10 per language):
${tableRows}
==================================================
`;

  if (result.errors.length > 0) {
    output += '\n' + formatDiagnostics(result.errors);
  }

  return output;
}

export function formatCorpusQualityAudit(audit: import('./maintenance').CorpusQualityAuditReport): string {
  const statusStr = audit.recordsWithErrorsCount === 0 && audit.perLanguageMeetsTarget ? 'PASSED' : 'NEEDS_ATTENTION';
  const tableRows = SUPPORTED_LANGUAGES.map((lang) => {
    const count = audit.recordsByLanguage[lang] || 0;
    const met = count >= 10 ? '✓' : '✗ (<10)';
    return `  - ${lang.padEnd(12)}: ${String(count).padStart(3)} entries ${met}`;
  }).join('\n');

  let output = `
==================================================
 BugBuddy Stage 8 Corpus Quality Audit Report
 Status: ${statusStr}
 Total Records Audited: ${audit.totalRecords}
 Perfect Clean Records: ${audit.perfectRecordsCount}
 Records with Warnings: ${audit.recordsWithWarningsCount}
 Records with Errors:   ${audit.recordsWithErrorsCount}
 Corpus SHA-256:        ${audit.fingerprint.slice(0, 16)}...
--------------------------------------------------
 Per-Language Distribution:
${tableRows}
==================================================
`;

  if (audit.allIssues.length > 0) {
    output += `\nDetailed Audit Findings (${audit.allIssues.length} finding${audit.allIssues.length === 1 ? '' : 's'}):\n`;
    output += audit.allIssues
      .map(
        (issue, idx) =>
          `  ${idx + 1}. [${issue.severity.toUpperCase()}] [${issue.recordId}] ${issue.rule}: ${issue.message}`
      )
      .join('\n');
  }

  return output;
}

