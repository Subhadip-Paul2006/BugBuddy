/**
 * BugBuddy Knowledge Base — Stage 4: Structured Debugging Response Engine
 * 
 * Converts retrieved knowledge records into technically grounded, structured,
 * and deterministic debugging responses.
 * 
 * CORE PRINCIPLES:
 * 1. Strict Grounding: Every recommendation and source URL is anchored in actual retrieved records.
 * 2. Honest Attribution: Never claims user code was compiled or executed in this engine.
 * 3. Safe Multi-Match Handling: Prevents merging incompatible languages or conflicting fixes.
 * 4. Transparent No-Match: Returns explicit no-match output instead of fabricating diagnoses.
 * 5. Input Immutability: Pure functions with zero mutation of source records.
 */

import type {
  CanonicalLanguage,
  CanonicalCategory,
  CanonicalDifficulty,
  KnowledgeSource,
  NormalizedKnowledgeRecord,
} from './types';
import type {
  SearchResultItem,
  SearchResults,
  KnowledgeSearchIndex,
  SearchOptions,
} from './search';
import { normalizeLanguage } from './normalizer';

/**
 * Diagnostic mode indicating the relationship between retrieval evidence and the response.
 */
export type ResponseMode =
  | 'DIRECT_MATCH'        // Strong, singular match directly answering the query
  | 'RELATED_GUIDANCE'    // Curated entry provides relevant architectural or pattern guidance
  | 'AMBIGUOUS_EVIDENCE'  // Multiple distinct failure patterns with similar score; limitations noted
  | 'NO_MATCH';           // Insufficient relevance score or empty search results

/**
 * Structured fix recommendation with before-and-after code and technical rationale.
 */
export interface SuggestedFix {
  buggyExample: string;
  fixedExample: string;
  explanation: string;
  isDirectFix: boolean;
  relatedPatternNote?: string;
}

/**
 * Caller-supplied context for future user-code analysis.
 */
