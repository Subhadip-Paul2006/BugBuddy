#!/usr/bin/env node
/**
 * BugBuddy Knowledge Base — Ingestion & Validation CLI Script
 * Run via: npm run validate:knowledge OR npx tsx scripts/validate_knowledge.ts
 */

import * as path from 'node:path';
import { ingestKnowledgeDirectory } from '../src/knowledge/ingest';
import { formatIngestionSummary, formatCorpusQualityAudit } from '../src/knowledge/reporter';
import { auditCorpusQuality, detectCorpusConflicts } from '../src/knowledge/maintenance';

async function main() {
  const args = process.argv.slice(2);
  const targetDir = args.find((a) => !a.startsWith('--')) || path.resolve(process.cwd(), 'knowledge');
  const runDeepAudit = args.includes('--audit') || args.includes('--stage8') || true; // Run full audit by default

  console.log(`[BugBuddy KB] Ingesting knowledge directory: ${targetDir}`);

  const result = await ingestKnowledgeDirectory(targetDir, { strict: true });
  console.log(formatIngestionSummary(result));

  if (!result.success || result.errors.length > 0) {
    console.error(`[BugBuddy KB] Validation failed with ${result.errors.length} error(s).`);
    process.exit(1);
  }

  if (runDeepAudit && result.records.length > 0) {
    const qualityAudit = auditCorpusQuality(result.records);
    console.log(formatCorpusQualityAudit(qualityAudit));

    const conflicts = detectCorpusConflicts(result.records);
    if (conflicts.hasErrors) {
      console.error(`[BugBuddy KB] Conflict audit failed with ${conflicts.duplicateIds.length} duplicate IDs or critical collisions.`);
      process.exit(1);
    }
  }

  console.log('[BugBuddy KB] All knowledge base records validated and audited successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[BugBuddy KB] Unexpected execution error:', err);
  process.exit(1);
});
