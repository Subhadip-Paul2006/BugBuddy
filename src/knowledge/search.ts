/**
 * BugBuddy Knowledge Base — Stage 3 Search & Keyword Retrieval Engine
 * 
 * Provides in-memory weighted BM25 relevance ranking, tokenization,
 * language & category filtering, deterministic tie-breaking,
 * and LLM prompt context assembly.
 */

import type {
  CanonicalLanguage,
  CanonicalCategory,
  CanonicalDifficulty,
  KnowledgeEntry,
  NormalizedKnowledgeRecord,
} from './types';
import { normalizeRecord } from './normalizer';

/**
 * Configurable weights for different record fields in BM25 relevance scoring.
 */
export interface FieldWeights {
  title: number;
  tags: number;
  symptoms: number;
  diagnosis: number;
  debuggingSteps: number;
  whyItWorks: number;
  examples: number;
  roast: number;
}

export const DEFAULT_FIELD_WEIGHTS: FieldWeights = {
  title: 6.0,
  tags: 5.0,
  symptoms: 3.5,
  diagnosis: 3.0,
  debuggingSteps: 2.0,
  whyItWorks: 2.0,
  examples: 1.0,
  roast: 0.5,
};

/**
 * Filter criteria for constraining search results.
 */
export interface SearchFilter {
  language?: CanonicalLanguage | CanonicalLanguage[];
  category?: CanonicalCategory | CanonicalCategory[];
  difficulty?: CanonicalDifficulty | CanonicalDifficulty[];
  tags?: string | string[];
}

/**
 * Options for configuring search execution.
 */
export interface SearchOptions {
  filter?: SearchFilter;
  limit?: number;
  offset?: number;
  minScore?: number;
  weights?: Partial<FieldWeights>;
  boostExactMatch?: boolean;
}

/**
 * Individual ranked search result.
 */
export interface SearchResultItem {
  record: NormalizedKnowledgeRecord;
  score: number;
  matchedTerms: string[];
}

/**
 * Overall search query result.
 */
export interface SearchResults {
  query: string;
  total: number;
  results: SearchResultItem[];
  executionTimeMs: number;
}

/**
 * Options for assembling LLM prompt context from search results.
 */
export interface PromptContextOptions {
  maxEntries?: number;
  includeExamples?: boolean;
  includeSteps?: boolean;
  headerTitle?: string;
}

/**
 * Standard stop words that carry minimal discriminatory value.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
]);

/**
 * Splits camelCase identifiers into individual constituent parts.
 * e.g. "NullPointerException" -> ["nullpointerexception", "null", "pointer", "exception"]
 */
function splitCamelCase(word: string): string[] {
  const parts = word.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return [word.toLowerCase(), ...parts];
  }
  return [word.toLowerCase()];
}

/**
 * Tokenizes text into searchable tokens while preserving programming tokens
 * like "c++", "c#", snake_case identifiers, and hyphenated terms.
 */
