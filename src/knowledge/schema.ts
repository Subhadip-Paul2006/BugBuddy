/**
 * BugBuddy Knowledge Base — Schema Specifications & Constraints
 */

import type {
  CanonicalLanguage,
  CanonicalCategory,
  CanonicalDifficulty,
} from './types.ts';

export const SUPPORTED_LANGUAGES: readonly CanonicalLanguage[] = [
  'c',
  'cpp',
  'java',
  'python',
  'javascript',
  'typescript',
] as const;

export const LANGUAGE_ALIASES: Record<string, CanonicalLanguage> = {
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cplusplus: 'cpp',
  java: 'java',
  python: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  node: 'javascript',
  nodejs: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
};

export const SUPPORTED_CATEGORIES: readonly CanonicalCategory[] = [
  'silly_mistake',
  'syntax_error',
  'runtime_error',
  'logic_error',
  'type_compilation',
  'incomplete_submission',
  'difficult_ambiguous',
  'unsupported_error',
] as const;

export const SUPPORTED_DIFFICULTIES: readonly CanonicalDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

export const REQUIRED_FIELDS = [
  'id',
  'language',
  'title',
  'category',
  'difficulty',
  'symptoms',
  'roast',
  'diagnosis',
  'debuggingSteps',
  'badExample',
  'fixedExample',
  'whyItWorks',
  'tests',
  'tags',
  'sources',
] as const;

export const ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