export interface UserCodeContext {
  language?: CanonicalLanguage;
  code?: string;
  errorMessage?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

/**
 * Options configuring response composition.
 */
export interface DiagnosisResponseOptions {
  userContext?: UserCodeContext;
  minRelevanceScore?: number;
  maxRelatedEntries?: number;
  requireStrictLanguageMatch?: boolean;
}

/**
 * Attributed source citation anchored directly to an originating knowledge entry.
 */
export interface AttributedSource extends KnowledgeSource {
  recordId: string;
  recordTitle: string;
  language: CanonicalLanguage;
  category: CanonicalCategory;
  isPrimary: boolean;
}

/**
 * Canonical Structured Debugging Response.
 */
export interface DiagnosisResponse {
  title: string;
  language: CanonicalLanguage | 'unknown';
  category: CanonicalCategory | 'unsupported_error' | 'general';
  difficulty?: CanonicalDifficulty;
  roast: string;
  summary: string;
  rootCause: string;
  symptoms: string;
  debuggingSteps: string[];
  suggestedFix: SuggestedFix | null;
  whyItWorks: string;
  verificationTests: string;
  sources: KnowledgeSource[];
  attributedSources: AttributedSource[];
  hasSources: boolean;
  matchedKnowledgeIds: string[];
  responseMode: ResponseMode;
  limitations: string[];
  timestamp: string;
}

/**
 * Default threshold below which keyword scores are considered insufficient evidence.
 */
export const DEFAULT_MIN_RELEVANCE_SCORE = 0.5;

/**
 * Standard limitations disclaimer attached to responses.
 */
const BASE_LIMITATIONS = [
  'Response constructed deterministically from BugBuddy curated knowledge records.',
  'Retrieved via keyword-weighted BM25 matching; source code was not compiled or executed.',
  'Curated code fixes demonstrate the verified pattern; verify adaptability before applying to production.',
];

/**
 * Normalizes diverse input formats (SearchResults, SearchResultItem[], or NormalizedKnowledgeRecord[])
 * into a standardized list of SearchResultItem.
 */
function normalizeToResultItems(
  input: SearchResults | SearchResultItem[] | NormalizedKnowledgeRecord[]
): SearchResultItem[] {
  if (!input) return [];

  if ('results' in input && Array.isArray((input as SearchResults).results)) {
    return (input as SearchResults).results;
  }

  if (Array.isArray(input)) {
    if (input.length === 0) return [];

    // Check if elements are already SearchResultItem
    const first = input[0];
    if ('record' in first && 'score' in first) {
      return input as SearchResultItem[];
    }

    // Elements are NormalizedKnowledgeRecord
    return (input as NormalizedKnowledgeRecord[]).map((rec, index) => ({
      record: rec,
      score: 10.0 - index * 0.1, // Synthetic decreasing score
      matchedTerms: [],
    }));
  }

  return [];
}

/**
 * Produces an honest NO_MATCH response when retrieval yields no adequate evidence.
 */
function createNoMatchResponse(
  userContext?: UserCodeContext,
  reason = 'The curated knowledge base found no verified records meeting the relevance threshold for this query.'
): DiagnosisResponse {
  const language = userContext?.language || 'unknown';

  return {
    title: 'No Matching Bug Pattern in Knowledge Codex',
    language,
    category: 'unsupported_error',
    roast: "Even our bug-hunting radar came up blank. Either your code is an eldritch mystery, or the query needs sharper keywords.",
    summary: reason,
    rootCause: 'No diagnostic entry in the 60-record corpus met the relevance threshold.',
    symptoms: userContext?.errorMessage || 'Query did not match known symptoms in the knowledge base.',
    debuggingSteps: [
      '1. Verify the selected programming language matches your source code.',
      '2. Include specific compiler errors, exception class names, or panic traces in your query.',
      '3. Isolate the bug into a minimal reproducible code snippet.',
      '4. Consult language-specific documentation or compiler specifications directly.',
    ],
    suggestedFix: null,
    whyItWorks: '',
    verificationTests: '',
    sources: [],
    attributedSources: [],
    hasSources: false,
    matchedKnowledgeIds: [],
    responseMode: 'NO_MATCH',
    limitations: [
      'No relevant records matched in the curated corpus.',
      'BugBuddy did not fabricate any diagnoses, fixes, or documentation citations.',
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds a deterministic, structured debugging response from search results.
 * 
 * @param searchInput SearchResults object, SearchResultItem array, or NormalizedKnowledgeRecord array.
 * @param options Configuration options including userContext, minRelevanceScore, and language constraints.
 * @returns A fully typed DiagnosisResponse.
 */
export function buildDiagnosisResponse(
  searchInput: SearchResults | SearchResultItem[] | NormalizedKnowledgeRecord[],
  options: DiagnosisResponseOptions = {}
): DiagnosisResponse {
  const {
    userContext,
    maxRelatedEntries = 2,
    requireStrictLanguageMatch = true,
  } = options;

  const rawItems = normalizeToResultItems(searchInput);

  // Auto-adapt minimum threshold for RRF scores (scaled ~0.016) when not explicitly overridden
  const isRRF = rawItems.some(
    (item) => (item as any).effectiveRetrievalMode === 'HYBRID_RRF'
  );
  const effectiveMinScore =
    options.minRelevanceScore !== undefined
      ? options.minRelevanceScore
      : isRRF
      ? 0.001
      : DEFAULT_MIN_RELEVANCE_SCORE;

  // 1. Filter out items below the relevance threshold
  let eligibleItems = rawItems.filter((item) => item.score >= effectiveMinScore);

  // 2. Filter by user-specified language if strict matching is required
  const targetLanguage = userContext?.language
    ? normalizeLanguage(userContext.language) ?? userContext.language
    : undefined;

  if (requireStrictLanguageMatch && targetLanguage) {
    eligibleItems = eligibleItems.filter(
      (item) => item.record.language === targetLanguage
    );
  }

  // 3. Handle empty / insufficient evidence
  if (eligibleItems.length === 0) {
    if (rawItems.length > 0 && requireStrictLanguageMatch && targetLanguage) {
      return createNoMatchResponse(
        userContext,
        `Retrieved ${rawItems.length} record(s), but none matched the requested language '${targetLanguage}'.`
      );
    }
    return createNoMatchResponse(userContext);
  }

  // 4. Select Primary Top Record
  const primaryItem = eligibleItems[0];
  const primaryRecord = primaryItem.record;

  // 5. Select Secondary Complementary Records (strictly matching primary language)
  const complementaryItems = eligibleItems
    .slice(1, maxRelatedEntries)
    .filter((item) => item.record.language === primaryRecord.language);

  const allSelectedItems = [primaryItem, ...complementaryItems];
  const matchedKnowledgeIds = allSelectedItems.map((item) => item.record.id);

  // 6. Deduplicate and collect sources with full provenance from selected records ONLY
  const sourceMap = new Map<string, KnowledgeSource>();
  const attributedSources: AttributedSource[] = [];
  const seenAttributedUrls = new Set<string>();

  for (const item of allSelectedItems) {
    const isPrimary = item.record.id === primaryRecord.id;
    for (const src of item.record.sources) {
      if (src && src.url) {
        if (!sourceMap.has(src.url)) {
          sourceMap.set(src.url, {
            title: src.title || `${item.record.title} Reference`,
            url: src.url,
          });
        }
        const attributionKey = `${item.record.id}::${src.url}`;
        if (!seenAttributedUrls.has(attributionKey)) {
          seenAttributedUrls.add(attributionKey);
          attributedSources.push({
            title: src.title || `${item.record.title} Reference`,
            url: src.url,
            recordId: item.record.id,
            recordTitle: item.record.title,
            language: item.record.language,
            category: item.record.category,
            isPrimary,
          });
        }
      }
    }
  }
  const sources = Array.from(sourceMap.values());
  const hasSources = sources.length > 0;

  // 7. Determine Response Mode
  let responseMode: ResponseMode = 'DIRECT_MATCH';
  if (eligibleItems.length > 1 && eligibleItems[0].score - eligibleItems[1].score < 0.2) {
    // Top 2 scores are virtually tied with different entries
    if (eligibleItems[0].record.category !== eligibleItems[1].record.category) {
      responseMode = 'AMBIGUOUS_EVIDENCE';
    }
  } else if (userContext?.code && !primaryRecord.searchContent.includes(userContext.code.trim().slice(0, 30))) {
    responseMode = 'RELATED_GUIDANCE';
  }

  // 8. Assemble Debugging Steps
  const debuggingSteps = [...primaryRecord.debuggingSteps];
  if (complementaryItems.length > 0) {
    for (const comp of complementaryItems) {
      for (const step of comp.record.debuggingSteps) {
        if (!debuggingSteps.includes(step)) {
          debuggingSteps.push(`[Related: ${comp.record.id}] ${step}`);
        }
      }
    }
  }

  // 9. Suggested Fix from Primary Record (Never fabricate)
  const isDirect = responseMode === 'DIRECT_MATCH';
  const suggestedFix: SuggestedFix = {
    buggyExample: primaryRecord.badExample,
    fixedExample: primaryRecord.fixedExample,
    explanation: primaryRecord.whyItWorks,
    isDirectFix: isDirect,
    relatedPatternNote: !isDirect
      ? `This pattern is derived from knowledge entry '${primaryRecord.id}' and should be adapted to your codebase.`
      : undefined,
  };

  // 10. Compile Limitations List
  const limitations = [...BASE_LIMITATIONS];
  if (!hasSources) {
    limitations.push(
      'No external documentation citations are available for this curated knowledge entry. Guidance is derived strictly from local verified patterns.'
    );
  } else if (primaryRecord.sources.length === 0 && attributedSources.length > 0) {
    limitations.push(
      'Primary matched entry has no direct source citations; citations listed below originate from related contextual records.'
    );
  }
  if (responseMode === 'AMBIGUOUS_EVIDENCE') {
    limitations.push(
      `Multiple distinct error patterns (${matchedKnowledgeIds.join(', ')}) matched with similar relevance scores. Verify which root cause matches your stack trace.`
    );
  }
  if (responseMode === 'RELATED_GUIDANCE') {
    limitations.push(
      'Demonstrated code examples are canonical reference patterns from the knowledge base, not in-place edits of the submitted code.'
    );
  }

  // 11. Compose Structured Response
  return {
    title: primaryRecord.title,
    language: primaryRecord.language,
    category: primaryRecord.category,
    difficulty: primaryRecord.difficulty,
    roast: primaryRecord.roast,
    summary: `Diagnosed as '${primaryRecord.title}' (${primaryRecord.category}) grounded in knowledge entry ${primaryRecord.id}.`,
    rootCause: primaryRecord.diagnosis,
    symptoms: primaryRecord.symptoms,
    debuggingSteps,
    suggestedFix,
    whyItWorks: primaryRecord.whyItWorks,
    verificationTests: primaryRecord.tests,
    sources,
    attributedSources,
    hasSources,
    matchedKnowledgeIds,
    responseMode,
    limitations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * End-to-end convenience runner: Searches the index and returns a structured diagnosis response.
 */
export function diagnoseProblem(
  index: KnowledgeSearchIndex,
  query: string,
  options: DiagnosisResponseOptions & SearchOptions = {}
): DiagnosisResponse {
  const searchResults = index.search(query, {
    filter: options.filter,
    limit: options.limit || 5,
    minScore: options.minScore,
    weights: options.weights,
    boostExactMatch: options.boostExactMatch,
  });

  return buildDiagnosisResponse(searchResults, options);
}

/**
 * Formats a DiagnosisResponse into human-readable Markdown suitable for CLI output or LLM prompt context.
 */
export function formatDiagnosisResponseMarkdown(response: DiagnosisResponse): string {
  const lines: string[] = [];

  lines.push(`# 🛡️ BugBuddy Diagnosis: ${response.title}`);
  lines.push(`**Language:** \`${response.language}\` | **Category:** \`${response.category}\` | **Mode:** \`${response.responseMode}\``);
  lines.push('');

  lines.push('### 🤖 The Roast');
  lines.push(`> "${response.roast}"`);
  lines.push('');

  lines.push('### 🔍 Root Cause & Symptoms');
  lines.push(`- **Symptoms:** ${response.symptoms}`);
  lines.push(`- **Root Cause:** ${response.rootCause}`);
  lines.push('');

  if (response.suggestedFix) {
    lines.push('### 🛠️ Suggested Fix');
    lines.push(`#### ❌ Problematic Pattern`);
    lines.push('```' + response.language);
    lines.push(response.suggestedFix.buggyExample);
    lines.push('```');
    lines.push(`#### ✅ Corrected Pattern`);
    lines.push('```' + response.language);
    lines.push(response.suggestedFix.fixedExample);
    lines.push('```');
    lines.push(`**Why it works:** ${response.suggestedFix.explanation}`);
    lines.push('');
  }

  if (response.debuggingSteps.length > 0) {
    lines.push('### 📋 Debugging Steps');
    for (const step of response.debuggingSteps) {
      lines.push(`- ${step}`);
    }
    lines.push('');
  }

  if (response.verificationTests) {
    lines.push('### 🧪 Suggested Verification Tests');
    lines.push('*(Recommendation only; code was not compiled or executed)*');
    lines.push('```bash');
    lines.push(response.verificationTests);
    lines.push('```');
    lines.push('');
  }

  if (response.attributedSources && response.attributedSources.length > 0) {
    lines.push('### 🔗 Verified Documentation Sources');
    for (const src of response.attributedSources) {
      const badge = src.isPrimary ? '[Primary]' : `[Related: ${src.recordId}]`;
      lines.push(`- ${badge} [${src.title || src.url}](${src.url}) *(from \`${src.recordId}\`)*`);
    }
    lines.push('');
  } else if (response.sources.length > 0) {
    lines.push('### 🔗 Verified Documentation Sources');
    for (const src of response.sources) {
      lines.push(`- [${src.title || src.url}](${src.url})`);
    }
    lines.push('');
  } else {
    lines.push('### 🔗 Source Attribution');
    lines.push('*(No external source citations available for this entry. Grounded strictly in local curated corpus.)*');
    lines.push('');
  }

  lines.push('### ⚠️ Limitations & Evidence');
  for (const lim of response.limitations) {
    lines.push(`- ${lim}`);
  }

  return lines.join('\n');
}