export function tokenize(text: string, removeStopWords: boolean = false): string[] {
  if (!text || typeof text !== 'string') return [];

  // Match alphanumeric sequences, plus special symbols like ++ or # or internal underscores/hyphens
  const rawTokens = text.match(/[a-z0-9_#+]+(?:-[a-z0-9_#+]+)*/gi) ?? [];
  const tokenSet = new Set<string>();

  for (const raw of rawTokens) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    // Preserve special language tokens like c++, c#
    if (lower === 'c++' || lower === 'c#') {
      tokenSet.add(lower);
      continue;
    }

    // Split on underscores or hyphens to index both the compound and components
    const subParts = lower.split(/[-_]+/).filter(Boolean);
    if (subParts.length > 1) {
      tokenSet.add(lower);
      for (const sp of subParts) {
        if (sp.length > 1 || sp === 'c') {
          tokenSet.add(sp);
        }
      }
    } else {
      // Handle camelCase
      const camelParts = splitCamelCase(trimmed);
      for (const cp of camelParts) {
        if (cp.length > 1 || cp === 'c') {
          tokenSet.add(cp);
        }
      }
    }
  }

  const tokens = Array.from(tokenSet);
  if (removeStopWords) {
    const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
    return filtered.length > 0 ? filtered : tokens;
  }
  return tokens;
}

/**
 * Checks if a record satisfies the provided search filter.
 */
export function matchesFilter(record: NormalizedKnowledgeRecord, filter?: SearchFilter): boolean {
  if (!filter) return true;

  // Language filter
  if (filter.language) {
    const langs = Array.isArray(filter.language) ? filter.language : [filter.language];
    if (!langs.includes(record.language)) return false;
  }

  // Category filter
  if (filter.category) {
    const cats = Array.isArray(filter.category) ? filter.category : [filter.category];
    if (!cats.includes(record.category)) return false;
  }

  // Difficulty filter
  if (filter.difficulty) {
    const diffs = Array.isArray(filter.difficulty) ? filter.difficulty : [filter.difficulty];
    if (!diffs.includes(record.difficulty)) return false;
  }

  // Tags filter (must contain at least one of the specified filter tags)
  if (filter.tags) {
    const targetTags = (Array.isArray(filter.tags) ? filter.tags : [filter.tags])
      .map((t) => t.trim().toLowerCase());
    const recordTags = record.tags.map((t) => t.toLowerCase());
    const hasTag = targetTags.some((t) => recordTags.includes(t));
    if (!hasTag) return false;
  }

  return true;
}

/**
 * Internal representation of an indexed document with pre-tokenized fields.
 */
interface IndexedDocument {
  record: NormalizedKnowledgeRecord;
  fieldTokens: {
    title: Map<string, number>;
    tags: Map<string, number>;
    symptoms: Map<string, number>;
    diagnosis: Map<string, number>;
    debuggingSteps: Map<string, number>;
    whyItWorks: Map<string, number>;
    examples: Map<string, number>;
    roast: Map<string, number>;
  };
  totalWeightedLength: number;
}

/**
 * In-memory search index supporting BM25 retrieval, field-weighting,
 * filtering, and deterministic ordering.
 */
export class KnowledgeSearchIndex {
  private documents: Map<string, IndexedDocument> = new Map();
  private docFrequency: Map<string, number> = new Map();
  private avgDocumentLength: number = 0;
  private fieldWeights: FieldWeights;

  constructor(
    records?: (NormalizedKnowledgeRecord | KnowledgeEntry)[],
    weights?: Partial<FieldWeights>
  ) {
    this.fieldWeights = { ...DEFAULT_FIELD_WEIGHTS, ...weights };
    if (records && records.length > 0) {
      this.addAll(records);
    }
  }

  /**
   * Adds or updates a record in the index.
   */
  public add(entry: NormalizedKnowledgeRecord | KnowledgeEntry): void {
    const record: NormalizedKnowledgeRecord =
      'searchContent' in entry && typeof (entry as any).searchContent === 'string'
        ? (entry as NormalizedKnowledgeRecord)
        : normalizeRecord(entry, 'in-memory');

    // Remove existing if already indexed
    if (this.documents.has(record.id)) {
      this.remove(record.id);
    }

    const fieldTokens = {
      title: this.countTokens(tokenize(record.title)),
      tags: this.countTokens(tokenize(record.tags.join(' '))),
      symptoms: this.countTokens(tokenize(record.symptoms)),
      diagnosis: this.countTokens(tokenize(record.diagnosis)),
      debuggingSteps: this.countTokens(tokenize(record.debuggingSteps.join(' '))),
      whyItWorks: this.countTokens(tokenize(record.whyItWorks)),
      examples: this.countTokens(tokenize(`${record.badExample} ${record.fixedExample}`)),
      roast: this.countTokens(tokenize(record.roast)),
    };

    let totalWeightedLength = 0;
    const uniqueDocTerms = new Set<string>();

    for (const [fieldName, tokensMap] of Object.entries(fieldTokens)) {
      const weight = this.fieldWeights[fieldName as keyof FieldWeights] ?? 1.0;
      for (const [term, count] of tokensMap.entries()) {
        totalWeightedLength += count * weight;
        uniqueDocTerms.add(term);
      }
    }

    // Update document frequencies
    for (const term of uniqueDocTerms) {
      this.docFrequency.set(term, (this.docFrequency.get(term) ?? 0) + 1);
    }

    this.documents.set(record.id, {
      record,
      fieldTokens,
      totalWeightedLength: Math.max(1, totalWeightedLength),
    });

    this.recalculateAvgDocLength();
  }

  /**
   * Adds multiple records to the index.
   */
  public addAll(entries: (NormalizedKnowledgeRecord | KnowledgeEntry)[]): void {
    for (const entry of entries) {
      this.add(entry);
    }
  }

  /**
   * Removes a record by ID from the index.
   */
  public remove(id: string): boolean {
    const existing = this.documents.get(id);
    if (!existing) return false;

    // Decrement document frequencies
    const uniqueDocTerms = new Set<string>();
    for (const tokensMap of Object.values(existing.fieldTokens)) {
      for (const term of tokensMap.keys()) {
        uniqueDocTerms.add(term);
      }
    }

    for (const term of uniqueDocTerms) {
      const current = this.docFrequency.get(term) ?? 1;
      if (current <= 1) {
        this.docFrequency.delete(term);
      } else {
        this.docFrequency.set(term, current - 1);
      }
    }

    this.documents.delete(id);
    this.recalculateAvgDocLength();
    return true;
  }

  /**
   * Clears all records from the index.
   */
  public clear(): void {
    this.documents.clear();
    this.docFrequency.clear();
    this.avgDocumentLength = 0;
  }

  /**
   * Returns the count of indexed records.
   */
  public size(): number {
    return this.documents.size;
  }

  /**
   * Retrieves an indexed record by its ID.
   */
  public get(id: string): NormalizedKnowledgeRecord | undefined {
    return this.documents.get(id)?.record;
  }

  /**
   * Returns all indexed records.
   */
  public getAll(): NormalizedKnowledgeRecord[] {
    return Array.from(this.documents.values()).map((d) => d.record);
  }

  /**
   * Alias for getAll().
   */
  public getAllRecords(): NormalizedKnowledgeRecord[] {
    return this.getAll();
  }

  /**
   * Executes a ranked BM25 search over the index with optional filters.
   */
  public search(query: string, options: SearchOptions = {}): SearchResults {
    const startTime = performance.now();
    const cleanQuery = (query || '').trim();
    const queryTokens = tokenize(cleanQuery, false);
    const limit = options.limit !== undefined && options.limit > 0 ? options.limit : 10;
    const offset = options.offset !== undefined && options.offset >= 0 ? options.offset : 0;
    const minScore = options.minScore !== undefined ? options.minScore : 0.001;
    const boostExact = options.boostExactMatch !== false;

    // Candidate selection and scoring
    const scoredItems: SearchResultItem[] = [];
    const N = this.documents.size;
    const k1 = 1.2;
    const b = 0.75;
    const avgdl = this.avgDocumentLength || 1;

    // If query is empty, return filtered items deterministically by ID with baseline score 1.0
    if (queryTokens.length === 0) {
      for (const doc of this.documents.values()) {
        if (matchesFilter(doc.record, options.filter)) {
          scoredItems.push({
            record: doc.record,
            score: 1.0,
            matchedTerms: [],
          });
        }
      }

      scoredItems.sort((a, bItem) => a.record.id.localeCompare(bItem.record.id));
      const paged = scoredItems.slice(offset, offset + limit);
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

      return {
        query: cleanQuery,
        total: scoredItems.length,
        results: paged,
        executionTimeMs,
      };
    }

    const lowerQuery = cleanQuery.toLowerCase();

    for (const doc of this.documents.values()) {
      if (!matchesFilter(doc.record, options.filter)) {
        continue;
      }

      let docScore = 0;
      const matchedTermsSet = new Set<string>();

      for (const term of queryTokens) {
        const df = this.docFrequency.get(term) ?? 0;
        if (df === 0) continue;

        // Standard BM25 IDF formulation
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

        // Calculate weighted term frequency across fields
        let weightedTf = 0;
        for (const [fieldName, tokensMap] of Object.entries(doc.fieldTokens)) {
          const count = tokensMap.get(term);
          if (count !== undefined && count > 0) {
            const weight = this.fieldWeights[fieldName as keyof FieldWeights] ?? 1.0;
            weightedTf += count * weight;
            matchedTermsSet.add(term);
          }
        }

        if (weightedTf > 0) {
          // BM25 term score component
          const normLength = 1 - b + b * (doc.totalWeightedLength / avgdl);
          const termScore = idf * ((weightedTf * (k1 + 1)) / (weightedTf + k1 * normLength));
          docScore += termScore;
        }
      }

      // Exact phrase/substring boosting for high precision
      if (boostExact && cleanQuery.length > 2) {
        const titleLower = doc.record.title.toLowerCase();
        const symptomsLower = doc.record.symptoms.toLowerCase();
        const diagnosisLower = doc.record.diagnosis.toLowerCase();

        if (titleLower === lowerQuery) {
          docScore += 12.0; // Perfect exact title match
        } else if (titleLower.includes(lowerQuery)) {
          docScore += 6.0; // Title contains query phrase
        }

        if (doc.record.tags.some((t) => t.toLowerCase() === lowerQuery)) {
          docScore += 5.0; // Exact tag match
        }

        if (symptomsLower.includes(lowerQuery)) {
          docScore += 3.0;
        }

        if (diagnosisLower.includes(lowerQuery)) {
          docScore += 2.0;
        }
      }

      if (docScore >= minScore && matchedTermsSet.size > 0) {
        scoredItems.push({
          record: doc.record,
          score: Number(docScore.toFixed(4)),
          matchedTerms: Array.from(matchedTermsSet),
        });
      }
    }

    // Deterministic sorting: Highest score first; if equal (difference < 1e-4), sort alphabetically by ID
    scoredItems.sort((a, bItem) => {
      const diff = bItem.score - a.score;
      if (Math.abs(diff) > 0.0001) {
        return diff;
      }
      return a.record.id.localeCompare(bItem.record.id);
    });

    const paged = scoredItems.slice(offset, offset + limit);
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      query: cleanQuery,
      total: scoredItems.length,
      results: paged,
      executionTimeMs,
    };
  }

  private countTokens(tokens: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const t of tokens) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return map;
  }

  private recalculateAvgDocLength(): void {
    if (this.documents.size === 0) {
      this.avgDocumentLength = 0;
      return;
    }
    let sum = 0;
    for (const doc of this.documents.values()) {
      sum += doc.totalWeightedLength;
    }
    this.avgDocumentLength = sum / this.documents.size;
  }
}

