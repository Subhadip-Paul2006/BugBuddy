/**
 * BugBuddy Knowledge Base — Stage 8 Operational Reliability & Failure Modes Suite
 *
 * Verifies resilient system behavior under failure conditions:
 * - Empty code inputs and oversized payload limit enforcement (>32KB).
 * - Provider network failures, timeouts, and unauthenticated error handling.
 * - Deterministic fallback activation with honest citation preservation.
 * - Anti-fabrication citation boundaries: rejecting hallucinated record IDs.
 * - Evaluation of held-out benchmark queries and honest no-match behavior.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import {
  ingestKnowledgeDirectory,
  KnowledgeSearchIndex,
  AIDebugOrchestrator,
  AIProviderRegistry,
  MockAIProvider,
  OpenAIProvider,
  GeminiProvider,
  AIProviderError,
  HELD_OUT_EVALUATION_DATASET,
  evaluateRetrieval,
} from '../src/knowledge';

describe('BugBuddy Stage 8 — Operational Reliability & Failure Modes Suite', () => {
  it('1. AIDebugOrchestrator rejects empty code submissions cleanly', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const searchIndex = new KnowledgeSearchIndex(ingest.records);
    const orchestrator = new AIDebugOrchestrator(searchIndex);

    await assert.rejects(
      async () => {
        await orchestrator.diagnose({
          language: 'python',
          code: '   ',
        });
      },
      {
        message: 'Code submission cannot be empty.',
      }
    );
  });

  it('2. AIDebugOrchestrator enforces maximum payload size limits (>32KB)', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const searchIndex = new KnowledgeSearchIndex(ingest.records);
    const orchestrator = new AIDebugOrchestrator(searchIndex);

    const hugeCode = 'x = 1\n'.repeat(6000); // ~36KB

    await assert.rejects(
      async () => {
        await orchestrator.diagnose({
          language: 'python',
          code: hugeCode,
        });
      },
      /exceeds maximum permitted size/
    );
  });

  it('3. AIDebugOrchestrator safely falls back to deterministic engine when provider fails', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const searchIndex = new KnowledgeSearchIndex(ingest.records);

    // Mock failing provider
    const failingProvider = new MockAIProvider({ simulatedError: 'TIMEOUT' });
    const registry = new AIProviderRegistry();
    registry.registerProvider(failingProvider);
    registry.setDefaultProviderId('mock');

    const orchestrator = new AIDebugOrchestrator(searchIndex, registry);

    const result = await orchestrator.diagnose({
      language: 'python',
      code: 'def add(a, b=[]):\n    b.append(a)\n    return b',
      errorMessage: 'List accumulates items across calls',
    });

    assert.strictEqual(result.usedFallback, true);
    assert.strictEqual(result.providerId, 'deterministic-fallback');
    assert.strictEqual(result.isGrounded, true);
    assert.ok(result.citedRecordIds.includes('py-mutable-default-argument'));
    assert.ok(result.limitations.some((l) => l.includes('Deterministic Fallback Active')));
  });

  it('4. AIDebugOrchestrator filters out fabricated record IDs not in retrieved evidence', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const searchIndex = new KnowledgeSearchIndex(ingest.records);

    // Custom provider that returns hallucinated citation IDs
    class HallucinatingProvider extends MockAIProvider {
      public async generateStructuredDiagnosis(req: any) {
        const base = await super.generateStructuredDiagnosis(req);
        return {
          ...base,
          citedRecordIds: ['py-mutable-default-argument', 'fabricated-hallucinated-id-999'],
        };
      }
    }

    const registry = new AIProviderRegistry();
    registry.registerProvider(new HallucinatingProvider());
    registry.setDefaultProviderId('mock');

    const orchestrator = new AIDebugOrchestrator(searchIndex, registry);

    const result = await orchestrator.diagnose({
      language: 'python',
      code: 'def add(a, b=[]):\n    b.append(a)\n    return b',
      errorMessage: 'List retains state',
    });

    assert.strictEqual(result.usedFallback, false);
    assert.ok(!result.citedRecordIds.includes('fabricated-hallucinated-id-999'), 'Hallucinated ID must be filtered out');
  });

  it('5. OpenAIProvider throws classified AUTH_ERROR when API key is missing', async () => {
    const provider = new OpenAIProvider({ apiKey: '' });
    assert.strictEqual(await provider.isAvailable(), false);

    await assert.rejects(
      async () => {
        await provider.generateStructuredDiagnosis({
          userSubmission: { language: 'python', code: 'x = 1' },
          retrievedEvidence: [],
          tone: 'mild',
        });
      },
      (err: any) => {
        assert.strictEqual(err instanceof AIProviderError, true);
        assert.strictEqual(err.code, 'AUTH_ERROR');
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it('6. GeminiProvider throws classified AUTH_ERROR when API key is missing', async () => {
    const provider = new GeminiProvider({ apiKey: '' });
    assert.strictEqual(await provider.isAvailable(), false);

    await assert.rejects(
      async () => {
        await provider.generateStructuredDiagnosis({
          userSubmission: { language: 'c', code: 'int main() {}' },
          retrievedEvidence: [],
          tone: 'mild',
        });
      },
      (err: any) => {
        assert.strictEqual(err instanceof AIProviderError, true);
        assert.strictEqual(err.code, 'AUTH_ERROR');
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it('7. Held-out benchmark dataset contains 30 verified cases across 6 languages + unsupported queries', () => {
    assert.strictEqual(HELD_OUT_EVALUATION_DATASET.length, 30);

    const languageCounts: Record<string, number> = {};
    let unsupportedCount = 0;

    for (const item of HELD_OUT_EVALUATION_DATASET) {
      if (item.isUnsupported) {
        unsupportedCount++;
      } else if (item.expectedLanguage) {
        languageCounts[item.expectedLanguage] = (languageCounts[item.expectedLanguage] || 0) + 1;
      }
    }

    assert.strictEqual(unsupportedCount, 6, 'Must contain 6 unsupported / out-of-scope queries');
    for (const lang of ['c', 'cpp', 'java', 'python', 'javascript', 'typescript']) {
      assert.strictEqual(languageCounts[lang], 4, `Language '${lang}' must have 4 held-out evaluation cases`);
    }
  });

  it('8. evaluateRetrieval on held-out benchmark correctly scores without throwing', async () => {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const ingest = await ingestKnowledgeDirectory(knowledgeDir);
    const searchIndex = new KnowledgeSearchIndex(ingest.records);

    const report = evaluateRetrieval(searchIndex, HELD_OUT_EVALUATION_DATASET, {
      topK: 5,
      applyLanguageFilter: false,
    });

    assert.strictEqual(report.totalEvaluatedCases, 30);
    assert.ok(report.overallMetrics.top1Accuracy > 0.70, 'Held-out benchmark accuracy must exceed 70%');
    assert.strictEqual(report.unknownExpectedIds.length, 0, 'Must have zero missing target record IDs');
  });
});
