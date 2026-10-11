/**
 * BugBuddy Knowledge Base — Offline Mock AI Provider
 * 
 * Provides deterministic, offline responses and controllable error simulations
 * for automated unit, integration, and performance testing.
 */

import {
  AIProvider,
  AIProviderId,
  AIModelConfig,
  AIDiagnosisRequest,
  AIDiagnosisResponse,
  AIProviderError,
} from '../types';

export interface MockProviderOptions {
  simulatedLatencyMs?: number;
  simulatedError?: 'TIMEOUT' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'INVALID_OUTPUT' | 'UNAVAILABLE';
  customResponse?: Partial<AIDiagnosisResponse>;
  failUntilAttempt?: number;
}

export class MockAIProvider implements AIProvider {
  public readonly providerId: AIProviderId = 'mock';
  public readonly displayName: string = 'Offline Mock Provider (Deterministic)';
  public readonly defaultModelId: string = 'mock-bytebuddy-v1';

  private options: MockProviderOptions;
  public callCount: number = 0;

  constructor(options: MockProviderOptions = {}) {
    this.options = options;
  }

  public setOptions(options: MockProviderOptions): void {
    this.options = { ...this.options, ...options };
  }

  public async isAvailable(): Promise<boolean> {
    if (this.options.simulatedError === 'UNAVAILABLE' || this.options.simulatedError === 'AUTH_ERROR') {
      return false;
    }
    return true;
  }

  public async generateStructuredDiagnosis(
    request: AIDiagnosisRequest,
    config: Partial<AIModelConfig> = {}
  ): Promise<AIDiagnosisResponse> {
    this.callCount++;
    const startTime = performance.now();

    const latency = this.options.simulatedLatencyMs ?? 10;
    if (latency > 0) {
      await new Promise((r) => setTimeout(r, latency));
    }

    // Check if failure condition is met
    if (this.options.simulatedError) {
      const shouldFail = !this.options.failUntilAttempt || this.callCount < this.options.failUntilAttempt;
      if (shouldFail) {
        switch (this.options.simulatedError) {
          case 'TIMEOUT':
            throw new AIProviderError('Mock request timed out after abort limit.', 'TIMEOUT', this.providerId, 408, true);
          case 'RATE_LIMITED':
            throw new AIProviderError('Mock provider rate limit exceeded (HTTP 429).', 'RATE_LIMITED', this.providerId, 429, true);
          case 'AUTH_ERROR':
            throw new AIProviderError('Invalid or missing mock API credentials.', 'AUTH_ERROR', this.providerId, 401, false);
          case 'INVALID_OUTPUT':
            throw new AIProviderError('Mock returned malformed non-JSON payload.', 'INVALID_OUTPUT', this.providerId, 502, false);
          case 'UNAVAILABLE':
            throw new AIProviderError('Mock provider is marked unavailable.', 'UNAVAILABLE', this.providerId, 503, true);
        }
      }
    }

    const { userSubmission, retrievedEvidence } = request;
    const hasEvidence = retrievedEvidence.length > 0;
    const primaryEvidence = hasEvidence ? retrievedEvidence[0] : null;

    const citedRecordIds = primaryEvidence ? [primaryEvidence.recordId] : [];
    const citedSources = primaryEvidence
      ? primaryEvidence.sources.map((s) => ({
          title: s.title,
          url: s.url,
          recordId: primaryEvidence.recordId,
          recordTitle: primaryEvidence.title,
          language: primaryEvidence.language,
          category: primaryEvidence.category,
          isPrimary: true,
        }))
      : [];

    const defaultResponse: AIDiagnosisResponse = {
      summary: primaryEvidence
        ? `Diagnosed ${userSubmission.language} issue matching ${primaryEvidence.title}.`
        : `General analysis for ${userSubmission.language} snippet (No exact knowledge base entry found).`,
      probableRootCause: primaryEvidence
        ? primaryEvidence.diagnosis
        : 'Potential logical error or unexpected language runtime behavior.',
      codeExplanation: primaryEvidence
        ? `The provided code exhibits symptoms of ${primaryEvidence.symptoms.toLowerCase()}.`
        : 'The submitted code was analyzed against general debugging heuristics.',
      suggestedFix: {
        explanation: primaryEvidence ? primaryEvidence.whyItWorks : 'Adjust the syntax or logic according to best practices.',
        buggyExample: primaryEvidence ? primaryEvidence.suggestedFix.buggyExample : userSubmission.code,
        fixedExample: primaryEvidence ? primaryEvidence.suggestedFix.fixedExample : userSubmission.code,
        minimalDiff: primaryEvidence
          ? `--- a/snippet\n+++ b/snippet\n- ${primaryEvidence.suggestedFix.buggyExample.slice(0, 40)}\n+ ${primaryEvidence.suggestedFix.fixedExample.slice(0, 40)}`
          : undefined,
      },
      whyItWorks: primaryEvidence ? primaryEvidence.whyItWorks : 'Ensures standard language compliance and safety.',
      verificationTests: primaryEvidence && primaryEvidence.debuggingSteps.length > 0
        ? primaryEvidence.debuggingSteps.slice(0, 2)
        : ['Verify output matches expected specification.'],
      citedRecordIds,
      citedSources,
      limitations: hasEvidence
        ? ['Curated reference patterns do not guarantee compilation in non-standard runtimes.']
        : ['No direct Knowledge Base entry matched; guidance is based on general heuristics.'],
      roast: primaryEvidence
        ? `ByteBuddy sighs: another classic ${primaryEvidence.title} in ${userSubmission.language}. Did you code this during a creeper explosion?`
        : `ByteBuddy squints: your code is so unique even our 60-record database has never seen it before!`,
      isGrounded: hasEvidence,
      providerId: this.providerId,
      modelId: config.modelId || this.defaultModelId,
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      usedFallback: false,
    };

    return {
      ...defaultResponse,
      ...(this.options.customResponse || {}),
    };
  }
}