/**
 * Functional helper to search across an array of records without manually instantiating an index.
 */
export function searchKnowledgeBase(
  records: (NormalizedKnowledgeRecord | KnowledgeEntry)[],
  query: string,
  options?: SearchOptions
): SearchResults {
  const index = new KnowledgeSearchIndex(records, options?.weights);
  return index.search(query, options);
}

/**
 * Formats top search results into a clean, markdown prompt context block
 * suitable for grounding LLM prompts in verified debugging knowledge.
 */
export function buildKnowledgePromptContext(
  results: (SearchResultItem | NormalizedKnowledgeRecord)[],
  options: PromptContextOptions = {}
): string {
  const maxEntries = options.maxEntries ?? 3;
  const includeExamples = options.includeExamples ?? true;
  const includeSteps = options.includeSteps ?? true;
  const headerTitle = options.headerTitle ?? 'Relevant Knowledge Base References';

  const rawRecords: NormalizedKnowledgeRecord[] = results
    .slice(0, maxEntries)
    .map((item) => ('record' in item ? item.record : item));

  if (rawRecords.length === 0) {
    return '';
  }

  const sections: string[] = [`### ${headerTitle}\n`];

  for (let i = 0; i < rawRecords.length; i++) {
    const r = rawRecords[i];
    const tagsStr = r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';

    sections.push(
      `#### ${i + 1}. [${r.id}] ${r.title}\n` +
      `- **Language:** \`${r.language}\` | **Category:** \`${r.category}\` | **Difficulty:** \`${r.difficulty}\`${tagsStr}\n` +
      `- **Symptoms:** ${r.symptoms}\n` +
      `- **Diagnosis:** ${r.diagnosis}\n` +
      `- **Why It Works:** ${r.whyItWorks}`
    );

    if (includeSteps && r.debuggingSteps.length > 0) {
      const steps = r.debuggingSteps.map((step, idx) => `  ${idx + 1}. ${step}`).join('\n');
      sections.push(`- **Recommended Steps:**\n${steps}`);
    }

    if (includeExamples && r.badExample && r.fixedExample) {
      sections.push(
        `- **Erroneous Code:**\n\`\`\`${r.language}\n${r.badExample}\n\`\`\`\n` +
        `- **Corrected Code:**\n\`\`\`${r.language}\n${r.fixedExample}\n\`\`\``
      );
    }

    sections.push(''); // blank line separator
  }

  return sections.join('\n').trim();
}
