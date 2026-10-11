/**
 * BugBuddy Knowledge Base — AI Debugging Orchestrator
 * 
 * Orchestrates grounded AI diagnosis:
 * 1. Validates user submission and enforces payload size limits.
 * 2. Invokes the retrieval engine (Hybrid RRF / BM25 / Semantic).
 * 3. Formulates evidence context and queries the active AI provider.
 * 4. Validates structured output, enforces anti-fabrication citation boundaries.
 * 5. Safely falls back to Stage 4 deterministic response engine if AI provider fails.
 */

import { CanonicalLanguage } from '../types';
import { KnowledgeSearchIndex } from '../search';
import { HybridSearchEngine, HybridRetrievalMode } from '../hybridSearch';
import { buildDiagnosisResponse, DiagnosisResponse } from '../response';
import {
  AIProvider,
  AIProviderId,
  AIModelConfig,
  UserSubmissionContext,
  RetrievedKnowledgeEvidence,
  AIDiagnosisRequest,
  AIDiagnosisResponse,
} from './types';
import { AIProviderRegistry, defaultAIProviderRegistry } from './registry';

export interface OrchestratorOptions {
  providerId?: AIProviderId;
  modelConfig?: Partial<AIModelConfig>;
  retrievalMode?: HybridRetrievalMode;
  topEvidenceLimit?: number;
  tone?: 'mild' | 'spicy' | 'savage';
  maxCodeLengthBytes?: number;
}

export class AIDebugOrchestrator {
  private readonly searchEngine: KnowledgeSearchIndex | HybridSearchEngine;
  private readonly registry: AIProviderRegistry;

  constructor(
    searchEngine: KnowledgeSearchIndex | HybridSearchEngine,
    registry: AIProviderRegistry = defaultAIProviderRegistry
  ) {
    this.searchEngine = searchEngine;
    this.registry = registry;
  }

  /**
   * Orchestrates the complete grounded diagnosis workflow.
   */
  public async diagnose(
    submission: UserSubmissionContext,
    options: OrchestratorOptions = {}
  ): Promise<AIDiagnosisResponse> {
    const startTime = performance.now();

    // 1. Validate payload size and inputs
    const maxCodeBytes = options.maxCodeLengthBytes ?? 32768; // 32KB limit
    if (!submission.code || submission.code.trim().length === 0) {
      throw new Error('Code submission cannot be empty.');
    }
    if (Buffer.byteLength(submission.code, 'utf8') > maxCodeBytes) {
      throw new Error(`Code submission exceeds maximum permitted size of ${maxCodeBytes} bytes.`);
    }

    // 2. Perform Knowledge Retrieval
    const evidenceLimit = options.topEvidenceLimit ?? 3;
    const retrievalMode = options.retrievalMode ?? 'HYBRID_WITH_FALLBACK';

    const searchQuery = [
      submission.code.slice(0, 300),
      submission.errorMessage || '',
      submission.question || '',
    ]
      .filter(Boolean)
      .join(' ');

    let rawSearchResults: any;
    let evidenceItems: RetrievedKnowledgeEvidence[] = [];

    if ('getBM25Index' in this.searchEngine) {
      // HybridSearchEngine
      const hybridEngine = this.searchEngine as HybridSearchEngine;
      rawSearchResults = await hybridEngine.search(searchQuery, {
        limit: evidenceLimit,
        filter: { language: submission.language },
        retrievalMode,
      });

      evidenceItems = rawSearchResults.results.map((r: any) => ({
        recordId: r.record.id,
        title: r.record.title,
        language: r.record.language,
        category: r.record.category,
        difficulty: r.record.difficulty,
        symptoms: r.record.symptoms,
        diagnosis: r.record.diagnosis,
        whyItWorks: r.record.whyItWorks || '',
        debuggingSteps: r.record.debuggingSteps || [],
        suggestedFix: {
          buggyExample: r.record.suggestedFix?.buggyExample || r.record.badExample || '',
          fixedExample: r.record.suggestedFix?.fixedExample || r.record.fixedExample || '',
          explanation: r.record.suggestedFix?.explanation || r.record.whyItWorks || '',
        },
        sources: r.record.sources || [],
        relevanceScore: r.score,
        retrievalMode: r.effectiveRetrievalMode,
      }));
    } else {
      // KnowledgeSearchIndex
      const bm25 = this.searchEngine as KnowledgeSearchIndex;
      rawSearchResults = bm25.search(searchQuery, {
        limit: evidenceLimit,
        filter: { language: submission.language },
      });

      evidenceItems = rawSearchResults.results.map((r: any) => ({
        recordId: r.record.id,
        title: r.record.title,
        language: r.record.language,
        category: r.record.category,
        difficulty: r.record.difficulty,
        symptoms: r.record.symptoms,
        diagnosis: r.record.diagnosis,
        whyItWorks: r.record.whyItWorks || '',
        debuggingSteps: r.record.debuggingSteps || [],
        suggestedFix: {
          buggyExample: r.record.suggestedFix?.buggyExample || r.record.badExample || '',
          fixedExample: r.record.suggestedFix?.fixedExample || r.record.fixedExample || '',
          explanation: r.record.suggestedFix?.explanation || r.record.whyItWorks || '',
        },
        sources: r.record.sources || [],
        relevanceScore: r.score,
        retrievalMode: 'BM25' as const,
      }));
    }

    // 3. Resolve AI Provider
    let provider: AIProvider | undefined;
    try {
      provider = await this.registry.getActiveProvider(options.providerId);
    } catch {
      provider = undefined;
    }

    // 4. Execute AI Generation with Fallback
    const request: AIDiagnosisRequest = {
      userSubmission: submission,
      retrievedEvidence: evidenceItems,
      tone: options.tone || 'spicy',
    };

    if (provider && provider.providerId !== 'deterministic-fallback') {
      try {
        const aiResponse = await provider.generateStructuredDiagnosis(request, options.modelConfig);

        // Verification & Citation Integrity: Ensure citedRecordIds only cite verified retrieved evidence
        const validIds = new Set(evidenceItems.map((e) => e.recordId));
        const verifiedRecordIds = aiResponse.citedRecordIds.filter((id) => validIds.has(id));

        // Reconstruct authentic sources matching only verified cited record IDs
        const verifiedSources = evidenceItems
          .filter((e) => verifiedRecordIds.includes(e.recordId))
          .flatMap((e) =>
            e.sources.map((s) => ({
              title: s.title,
              url: s.url,
              recordId: e.recordId,
              recordTitle: e.title,
              language: e.language,
              category: e.category,
              isPrimary: true,
            }))
          );

        return {
          ...aiResponse,
          citedRecordIds: verifiedRecordIds,
          citedSources: verifiedSources,
          isGrounded: verifiedRecordIds.length > 0,
          usedFallback: false,
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        };
      } catch (err: any) {
        // AI Provider failed (timeout, rate-limit, auth error, invalid JSON); trigger deterministic fallback
        return this.createDeterministicFallbackResponse(
          submission,
          rawSearchResults,
          evidenceItems,
          err?.message || 'AI provider unavailable',
          startTime
        );
      }
    }

    // If no AI provider configured or available, run deterministic response engine
    return this.createDeterministicFallbackResponse(
      submission,
      rawSearchResults,
      evidenceItems,
      'No cloud AI provider configured; served by Stage 4 offline diagnostic engine.',
      startTime
    );
  }

