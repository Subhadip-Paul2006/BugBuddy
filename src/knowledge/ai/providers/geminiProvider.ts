/**
 * BugBuddy Knowledge Base — Google Gemini & Gemma AI Provider Adapter
 * 
 * Supports Gemini 1.5 Flash, Gemini 2.0 Flash, Gemma 2 9B/27B via
 * Google Generative Language REST API with structured JSON output enforcement.
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

export interface GeminiProviderConfig {
  apiKey?: string;
  defaultModelId?: string;
  baseUrl?: string;
}

export class GeminiProvider implements AIProvider {
  public readonly providerId: AIProviderId = 'gemini';
  public readonly displayName: string = 'Google Gemini / Gemma Provider';
  public readonly defaultModelId: string;

  private apiKey?: string;
  private baseUrl: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    this.defaultModelId = config.defaultModelId || 'gemini-2.5-flash';
    this.baseUrl = config.baseUrl || (typeof process !== 'undefined' ? process.env?.GEMINI_BASE_URL : undefined) || 'https://generativelanguage.googleapis.com/v1beta';
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
        'Gemini API key is not configured. Set GEMINI_API_KEY in server environment.',
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

    const endpoint = `${this.baseUrl}/models/${modelId}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature,
        maxOutputTokens: maxTokens,
      },
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
            throw new AIProviderError('Authentication failure with Gemini API.', 'AUTH_ERROR', this.providerId, status, false);
          }
          if (status === 429) {
            const isRetryable = attempt < maxRetries;
            throw new AIProviderError('Rate limit exceeded for Gemini API.', 'RATE_LIMITED', this.providerId, 429, isRetryable);
          }
          if (status >= 500) {
            const isRetryable = attempt < maxRetries;
            throw new AIProviderError(`Gemini server error (${status}): ${errorText}`, 'UNAVAILABLE', this.providerId, status, isRetryable);
          }
          throw new AIProviderError(`Gemini request failed (${status}): ${errorText}`, 'BAD_REQUEST', this.providerId, status, false);
        }

        const data: any = await response.json();
        const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawContent) {
          throw new AIProviderError('Gemini returned an empty candidate completion.', 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch (jsonErr: any) {
          throw new AIProviderError(`Failed to parse structured JSON from Gemini output: ${jsonErr?.message}`, 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        // Validate essential fields
        if (!parsed.summary || !parsed.probableRootCause || !parsed.suggestedFix) {
          throw new AIProviderError('Gemini JSON output missing required diagnosis fields.', 'INVALID_OUTPUT', this.providerId, 502, false);
        }

        // Filter cited record IDs against actual retrieved evidence
        const validEvidenceIds = new Set(request.retrievedEvidence.map((e) => e.recordId));
        const citedRecordIds: string[] = Array.isArray(parsed.citedRecordIds)
          ? parsed.citedRecordIds.filter((id: string) => validEvidenceIds.has(id))
          : [];

        // Synthesize trusted source citations from verified evidence
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
          roast: parsed.roast || 'ByteBuddy nods thoughtfully: that code was an adventure.',
          isGrounded: Boolean(parsed.isGrounded && citedRecordIds.length > 0),
          providerId: this.providerId,
          modelId,
          executionTimeMs,
          usedFallback: false,
        };
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'AbortError') {
          lastError = new AIProviderError(`Gemini request timed out after ${timeoutMs}ms limit.`, 'TIMEOUT', this.providerId, 408, attempt < maxRetries);
        } else if (!(err instanceof AIProviderError)) {
          lastError = new AIProviderError(`Network error communicating with Gemini: ${err?.message || err}`, 'NETWORK_ERROR', this.providerId, 0, attempt < maxRetries);
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
