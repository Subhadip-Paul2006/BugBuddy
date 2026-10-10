/**
 * BugBuddy Knowledge Base — Record Normalization Engine
 * Normalizes language names, trims fields, and generates Stage 3 retrieval payloads.
 */

import type {
  CanonicalLanguage,
  CanonicalCategory,
  CanonicalDifficulty,
  KnowledgeEntry,
  NormalizedKnowledgeRecord,
} from './types.ts';
import { LANGUAGE_ALIASES, SUPPORTED_DIFFICULTIES } from './schema.ts';

export function normalizeLanguage(lang: unknown): CanonicalLanguage | null {
  if (typeof lang !== 'string') return null;
  const key = lang.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? null;
}

export function normalizeDifficulty(diff: unknown): CanonicalDifficulty | null {
  if (typeof diff !== 'string') return null;
  const key = diff.trim().toLowerCase() as CanonicalDifficulty;
  return SUPPORTED_DIFFICULTIES.includes(key) ? key : null;
}

export function normalizeRecord(
  raw: any,
  sourceFile: string = 'unknown'
): NormalizedKnowledgeRecord {
  const normLang = normalizeLanguage(raw.language) ?? (raw.language as CanonicalLanguage);
  const normDiff = normalizeDifficulty(raw.difficulty) ?? (raw.difficulty as CanonicalDifficulty);

  const cleanSteps = Array.isArray(raw.debuggingSteps)
    ? raw.debuggingSteps.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  const cleanTags = Array.isArray(raw.tags)
    ? raw.tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  const cleanSources = Array.isArray(raw.sources)
    ? raw.sources.map((s: any) => ({
        title: s.title ? String(s.title).trim() : undefined,
        url: String(s.url || '').trim(),
      }))
    : [];

  const title = String(raw.title || '').trim();
  const symptoms = String(raw.symptoms || '').trim();
  const diagnosis = String(raw.diagnosis || '').trim();
  const whyItWorks = String(raw.whyItWorks || '').trim();

  // Search content composite ready for future Stage 3 token retrieval
  const searchParts = [
    title,
    symptoms,
    diagnosis,
    whyItWorks,
    cleanTags.join(' '),
    cleanSteps.join(' '),
  ].filter(Boolean);

  const searchContent = searchParts.join(' \n');

  return {
    id: String(raw.id || '').trim(),
    language: normLang,
    title,
    category: raw.category as CanonicalCategory,
    difficulty: normDiff,
    symptoms,
    roast: String(raw.roast || '').trim(),
    diagnosis,
    debuggingSteps: cleanSteps,
    badExample: String(raw.badExample || '').trim(),
    fixedExample: String(raw.fixedExample || '').trim(),
    whyItWorks,
    tests: String(raw.tests || '').trim(),
    tags: cleanTags,
    sources: cleanSources,
    sourceFile,
    searchContent,
    ingestedAt: new Date().toISOString(),
  };
}
