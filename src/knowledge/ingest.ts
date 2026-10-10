/**
 * BugBuddy Knowledge Base — Local Document Ingestion Engine
 * Discovers, safely parses, normalizes, and validates curated knowledge files.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type {
  CanonicalLanguage,
  IngestionResult,
  NormalizedKnowledgeRecord,
  ValidationError,
} from './types.ts';
import { SUPPORTED_LANGUAGES } from './schema.ts';
import { normalizeRecord } from './normalizer.ts';
import { validateRecord } from './validator.ts';

export interface IngestionOptions {
  strict?: boolean;
  seenIds?: Set<string>;
}

export async function ingestKnowledgeFile(
  filePath: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  const seenIds = options.seenIds ?? new Set<string>();
  const records: NormalizedKnowledgeRecord[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const recordsByLanguage = createLanguageCountMap();

  let rawContent: string;
  try {
    rawContent = await fs.readFile(filePath, 'utf-8');
  } catch (err: any) {
    return {
      success: false,
      totalFiles: 0,
      totalRecords: 0,
      recordsByLanguage,
      records: [],
      errors: [
        {
          file: filePath,
          reason: `Failed to read file: ${err.message}`,
        },
      ],
      warnings: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err: any) {
    return {
      success: false,
      totalFiles: 1,
      totalRecords: 0,
      recordsByLanguage,
      records: [],
      errors: [
        {
          file: filePath,
          reason: `Malformed JSON in file: ${err.message}`,
        },
      ],
      warnings: [],
    };
  }

  const rawEntries: any[] = Array.isArray(parsed) ? parsed : [parsed];

  for (let idx = 0; idx < rawEntries.length; idx++) {
    const raw = rawEntries[idx];
    const validation = validateRecord(raw, {
      file: filePath,
      seenIds,
    });

    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    if (validation.isValid) {
      const normalized = normalizeRecord(raw, filePath);
      records.push(normalized);
      if (normalized.language in recordsByLanguage) {
        recordsByLanguage[normalized.language]++;
      }
    }
  }

  return {
    success: errors.length === 0,
    totalFiles: 1,
    totalRecords: records.length,
    recordsByLanguage,
    records,
    errors,
    warnings,
  };
}

export async function ingestKnowledgeDirectory(
  dirPath: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  const seenIds = options.seenIds ?? new Set<string>();
  const allRecords: NormalizedKnowledgeRecord[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const recordsByLanguage = createLanguageCountMap();

  let dirents: any[];
  try {
    dirents = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (err: any) {
    return {
      success: false,
      totalFiles: 0,
      totalRecords: 0,
      recordsByLanguage,
      records: [],
      errors: [
        {
          file: dirPath,
          reason: `Knowledge directory not accessible or missing: ${err.message}`,
        },
      ],
      warnings: [],
    };
  }

  const jsonFiles = dirents
    .filter((d) => d.isFile() && d.name.endsWith('.json'))
    .map((d) => path.join(dirPath, d.name))
    .sort();

  if (jsonFiles.length === 0) {
    return {
      success: false,
      totalFiles: 0,
      totalRecords: 0,
      recordsByLanguage,
      records: [],
      errors: [
        {
          file: dirPath,
          reason: `Knowledge directory contains no .json files to ingest.`,
        },
      ],
      warnings: [],
    };
  }

  for (const file of jsonFiles) {
    const fileResult = await ingestKnowledgeFile(file, {
      strict: options.strict,
      seenIds,
    });

    allErrors.push(...fileResult.errors);
    allWarnings.push(...fileResult.warnings);
    allRecords.push(...fileResult.records);

    for (const lang of SUPPORTED_LANGUAGES) {
      recordsByLanguage[lang] += fileResult.recordsByLanguage[lang];
    }
  }

  return {
    success: allErrors.length === 0,
    totalFiles: jsonFiles.length,
    totalRecords: allRecords.length,
    recordsByLanguage,
    records: allRecords,
    errors: allErrors,
    warnings: allWarnings,
  };
}

function createLanguageCountMap(): Record<CanonicalLanguage, number> {
  return {
    c: 0,
    cpp: 0,
    java: 0,
    python: 0,
    javascript: 0,
    typescript: 0,
  };
}
