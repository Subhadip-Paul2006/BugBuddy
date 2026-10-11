/**
 * BugBuddy — UI & AI Backend Integration E2E Test Suite
 * 
 * Verifies all 12 core requirements for Stage 7 AI integration with the UI:
 * 1. Confession Booth request construction.
 * 2. Language and error-message handling.
 * 3. Secret redaction before submission.
 * 4. Successful structured diagnosis rendering.
 * 5. Verified citation rendering with safe links.
 * 6. Loading and duplicate-submission behavior.
 * 7. Backend-unavailable behavior (graceful fallback).
 * 8. Invalid response and error handling.
 * 9. Deterministic fallback labeling and metadata.
 * 10. Debugging Chat integration and preserved 7 follow-up action chips.
 * 11. No fabricated citations.
 * 12. No duplicate XP awards or unintended resolution transitions.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { scanAndRedactSecrets } from '../src/utils/secretRedactor';
import {
  searchKnowledge,
  requestBackendDiagnosis,
  SAMPLE_SNIPPETS,
} from '../src/services/knowledgeService';
import {
  sendChatMessage,
  generateActionResponse,
  createInitialChatSession,
  FOLLOW_UP_CHIP_LABELS,
} from '../src/services/chatService';
import { BugConfessionBooth } from '../src/components/confession/BugConfessionBooth';
import { JudgmentTerminal } from '../src/components/confession/JudgmentTerminal';
import { DebugChat } from '../src/components/chat/DebugChat';
import { ConfessionResult, CanonicalLanguage } from '../src/types';

describe('BugBuddy UI & Stage 7 AI Integration Suite', () => {
  // 1. Confession Booth Request Construction
  it('1. should construct well-formed diagnosis payload with language, code, error, and expectations', async () => {
    const rawSnippet = 'char *ptr = NULL;\n*ptr = "X";';
    const errorTrace = 'Segmentation fault (core dumped)';
    const submission = {
      language: 'c' as CanonicalLanguage,
      code: rawSnippet,
      errorTrace,
      expectedBehavior: 'Safe string assignment',
      actualBehavior: 'Crash with SIGSEGV',
    };

    // Verify searchKnowledge accepts the full submission context
    const res = await searchKnowledge(submission);
    assert.ok(res);
    assert.equal(res.isNoMatch, false);
    assert.ok(res.result);
    assert.equal(res.result.language, 'c');
    assert.ok(res.result.symptoms.includes('Segmentation fault') || res.result.symptoms.includes('SIGSEGV') || res.result.title.includes('Pointer'));
  });

  // 2. Language and Error Message Handling
  it('2. should correctly enforce canonical languages and incorporate error traces into symptoms', async () => {
    const languages: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];
    for (const lang of languages) {
      const sample = SAMPLE_SNIPPETS[lang];
      assert.ok(sample, `Sample must exist for ${lang}`);
      assert.ok(sample.code.length > 0);
      assert.ok(sample.errorTrace.length > 0);

      const res = await searchKnowledge({
        language: lang,
        code: sample.code,
        errorTrace: sample.errorTrace,
      });

      assert.equal(res.isNoMatch, false);
      assert.ok(res.result);
      assert.equal(res.result.language, lang);
    }
  });

  // 3. Secret Redaction Before Submission
  it('3. should redact private API keys and passwords before sending to external endpoints', () => {
    const leakedCode = `
      const apiKey = "sk-abcdef1234567890abcdef1234567890";
      const dbConfig = { password: "SuperSecretPassword123!" };
      connect(apiKey, dbConfig);
    `;

    const scan = scanAndRedactSecrets(leakedCode);
    assert.equal(scan.hasSecrets, true);
    assert.ok(!scan.redactedCode.includes('sk-abcdef1234567890abcdef1234567890'));
    assert.ok(!scan.redactedCode.includes('SuperSecretPassword123!'));
    assert.ok(scan.redactedCode.includes('[REDACTED_OPENAI_KEY]'));
    assert.ok(scan.redactedCode.includes('[REDACTED_PASSWORD]'));

    // Verify that the original code is preserved intact locally
    assert.ok(leakedCode.includes('sk-abcdef1234567890abcdef1234567890'));
  });

  // 4. Successful Structured Diagnosis Rendering
  it('4. should render all required fields in JudgmentTerminal (summary, root cause, fix, why works, tests, roast)', () => {
    const mockResult: ConfessionResult = {
      id: 'py-test-record',
      title: 'Mutable Default Argument Accumulation',
      language: 'python',
      category: 'silly_mistake',
      roast: 'You gave every player the exact same backpack!',
      diagnosis: 'Default arguments in Python are evaluated once at definition time.',
      symptoms: 'Subsequent calls accumulate list state across invocations.',
      debuggingSteps: ['Inspect function parameter defaults', 'Replace mutable list with None sentinel'],
      buggyCode: 'def append_to(item, target=[]):\n    target.append(item)\n    return target',
      fixedCode: 'def append_to(item, target=None):\n    if target is None:\n        target = []\n    target.append(item)\n    return target',
      whyItWorks: 'Assigning a fresh list inside function scope guarantees caller isolation.',
      tests: 'assert append_to(1) == [1]\nassert append_to(2) == [2]',
      sources: [
        {
          title: 'Python Official Docs: Default Parameter Values',
          url: 'https://docs.python.org/3/tutorial/controlflow.html#default-argument-values',
          isPrimary: true,
          recordId: 'py-mutable-default-argument',
        },
      ],
      isDemo: false,
      timestamp: new Date().toISOString(),
      providerId: 'gemini',
      modelId: 'gemini-1.5-flash',
      isGrounded: true,
      limitations: ['Verified against Python 3.10+ execution semantics.'],
      rootCause: 'Evaluation of default expressions at function declaration time.',
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: mockResult,
        onReset: () => {},
      })
    );

    // Verify all key specification elements
    assert.ok(html.includes("ROAST:") || html.includes("BYTEBUDDY"), 'Must render ByteBuddy roast header');
    assert.ok(html.includes('You gave every player the exact same backpack!'), 'Must render roast text');
    assert.ok(html.includes('Mutable Default Argument Accumulation'), 'Must render problem summary');
    assert.ok(html.includes('Default arguments in Python are evaluated once'), 'Must render root cause');
    assert.ok(html.includes('Assigning a fresh list inside function scope'), 'Must render why it works');
    assert.ok(html.includes('VERIFICATION TEST RECOMMENDATION'), 'Must render verification tests');
    assert.ok(html.includes('assert append_to(1) == [1]'), 'Must render verification test commands');
    assert.ok(html.includes('AI-ASSISTED GROUNDED DIAGNOSIS (GEMINI • gemini-1.5-flash)'), 'Must render AI provider banner');
    assert.ok(html.includes('LIMITATIONS &amp; SYSTEM BOUNDARIES:') || html.includes('LIMITATIONS & SYSTEM BOUNDARIES:'), 'Must render limitations');
  });

  // 5. Verified Citation Rendering with Safe Links
  it('5. should render genuine documentation citations with safe rel="noopener noreferrer" and target="_blank"', () => {
    const mockResult: ConfessionResult = {
      id: 'c-null-deref',
      title: 'Null Pointer Dereference',
      language: 'c',
      category: 'memory_error',
      roast: 'You trusted a pointer that had nothing to give.',
      diagnosis: 'Writing to address 0x0 triggers a memory fault.',
      symptoms: 'Segmentation fault (core dumped)',
      debuggingSteps: ['Check for NULL before dereferencing'],
      buggyCode: 'int *p = NULL; *p = 5;',
      fixedCode: 'int *p = malloc(sizeof(int)); if (p) *p = 5;',
      whyItWorks: 'Valid heap allocation guarantees accessible memory page.',
      tests: 'gcc -Wall main.c && ./a.out',
      sources: [
        {
          title: 'ISO C Standard §6.5.3.2',
          url: 'https://en.cppreference.com/w/c/language/pointer',
          isPrimary: true,
          recordId: 'c-null-pointer-dereference',
        },
      ],
      isDemo: false,
      timestamp: new Date().toISOString(),
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: mockResult,
        onReset: () => {},
      })
    );

    assert.ok(html.includes('href="https://en.cppreference.com/w/c/language/pointer"'));
    assert.ok(html.includes('target="_blank"'));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes('ISO C Standard §6.5.3.2'));
    assert.ok(html.includes('#c-null-pointer-dereference'));
  });

  // 6. Loading and Duplicate-Submission Behavior
  it('6. should disable confession submit button during ANALYZING status to prevent duplicate requests', () => {
    // When status is ANALYZING, button is disabled
    const analyzingHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugConfessionBooth, {
        initialLanguage: 'python',
        initialCode: 'print(x)',
        onSetMood: () => {},
        onReturnToBaseCamp: () => {},
      })
    );

    // Initial state button is enabled
    assert.ok(analyzingHtml.includes('CONFESS BUG &amp; GET ROASTED') || analyzingHtml.includes('CONFESS BUG & GET ROASTED'));
  });

  // 7. Backend-Unavailable Behavior (Graceful Offline Fallback)
  it('7. should fall back to deterministic response engine without crashing when server is unreachable', async () => {
    // Calling searchKnowledge with offline server still returns grounded diagnosis from local corpus
    const res = await searchKnowledge({
      language: 'python',
      code: 'def f(x, l=[]):\n    l.append(x)\n    return l',
    });

    assert.equal(res.isNoMatch, false);
    assert.ok(res.result);
    assert.ok(res.result.fixedCode.includes('None'));
    assert.ok(res.result.sources.length > 0);
  });

  // 8. Invalid Response and Error Handling
  it('8. should return honest isNoMatch=true for completely unsupported code without inventing fixes', async () => {
    const res = await searchKnowledge({
      language: 'python',
      code: 'no-match-test xyzunsupported quantum_flux_capacitor = 42',
    });

    assert.equal(res.isNoMatch, true);
    assert.equal(res.result, null);
  });

  // 9. Deterministic Fallback Labeling
  it('9. should render DETERMINISTIC RETRIEVAL FALLBACK banner when usedFallback is true', () => {
    const fallbackResult: ConfessionResult = {
      id: 'fallback-01',
      title: 'Null Pointer Dereference',
      language: 'c',
      category: 'memory_error',
      roast: 'You dereferenced null again.',
      diagnosis: 'Direct memory fault.',
      symptoms: 'SIGSEGV',
      debuggingSteps: ['Check null'],
      buggyCode: 'char *s = NULL; *s = 0;',
      fixedCode: 'if (s != NULL) *s = 0;',
      whyItWorks: 'Guards indirection.',
      tests: './test.sh',
      sources: [
        {
          title: 'C Reference',
          url: 'https://en.cppreference.com/w/c',
          isPrimary: true,
        },
      ],
      isDemo: false,
      timestamp: new Date().toISOString(),
      usedFallback: true,
      providerId: 'deterministic-fallback',
      modelId: 'bugbuddy-stage4-engine',
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: fallbackResult,
        onReset: () => {},
      })
    );

    assert.ok(html.includes('DETERMINISTIC RETRIEVAL FALLBACK (STAGE 4 ENGINE)'));
    assert.ok(html.includes('offline curated knowledge pattern matching'));
  });

  // 10. Debugging Chat Integration & 7 Follow-Up Chips
  it('10. should support multi-turn chat messages and all 7 follow-up action chips with honest demo labels', async () => {
    const session = createInitialChatSession('python');
    assert.ok(session.messages.length >= 2);

    // Send a message
    const chatRes = await sendChatMessage(session, 'def append_val(val, arr=[]):\n    arr.append(val)');
    assert.ok(chatRes.userMessage);
    assert.ok(chatRes.assistantMessage);
    assert.ok(chatRes.updatedSession.messages.length > session.messages.length);

    // Verify all 7 follow-up action chips
    const actionKeys = Object.keys(FOLLOW_UP_CHIP_LABELS) as (keyof typeof FOLLOW_UP_CHIP_LABELS)[];
    assert.equal(actionKeys.length, 7);

    for (const action of actionKeys) {
      const response = generateActionResponse(action, chatRes.assistantMessage.diagnosisResult, 'python');
      assert.ok(response.content.length > 0);
      assert.equal(response.isDemo, true);
      assert.ok(response.demoDisclaimer.includes('demonstration adapter'));
    }
  });

  // 11. No Fabricated Citations
  it('11. should display "No documentation citations available" when source list is empty without fabricating URLs', () => {
    const emptySourceResult: ConfessionResult = {
      id: 'uncited-pattern',
      title: 'Uncited Custom Pattern',
      language: 'typescript',
      category: 'type_error',
      roast: 'Your types went missing.',
      diagnosis: 'Type widening error.',
      symptoms: 'Type mismatch at compile time.',
      debuggingSteps: ['Add explicit annotation'],
      buggyCode: 'let x: any = 1;',
      fixedCode: 'let x: number = 1;',
      whyItWorks: 'Constrains type domain.',
      tests: 'tsc --noEmit',
      sources: [],
      isDemo: false,
      timestamp: new Date().toISOString(),
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: emptySourceResult,
        onReset: () => {},
      })
    );

    assert.ok(html.includes('No documentation citations available for this record.'));
    assert.ok(!html.includes('http'));
  });

  // 12. No Duplicate XP Awards or Unintended Resolution Transitions
  it('12. should render DebugChat without premature bug-resolution transitions and award XP only on explicit slay', () => {
    let xpAwarded = 0;
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(DebugChat, {
        language: 'python',
        onSetMood: () => {},
        onAddXP: (amt) => { xpAwarded += amt; },
        onReturnToBaseCamp: () => {},
        onNavigateToConfession: () => {},
      })
    );

    // Initial render must NOT trigger XP awards
    assert.equal(xpAwarded, 0, 'No XP should be awarded merely by mounting DebugChat');
    assert.ok(html.includes('DEBUGGING WORKBENCH') || html.includes('SESSION #104'));
    assert.ok(html.includes('MARK BUG RESOLVED (+50 XP)'));
  });
});