  /**
   * Creates a grounded response using the Stage 4 deterministic response engine.
   */
  private createDeterministicFallbackResponse(
    submission: UserSubmissionContext,
    rawSearchResults: any,
    evidenceItems: RetrievedKnowledgeEvidence[],
    fallbackReason: string,
    startTime: number
  ): AIDiagnosisResponse {
    const stage4Response: DiagnosisResponse = buildDiagnosisResponse(rawSearchResults, {
      userContext: {
        language: submission.language,
        code: submission.code,
        errorMessage: submission.errorMessage,
        expectedBehavior: submission.expectedBehavior,
        actualBehavior: submission.actualBehavior,
      },
      requireStrictLanguageMatch: true,
      minRelevanceScore: 'getBM25Index' in this.searchEngine ? 0.001 : 0.5,
    });

    const primaryEvidence = evidenceItems[0] || null;
    const isNoMatch = stage4Response.responseMode === 'NO_MATCH';

    return {
      summary: stage4Response.summary,
      probableRootCause: stage4Response.rootCause || stage4Response.summary,
      codeExplanation: stage4Response.symptoms || 'Diagnosed using offline curated pattern matching.',
      suggestedFix: {
        explanation: stage4Response.suggestedFix?.explanation || 'No curated fix pattern available.',
        buggyExample: stage4Response.suggestedFix?.buggyExample || submission.code,
        fixedExample: stage4Response.suggestedFix?.fixedExample || submission.code,
        minimalDiff: undefined,
      },
      whyItWorks: stage4Response.whyItWorks,
      verificationTests: stage4Response.verificationTests ? [stage4Response.verificationTests] : [],
      citedRecordIds: stage4Response.matchedKnowledgeIds,
      citedSources: stage4Response.attributedSources,
      limitations: [
        ...stage4Response.limitations,
        `Deterministic Fallback Active: ${fallbackReason}`,
      ],
      roast: stage4Response.roast,
      isGrounded: !isNoMatch && stage4Response.matchedKnowledgeIds.length > 0,
      providerId: 'deterministic-fallback',
      modelId: 'bugbuddy-stage4-engine',
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      usedFallback: true,
      fallbackDiagnosis: stage4Response,
    };
  }
}
