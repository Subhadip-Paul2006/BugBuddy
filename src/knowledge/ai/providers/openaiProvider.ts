/**
 * BugBuddy Knowledge Base — OpenAI Provider Adapter
 * 
 * Supports GPT-4o-mini, GPT-4o, and compatible endpoints using
 * standard OpenAI Chat Completions API with structured JSON output enforcement.
 */

import {
  AIProvider,
  AIProviderId,
  AIModelConfig,
  AIDiagnosisRequest,
  AIDiagnosisResponse,
  AIProviderError,
} from '../types';
import { buildGroundedPrompt } from '../prompt';

export interface OpenAIProviderConfig {
  apiKey?: string;
  defaultModelId?: string;
  baseUrl?: string;
}

export class OpenAIProvider implements AIProvider {
  public readonly providerId: AIProviderId = 'openai';
  public readonly displayName: string = 'OpenAI Provider';
  public readonly defaultModelId: string;

  private apiKey?: string;
  private baseUrl: string;

  constructor(config: OpenAIProviderConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined);
    this.defaultModelId = config.defaultModelId || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || (typeof process !== 'undefined' ? (process.env?.OPENAI_BASE_URL || process.env?.OPENAI_API_BASE) : undefined) || 'https://api.openai.com/v1';
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateStructuredDiagnosis(
    request: AIDiagnosisRequest,
    config: Partial<AIModelConfig> = {}
  ): Promise<AIDiagnosisResponse> {
    if (!this.apiKey) {
      throw new AIProviderError(
        'OpenAI API key is not configured. Set OPENAI_API_KEY in server environment.',
        'AUTH_ERROR',
        this.providerId,
        401,
        false
      );
    }

    const modelId = config.modelId || this.defaultModelId;
    const timeoutMs = config.timeoutMs ?? 15000;
    const maxRetries = config.maxRetries ?? 2;
    const temperature = config.temperature ?? 0.2;
    const maxTokens = config.maxTokens ?? 2048;

    const { systemPrompt, userPrompt } = buildGroundedPrompt(request);

    const endpoint = `${this.baseUrl}/chat/completions`;
    const payload = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    };

    let attempt = 0;
    let lastError: any = null;
    const startTime = performance.now();

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey.trim()}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);

        if (!response.ok) {
          const status = response.status;
          let errorText = '';
          try {
            const errJson = await response.json();
            errorText = errJson?.error?.message || response.statusText;
          } catch {
            errorText = response.statusText;
          }

          if (status === 401 || status === 403) {
            throw new AIProviderError('Authentication failure with OpenAI API.', 'AUTH_ERROR', this.providerId, status, false);
          }
          if (status === 429) {
            const isRetryable = attempt < maxRetries;
            throw new AIProviderError('Rate limit exceeded for OpenAI API.', 'RATE_LIMITED', this.providerId, 429, isRetryable);
          }
          if (status >= 500) {
            const isRetryable = attempt < maxRetries;
            throw new AIProviderError(`OpenAI server error (${status}): ${errorText}`, 'UNAVAILABLE', this.providerId, status, isRetryable);
          }
          throw new AIProviderError(`OpenAI request failed (${status}): ${errorText}`, 'BAD_REQUEST', this.providerId, status, false);
        }

        const data: any = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;

        if (!rawContent) {
          throw new AIProviderError('OpenAI returned an empty choice completion.', 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch (jsonErr: any) {
          throw new AIProviderError(`Failed to parse structured JSON from OpenAI output: ${jsonErr?.message}`, 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        // Validate essential fields
        if (!parsed.summary || !parsed.probableRootCause || !parsed.suggestedFix) {
          throw new AIProviderError('OpenAI JSON output missing required diagnosis fields.', 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        // Enforce anti-fabrication citation boundaries
        const validEvidenceIds = new Set(request.retrievedEvidence.map((e) => e.recordId));
        const citedRecordIds: string[] = Array.isArray(parsed.citedRecordIds)
          ? parsed.citedRecordIds.filter((id: string) => validEvidenceIds.has(id))
          : [];

        // Synthesize authentic source citations
        const citedSources = request.retrievedEvidence
          .filter((e) => citedRecordIds.includes(e.recordId))
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

        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

        return {
          summary: parsed.summary,
          probableRootCause: parsed.probableRootCause,
          codeExplanation: parsed.codeExplanation || parsed.probableRootCause,
          suggestedFix: {
            explanation: parsed.suggestedFix?.explanation || 'Apply corrected pattern.',
            buggyExample: parsed.suggestedFix?.buggyExample || request.userSubmission.code,
            fixedExample: parsed.suggestedFix?.fixedExample || request.userSubmission.code,
            minimalDiff: parsed.suggestedFix?.minimalDiff,
          },
          whyItWorks: parsed.whyItWorks || 'Eliminates improper runtime state.',
          verificationTests: Array.isArray(parsed.verificationTests) ? parsed.verificationTests : [],
          citedRecordIds,
          citedSources,
          limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
          roast: parsed.roast || 'ByteBuddy grins: fixed it before the compile error could spread.',
          isGrounded: Boolean(parsed.isGrounded && citedRecordIds.length > 0),
          providerId: this.providerId,
          modelId,
          executionTimeMs,
          usedFallback: false,
        };
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'AbortError') {
          lastError = new AIProviderError(`OpenAI request timed out after ${timeoutMs}ms limit.`, 'TIMEOUT', this.providerId, 408, attempt < maxRetries);
        } else if (!(err instanceof AIProviderError)) {
          lastError = new AIProviderError(`Network error communicating with OpenAI: ${err?.message || err}`, 'NETWORK_ERROR', this.providerId, 0, attempt < maxRetries);
        }

        if (lastError instanceof AIProviderError && lastError.isRetryable && attempt < maxRetries) {
          attempt++;
          const backoffDelay = 500 * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, backoffDelay));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError;
  }
}
