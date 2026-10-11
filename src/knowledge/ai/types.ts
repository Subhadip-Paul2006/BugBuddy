/**
 * BugBuddy Knowledge Base — Stage 7: AI Provider Abstraction Types
 * 
 * Defines typed interfaces for AI providers, request/response structures,
 * model configurations, grounding evidence, and error classifications.
 */

import { CanonicalLanguage, CanonicalCategory, CanonicalDifficulty } from '../types';
import { AttributedSource, DiagnosisResponse } from '../response';

export type AIProviderId = 'gemini' | 'openai' | 'mock' | 'deterministic-fallback';

export interface AIModelConfig {
  /** Identifier of the model (e.g., 'gpt-4o-mini', 'gemini-1.5-flash', 'gemma-2-9b-it') */
  modelId: string;
  /** Sampling temperature (default: 0.2 for deterministic debugging) */
  temperature?: number;
  /** Maximum generation tokens */
  maxTokens?: number;
  /** Request timeout in milliseconds (default: 15,000ms) */
  timeoutMs?: number;
  /** Maximum number of transient error retries (default: 2) */
  maxRetries?: number;
}

export interface UserSubmissionContext {
  language: CanonicalLanguage;
  code: string;
  errorMessage?: string;
  question?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface RetrievedKnowledgeEvidence {
  recordId: string;
  title: string;
  language: CanonicalLanguage;
  category: CanonicalCategory;
  difficulty?: CanonicalDifficulty;
  symptoms: string;
  diagnosis: string;
  whyItWorks: string;
  debuggingSteps: string[];
  suggestedFix: {
    buggyExample: string;
    fixedExample: string;
    explanation: string;
  };
  sources: Array<{ title: string; url: string }>;
  relevanceScore: number;
  retrievalMode: 'BM25' | 'SEMANTIC' | 'HYBRID_RRF';
}

export interface AIDiagnosisRequest {
  userSubmission: UserSubmissionContext;
  retrievedEvidence: RetrievedKnowledgeEvidence[];
  systemInstructions?: string;
  tone?: 'mild' | 'spicy' | 'savage';
}

export interface AIDiagnosisResponse {
  /** Concise problem summary */
  summary: string;
  /** Probable root cause derived from code analysis and evidence */
  probableRootCause: string;
  /** In-depth explanation of the buggy code behavior */
  codeExplanation: string;
  /** Suggested code fix with explanation and diff */
  suggestedFix: {
    explanation: string;
    buggyExample: string;
    fixedExample: string;
    minimalDiff?: string;
  };
  /** Explanation of why the fix resolves the root cause */
  whyItWorks: string;
  /** Verification tests or commands to confirm resolution */
  verificationTests: string[];
  /** Knowledge Base record IDs that directly grounded this response */
  citedRecordIds: string[];
  /** Exact source citations matching the retrieved records */
  citedSources: AttributedSource[];
  /** Explicit limitations and uncertainties */
  limitations: string[];
  /** Satirical roast matching BugBuddy's ByteBuddy persona */
  roast: string;
  /** Whether the response was fully grounded in retrieved evidence */
  isGrounded: boolean;
  /** AI provider identifier that served the response */
  providerId: AIProviderId;
  /** Specific model identifier utilized */
  modelId: string;
  /** Execution latency in milliseconds */
  executionTimeMs: number;
  /** Whether a fallback to offline deterministic engine occurred */
  usedFallback: boolean;
  /** Optional fallback diagnosis response when AI was unavailable */
  fallbackDiagnosis?: DiagnosisResponse;
}

export type AIErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'INVALID_OUTPUT'
  | 'UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class AIProviderError extends Error {
  public readonly code: AIErrorCode;
  public readonly providerId: AIProviderId;
  public readonly status?: number;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: AIErrorCode,
    providerId: AIProviderId,
    status?: number,
    isRetryable: boolean = false
  ) {
    // Sanitize any potential API keys from the error message before super call
    const sanitized = sanitizeErrorMessage(message);
    super(sanitized);
    this.name = 'AIProviderError';
    this.code = code;
    this.providerId = providerId;
    this.status = status;
    this.isRetryable = isRetryable;
  }
}

/**
 * Sanitizes any raw key tokens, authorization headers, or secrets from error strings.
 */
export function sanitizeErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'Unknown AI provider error.';
  return rawMessage
    .replace(/(Bearer\s+[a-zA-Z0-9._-]+)/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(key=[a-zA-Z0-9._-]+)/gi, 'key=[REDACTED_KEY]')
    .replace(/(sk-[a-zA-Z0-9_-]{10,})/g, '[REDACTED_API_KEY]')
    .replace(/(AIza[a-zA-Z0-9_-]{10,})/g, '[REDACTED_API_KEY]');
}

/**
 * Common AI Provider Interface.
 */
export interface AIProvider {
  readonly providerId: AIProviderId;
  readonly displayName: string;
  readonly defaultModelId: string;

  /** Checks whether the provider has valid configuration/credentials available */
  isAvailable(): Promise<boolean>;

  /** Generates structured diagnosis from request context */
  generateStructuredDiagnosis(
    request: AIDiagnosisRequest,
    config?: Partial<AIModelConfig>
  ): Promise<AIDiagnosisResponse>;
}
