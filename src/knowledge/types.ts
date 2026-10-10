/**
 * BugBuddy Knowledge Base — Core Types and Interfaces
 * Canonical representations for curated debugging knowledge.
 */

export type CanonicalLanguage =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'typescript';

export type CanonicalCategory =
  | 'silly_mistake'
  | 'syntax_error'
  | 'runtime_error'
  | 'logic_error'
  | 'type_compilation'
  | 'incomplete_submission'
  | 'difficult_ambiguous'
  | 'unsupported_error';

export type CanonicalDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface KnowledgeSource {
  title?: string;
  url: string;
}

export interface KnowledgeEntry {
  id: string;
  language: CanonicalLanguage;
  title: string;
  category: CanonicalCategory;
  difficulty: CanonicalDifficulty;
  symptoms: string;
  roast: string;
  diagnosis: string;
  debuggingSteps: string[];
  badExample: string;
  fixedExample: string;
  whyItWorks: string;
  tests: string;
  tags: string[];
  sources: KnowledgeSource[];
}

export interface NormalizedKnowledgeRecord extends KnowledgeEntry {
  sourceFile: string;
  searchContent: string;
  ingestedAt: string;
}

export interface ValidationError {
  id?: string;
  file?: string;
  field?: string;
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface IngestionResult {
  success: boolean;
  totalFiles: number;
  totalRecords: number;
  recordsByLanguage: Record<CanonicalLanguage, number>;
  records: NormalizedKnowledgeRecord[];
  errors: ValidationError[];
  warnings: ValidationError[];
}
