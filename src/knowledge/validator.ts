/**
 * BugBuddy Knowledge Base — Strict Schema & Contract Validator
 * Validates knowledge records against canonical contracts with actionable diagnostics.
 */

import type {
  ValidationError,
  ValidationResult,
} from './types.ts';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CATEGORIES,
  SUPPORTED_DIFFICULTIES,
  REQUIRED_FIELDS,
  ID_REGEX,
} from './schema.ts';
import { normalizeLanguage } from './normalizer.ts';

export interface ValidationContext {
  file?: string;
  seenIds?: Set<string>;
}

export function isValidHttpUrl(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.trim() === '') {
    return false;
  }
  try {
    const parsed = new URL(candidate.trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0 &&
      parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

export function validateRecord(
  raw: any,
  context: ValidationContext = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const file = context.file;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      errors: [
        {
          file,
          reason: 'Record must be a non-null JSON object.',
        },
      ],
      warnings: [],
    };
  }

  const recordId = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;

  // 1. Required fields presence check
  for (const field of REQUIRED_FIELDS) {
    if (raw[field] === undefined || raw[field] === null) {
      errors.push({
        id: recordId,
        file,
        field,
        reason: `Missing required field: '${field}'.`,
      });
    }
  }

  // 2. ID validation
  if (raw.id !== undefined && raw.id !== null) {
    if (typeof raw.id !== 'string' || raw.id.trim() === '') {
      errors.push({
        id: recordId,
        file,
        field: 'id',
        reason: 'ID must be a non-blank string.',
      });
    } else {
      const trimmedId = raw.id.trim();
      if (!ID_REGEX.test(trimmedId)) {
        errors.push({
          id: trimmedId,
          file,
          field: 'id',
          reason: `ID '${trimmedId}' must be a lowercase kebab-case slug (e.g. 'c-null-ptr-deref').`,
        });
      }
      if (context.seenIds) {
        if (context.seenIds.has(trimmedId)) {
          errors.push({
            id: trimmedId,
            file,
            field: 'id',
            reason: `Duplicate ID detected: '${trimmedId}' already exists in the loaded dataset.`,
          });
        } else {
          context.seenIds.add(trimmedId);
        }
      }
    }
  }

  // 3. Language validation
  if (raw.language !== undefined && raw.language !== null) {
    if (typeof raw.language !== 'string' || raw.language.trim() === '') {
      errors.push({
        id: recordId,
        file,
        field: 'language',
        reason: 'Language must be a non-blank string.',
      });
    } else {
      const normalizedLang = normalizeLanguage(raw.language);
      if (!normalizedLang || !SUPPORTED_LANGUAGES.includes(normalizedLang)) {
        errors.push({
          id: recordId,
          file,
          field: 'language',
          reason: `Unsupported language '${raw.language}'. Must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.`,
        });
      }
    }
  }

  // 4. Category validation
  if (raw.category !== undefined && raw.category !== null) {
    if (typeof raw.category !== 'string' || raw.category.trim() === '') {
      errors.push({
        id: recordId,
        file,
        field: 'category',
        reason: 'Category must be a non-blank string.',
      });
    } else if (!SUPPORTED_CATEGORIES.includes(raw.category)) {
      errors.push({
        id: recordId,
        file,
        field: 'category',
        reason: `Unsupported category '${raw.category}'. Must be one of: ${SUPPORTED_CATEGORIES.join(', ')}.`,
      });
    }
  }

  // 5. Difficulty validation
  if (raw.difficulty !== undefined && raw.difficulty !== null) {
    if (typeof raw.difficulty !== 'string' || raw.difficulty.trim() === '') {
      errors.push({
        id: recordId,
        file,
        field: 'difficulty',
        reason: 'Difficulty must be a non-blank string.',
      });
    } else {
      const trimmedDiff = raw.difficulty.trim().toLowerCase();
      if (!SUPPORTED_DIFFICULTIES.includes(trimmedDiff as any)) {
        errors.push({
          id: recordId,
          file,
          field: 'difficulty',
          reason: `Invalid difficulty '${raw.difficulty}'. Must be one of: ${SUPPORTED_DIFFICULTIES.join(', ')}.`,
        });
      }
    }
  }

  // 6. Required non-blank text fields
  const textFields = [
    'title',
    'symptoms',
    'roast',
    'diagnosis',
    'badExample',
    'fixedExample',
    'whyItWorks',
    'tests',
  ] as const;

  for (const tf of textFields) {
    if (raw[tf] !== undefined && raw[tf] !== null) {
      if (typeof raw[tf] !== 'string') {
        errors.push({
          id: recordId,
          file,
          field: tf,
          reason: `Field '${tf}' must be a string.`,
        });
      } else if (raw[tf].trim() === '') {
        errors.push({
          id: recordId,
          file,
          field: tf,
          reason: `Required string field '${tf}' cannot be blank or whitespace-only.`,
        });
      }
    }
  }

  // 7. Buggy vs Fixed Code Check
  if (
    typeof raw.badExample === 'string' &&
    typeof raw.fixedExample === 'string' &&
    raw.badExample.trim().length > 0 &&
    raw.fixedExample.trim().length > 0 &&
    raw.badExample.trim() === raw.fixedExample.trim()
  ) {
    errors.push({
      id: recordId,
      file,
      field: 'fixedExample',
      reason: "'fixedExample' must differ from 'badExample'. A corrected snippet cannot be identical to buggy code.",
    });
  }

  // 8. Debugging steps array
  if (raw.debuggingSteps !== undefined && raw.debuggingSteps !== null) {
    if (!Array.isArray(raw.debuggingSteps)) {
      errors.push({
        id: recordId,
        file,
        field: 'debuggingSteps',
        reason: "'debuggingSteps' must be an array of strings.",
      });
    } else if (raw.debuggingSteps.length === 0) {
      errors.push({
        id: recordId,
        file,
        field: 'debuggingSteps',
        reason: "'debuggingSteps' must contain at least one debugging step.",
      });
    } else {
      raw.debuggingSteps.forEach((step: any, index: number) => {
        if (typeof step !== 'string' || step.trim() === '') {
          errors.push({
            id: recordId,
            file,
            field: `debuggingSteps[${index}]`,
            reason: `Debugging step at index ${index} must be a non-blank string.`,
          });
        }
      });
    }
  }

  // 9. Tags array
  if (raw.tags !== undefined && raw.tags !== null) {
    if (!Array.isArray(raw.tags)) {
      errors.push({
        id: recordId,
        file,
        field: 'tags',
        reason: "'tags' must be an array of strings.",
      });
    } else if (raw.tags.length === 0) {
      errors.push({
        id: recordId,
        file,
        field: 'tags',
        reason: "'tags' must contain at least one search tag.",
      });
    } else {
      raw.tags.forEach((tag: any, index: number) => {
        if (typeof tag !== 'string' || tag.trim() === '') {
          errors.push({
            id: recordId,
            file,
            field: `tags[${index}]`,
            reason: `Tag at index ${index} must be a non-blank string.`,
          });
        }
      });
    }
  }

  // 10. Sources array and URL validation
  if (raw.sources !== undefined && raw.sources !== null) {
    if (!Array.isArray(raw.sources)) {
      errors.push({
        id: recordId,
        file,
        field: 'sources',
        reason: "'sources' must be an array of source objects.",
      });
    } else if (raw.sources.length === 0) {
      errors.push({
        id: recordId,
        file,
        field: 'sources',
        reason: "'sources' must contain at least one documentation source.",
      });
    } else {
      raw.sources.forEach((src: any, index: number) => {
        if (!src || typeof src !== 'object' || Array.isArray(src)) {
          errors.push({
            id: recordId,
            file,
            field: `sources[${index}]`,
            reason: `Source at index ${index} must be an object with a valid 'url'.`,
          });
        } else {
          if (!src.url || typeof src.url !== 'string' || src.url.trim() === '') {
            errors.push({
              id: recordId,
              file,
              field: `sources[${index}].url`,
              reason: `Source at index ${index} is missing a non-blank 'url'.`,
            });
          } else if (!isValidHttpUrl(src.url)) {
            errors.push({
              id: recordId,
              file,
              field: `sources[${index}].url`,
              reason: `Source at index ${index} has invalid HTTP/HTTPS URL: '${src.url}'.`,
            });
          }
          if (src.title !== undefined && (typeof src.title !== 'string' || src.title.trim() === '')) {
            warnings.push({
              id: recordId,
              file,
              field: `sources[${index}].title`,
              reason: `Source title at index ${index} is blank. Descriptive title is recommended.`,
            });
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateDataset(
  records: any[],
  context: ValidationContext = {}
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const seenIds = context.seenIds ?? new Set<string>();

  if (!Array.isArray(records)) {
    return {
      isValid: false,
      errors: [
        {
          file: context.file,
          reason: 'Dataset must be an array of knowledge entries.',
        },
      ],
      warnings: [],
    };
  }

  for (let i = 0; i < records.length; i++) {
    const result = validateRecord(records[i], {
      file: context.file,
      seenIds,
    });
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
