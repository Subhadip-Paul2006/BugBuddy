/**
 * BugBuddy — UI & Backend AI Integration Test Suite
 *
 * Validates the complete flow from UI submission to backend diagnosis:
 * 1. Confession submission with secret redaction
 * 2. Backend communication and deterministic in-memory fallback
 * 3. Structured diagnosis, probable root cause, suggested fix, limitations, and citations
 * 4. Differentiated metadata (AI-assisted vs. fallback vs. demo)
 * 5. Honest no-match and error handling
 * 6. Multi-turn chat service compatibility
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { searchKnowledge, requestBackendDiagnosis } from '../src/services/knowledgeService';
import { sendChatMessage, createInitialChatSession } from '../src/services/chatService';
import { scanAndRedactSecrets } from '../src/utils/secretRedactor';
import type { ConfessionSubmission } from '../src/types';

describe('BugBuddy UI Prompt 11 — Stage 7 AI Integration & UI Verification Suite', () => {
  // 1. Secret Redaction Pre-Flight
  it('1. Secret redactor sanitizes API keys and tokens before submission', () => {
    const rawCode = `const apiKey = "sk-proj-1234567890abcdef1234567890";\nfetch("https://api.openai.com", { headers: { Authorization: "Bearer sk-proj-1234567890abcdef1234567890" } });`;
    const scan = scanAndRedactSecrets(rawCode);

    assert.strictEqual(scan.hasSecrets, true);
    assert.ok(!scan.redactedCode.includes('sk-proj-1234567890abcdef1234567890'));
    assert.ok(scan.redactedCode.includes('[REDACTED_API_SECRET]'));
    assert.ok(scan.redactedCode.includes('[REDACTED_BEARER_TOKEN]'));
    assert.ok(scan.detections.length >= 1);
  });

  // 2. Confession Submission with Grounded Output
  it('2. searchKnowledge produces grounded diagnosis with root cause, fix, and citations', async () => {
    const submission: ConfessionSubmission = {
      language: 'python',
      code: `def add_item(item, basket=[]):\n    basket.append(item)\n    return basket`,
      errorTrace: 'State accumulates across calls unexpectedly',
    };

    const { result, isNoMatch } = await searchKnowledge(submission);

    assert.strictEqual(isNoMatch, false);
    assert.ok(result !== null);
    assert.ok(result.title.length > 0);
    assert.ok(result.diagnosis.length > 0);
    assert.ok(result.roast.length > 0);
    assert.ok(result.fixedCode.length > 0);
    assert.ok(result.whyItWorks.length > 0);
    assert.ok(result.sources.length > 0);
    assert.ok(result.sources.every((s) => s.url.startsWith('https://') || s.url.startsWith('http://')));
    assert.ok(result.limitations && result.limitations.length > 0);
  });

  // 3. Fallback and Metadata Differentiation
  it('3. searchKnowledge clearly identifies fallback metadata when cloud AI is offline', async () => {
    const submission: ConfessionSubmission = {
      language: 'typescript',
      code: `interface Quest { stages?: { current: number } }\nfunction getStage(q: Quest) { return q.stages.current; }`,
      errorTrace: 'TS2532: Object is possibly undefined',
    };

    const { result, isNoMatch } = await searchKnowledge(submission);

    assert.strictEqual(isNoMatch, false);
    assert.ok(result !== null);
    // Should have providerId and modelId indicating engine
    assert.ok(result.providerId !== undefined);
    assert.ok(result.modelId !== undefined);
    // When backend is offline or falling back, usedFallback is true
    assert.strictEqual(result.usedFallback, true);
    assert.strictEqual(result.isDemo, false);
  });

  // 4. Honest No-Match Behavior
  it('4. searchKnowledge returns isNoMatch: true when code has no matching knowledge entry', async () => {
    const submission: ConfessionSubmission = {
      language: 'c',
      code: `// no-match-test random gibberish xyz123`,
    };

    const { result, isNoMatch } = await searchKnowledge(submission);

    assert.strictEqual(isNoMatch, true);
    assert.strictEqual(result, null);
  });

  // 5. Empty Submission Guard
  it('5. searchKnowledge rejects empty code cleanly', async () => {
    const submission: ConfessionSubmission = {
      language: 'java',
      code: '   ',
    };

    const { result, isNoMatch } = await searchKnowledge(submission);

    assert.strictEqual(isNoMatch, true);
    assert.strictEqual(result, null);
  });

  // 6. Debugging Chat Multi-Turn Integration
  it('6. sendChatMessage connects with knowledge retrieval while preserving action chips', async () => {
    const session = createInitialChatSession('python');
    const input = 'def f(x, l=[]): l.append(x); return l';

    const response = await sendChatMessage(session, input);

    assert.ok(response.userMessage.content.length > 0);
    assert.ok(response.assistantMessage.content.length > 0);
    assert.ok(response.assistantMessage.suggestedActionChips && response.assistantMessage.suggestedActionChips.length === 7);
    assert.strictEqual(response.updatedSession.messages.length, session.messages.length + 2);
  });

  // 7. Backend Request Guard
  it('7. requestBackendDiagnosis handles unreachable endpoints without crashing', async () => {
    const submission: ConfessionSubmission = {
      language: 'c',
      code: 'int main() { return 0; }',
    };

    // When backend is not currently running on 3001 during test, requestBackendDiagnosis returns null safely
    const aiResponse = await requestBackendDiagnosis(submission);
    assert.ok(aiResponse === null || typeof aiResponse === 'object');
  });
});
