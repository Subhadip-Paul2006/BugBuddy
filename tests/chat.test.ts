/**
 * BugBuddy — Screen C: Interactive Debugging Chat Workbench Test Suite
 * Specification: docs/UI_UX.md Screen C & docs/TRD.md Section 9
 */

import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  createInitialChatSession,
  generateActionResponse,
  sendChatMessage,
  FOLLOW_UP_CHIP_LABELS,
} from '../src/services/chatService';
import {
  searchKnowledge,
  diagnoseSubmission,
  SAMPLE_SNIPPETS,
} from '../src/services/knowledgeService';
import { CanonicalLanguage, FollowUpActionType } from '../src/types';
import { scanAndRedactSecrets } from '../src/utils/secretRedactor';

describe('Debugging Chat Workbench — Session Creation & Demonstration Attribution', () => {
  const supportedLangs: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];

  it('1. should create an initial chat session with correct structure for each supported language', () => {
    for (const lang of supportedLangs) {
      const session = createInitialChatSession(lang);

      assert.ok(session.id, `Missing session id for ${lang}`);
      assert.equal(session.language, lang);
      assert.equal(session.status, 'Diagnosed');
      assert.ok(session.title.includes(lang.toUpperCase()), `Title should mention ${lang}`);
      assert.equal(session.messages.length, 2, 'Should start with exactly 2 messages (user + assistant)');

      // User message checks
      const userMsg = session.messages[0];
      assert.equal(userMsg.sender, 'user');
      assert.ok(userMsg.content.includes(lang.toUpperCase()));
      assert.ok(userMsg.codeSnippet);

      // Assistant message checks
      const botMsg = session.messages[1];
      assert.equal(botMsg.sender, 'assistant');
      assert.ok(botMsg.diagnosisResult);
      assert.equal(botMsg.diagnosisResult.language, lang);
      assert.ok(botMsg.diagnosisResult.roast);
      assert.ok(botMsg.diagnosisResult.fixedCode);
      assert.ok(botMsg.suggestedActionChips && botMsg.suggestedActionChips.length === 7);

      // Prompt 06 rule: Demo examples must be explicitly labeled as demonstration results
      assert.equal(botMsg.isDemo, true, `Initial assistant message must be marked as isDemo=true for ${lang}`);
      assert.ok(botMsg.demoDisclaimer, 'Must have demo disclaimer');
      assert.equal(botMsg.diagnosisResult.isDemo, true);
    }
  });

  it('2. should verify in-memory session semantics without assuming persistence', () => {
    const sessionA = createInitialChatSession('cpp');
    const sessionB = createInitialChatSession('cpp');

    // Each call produces fresh independent objects
    assert.notEqual(sessionA, sessionB);
    assert.deepEqual(sessionA.language, sessionB.language);
  });
});

describe('Debugging Chat Workbench — 7 Contextual Action Chips', () => {
  const allActionChips: FollowUpActionType[] = [
    'simpler',
    'deeper',
    'minimal_diff',
    'worked_example',
    'more_tests',
    'explain_line',
    'roast_again',
  ];

  it('3. should provide definitions, icons, and descriptions for all 7 action chips', () => {
    for (const chip of allActionChips) {
      const meta = FOLLOW_UP_CHIP_LABELS[chip];
      assert.ok(meta, `Missing chip metadata for ${chip}`);
      assert.ok(meta.label.length > 3, `Label too short for ${chip}`);
      assert.ok(meta.icon.length >= 1, `Icon missing for ${chip}`);
      assert.ok(meta.description.length > 10, `Description too short for ${chip}`);
    }
  });

  it('4. should generate tailored demonstration responses for each of the 7 action chips', () => {
    const session = createInitialChatSession('cpp');
    const lastDiag = session.messages[1].diagnosisResult;

    for (const chip of allActionChips) {
      const res = generateActionResponse(chip, lastDiag, 'cpp');

      assert.ok(res.content.length > 20, `Response content too short for chip ${chip}`);
      assert.ok(res.newMood, `Missing new mood for chip ${chip}`);

      // All action responses are produced by the local adapter
      assert.equal(res.isDemo, true, `Chip ${chip} must be flagged as isDemo=true`);
      assert.ok(res.demoDisclaimer.includes('local demonstration adapter'), `Disclaimer must identify local adapter for ${chip}`);

      if (chip === 'simpler') {
        assert.equal(res.newMood, 'HAPPY');
        assert.ok(res.content.includes('Zero Jargon'));
      } else if (chip === 'deeper') {
        assert.equal(res.newMood, 'NEUTRAL');
        assert.ok(res.content.includes('Under The Hood'));
      } else if (chip === 'minimal_diff') {
        assert.equal(res.newMood, 'HAPPY');
        assert.ok(res.content.includes('```diff'));
      } else if (chip === 'worked_example') {
        assert.equal(res.newMood, 'HAPPY');
        assert.ok(res.content.includes('Worked Example'));
      } else if (chip === 'more_tests') {
        assert.equal(res.newMood, 'HAPPY');
        assert.ok(res.content.includes('More Debugging Tests'));
      } else if (chip === 'explain_line') {
        assert.equal(res.newMood, 'NEUTRAL');
        assert.ok(res.content.includes('Line-by-Line Breakdown'));
      } else if (chip === 'roast_again') {
        assert.equal(res.newMood, 'DISAPPOINTED');
        assert.ok(res.content.includes('Encore Roast'));
      }
    }
  });
});

describe('Debugging Chat Workbench — Multi-Turn Messaging, Redaction & Grounded Retrieval', () => {
  it('5. should reject empty or whitespace-only messages', async () => {
    const session = createInitialChatSession('cpp');

    await assert.rejects(
      async () => {
        await sendChatMessage(session, '   \n  \t  ');
      },
      /Cannot send empty chat message/
    );
  });

  it('6. should redact sensitive API keys and tokens before storing or searching', async () => {
    const session = createInitialChatSession('python');
    const secretInput = 'const key = "sk-1234567890abcdef1234567890abcdef";\nprint(key)';

    const { userMessage, assistantMessage } = await sendChatMessage(session, secretInput);

    // User message content must have secret redacted
    assert.ok(!userMessage.content.includes('sk-1234567890abcdef'));
    assert.ok(userMessage.content.includes('[REDACTED_OPENAI_KEY]'));
    // Assistant message must not echo back secret
    assert.ok(!assistantMessage.content.includes('sk-1234567890abcdef'));
  });

  it('7. should query Stage 3 retrieval and return genuine curated knowledge with isDemo=false when a match is found', async () => {
    const session = createInitialChatSession('cpp');
    // C++ nullptr dereference pattern from corpus
    const validQuery = 'int* ptr = nullptr; *ptr = 42; Segmentation fault';

    const { assistantMessage, updatedSession, newMood } = await sendChatMessage(session, validQuery);

    assert.equal(newMood, 'HAPPY');
    assert.ok(assistantMessage.diagnosisResult);
    // Real retrieval result must be marked isDemo=false
    assert.equal(assistantMessage.isDemo, false, 'Genuine retrieved match must NOT be flagged as demo');
    assert.equal(assistantMessage.diagnosisResult.isDemo, false);
    assert.ok(assistantMessage.diagnosisResult.sources.length >= 1);
    assert.ok(assistantMessage.diagnosisResult.sources[0].url.startsWith('http'));
    assert.equal(updatedSession.status, 'Diagnosed');
  });

  it('8. should return an honest no-match response with isDemo=false when input matches nothing', async () => {
    const session = createInitialChatSession('python');
    const nonsenseInput = 'xyzunsupported random nonsense query that matches nothing in corpus';

    const { assistantMessage, updatedSession, newMood } = await sendChatMessage(session, nonsenseInput);

    assert.equal(newMood, 'NEUTRAL');
    assert.equal(assistantMessage.diagnosisResult, undefined);
    assert.equal(assistantMessage.isDemo, false);
    assert.ok(assistantMessage.content.includes('No Exact Pattern Match'));
    assert.equal(updatedSession.status, 'Debugging');
  });

  it('9. should NEVER award fake XP or automatically mark bug as resolved upon sending message', async () => {
    const session = createInitialChatSession('cpp');
    const { updatedSession } = await sendChatMessage(session, 'Checking my logic here');

    // Bug status must not become 'Resolved' merely from messaging
    assert.notEqual(updatedSession.status, 'Resolved');
  });
});

describe('Debugging Chat Workbench — UI Static Markup Rendering', () => {
  it('10. should render DebugChat workbench layout with headers, tags, and in-memory badge', async () => {
    const React = await import('react');
    const ReactDOMServer = await import('react-dom/server');
    const { DebugChat } = await import('../src/components/chat/DebugChat');

    let currentMood = 'NEUTRAL';
    let currentXP = 0;

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(DebugChat, {
        language: 'cpp',
        onSetMood: (m) => { currentMood = m; },
        onAddXP: (xp) => { currentXP += xp; },
        onReturnToBaseCamp: () => {},
        onNavigateToConfession: () => {},
      })
    );

    // Workbench container
    assert.ok(html.includes('DEBUGGING WORKBENCH: MULTI-TURN SPRINT CHAT'));
    assert.ok(html.includes('aria-label="Debugging Workbench"'));

    // In-Memory badge
    assert.ok(html.includes('IN-MEMORY (RESETS ON RELOAD)'));

    // Language emblem
    assert.ok(html.includes('CPP'));

    // Controls
    assert.ok(html.includes('CLEAR CHAT'));
    assert.ok(html.includes('NEW SPRINT'));
    assert.ok(html.includes('MARK BUG RESOLVED (+50 XP)'));

    // Initial message roast & fix
    assert.ok(html.includes('RECOMMENDED CODE FIX'));
    assert.ok(html.includes('COPY FIX'));

    // 7 Contextual action chips
    assert.ok(html.includes('Simpler Explanation'));
    assert.ok(html.includes('Deeper Mechanics'));
    assert.ok(html.includes('Minimal Diff'));
    assert.ok(html.includes('Worked Example'));
    assert.ok(html.includes('More Debugging Tests'));
    assert.ok(html.includes('Explain Specific Line'));
    assert.ok(html.includes('Roast Me Again'));

    // Demonstration badge on canned initial message
    assert.ok(html.includes('DEMONSTRATION RESPONSE'));
  });
});

describe('Debugging Chat & Confession — Stage 4 Diagnosis & Stage 5 Attribution (Prompt 07)', () => {
  it('11. should perform real Stage 3 retrieval followed by Stage 4 diagnosis construction with full response fields', async () => {
    const pySample = SAMPLE_SNIPPETS.python;
    const { result, isNoMatch, rawResponse } = await searchKnowledge({
      code: pySample.code,
      language: 'python',
      errorTrace: pySample.errorTrace,
      expectedBehavior: pySample.expectedBehavior,
      actualBehavior: pySample.actualBehavior,
    });

    assert.equal(isNoMatch, false);
    assert.ok(result);
    assert.ok(rawResponse);

    // Stage 4 core fields
    assert.equal(result.id, 'py-mutable-default-argument');
    assert.ok(result.matchedKnowledgeIds && result.matchedKnowledgeIds.includes('py-mutable-default-argument'));
    assert.ok(result.responseMode === 'DIRECT_MATCH' || result.responseMode === 'RELATED_GUIDANCE');
    assert.ok(result.rootCause && result.rootCause.length > 10);
    assert.ok(result.whyItWorks && result.whyItWorks.length > 10);
    assert.ok(result.limitations && result.limitations.length >= 1);
    assert.ok(result.limitations[0].includes('deterministic'));
  });

  it('12. should distinguish DIRECT_MATCH from RELATED_GUIDANCE correctly based on user context', async () => {
    const pySample = SAMPLE_SNIPPETS.python;

    // Direct match: Code matches canonical template pattern closely
    const directDiag = await diagnoseSubmission({
      code: pySample.code,
      language: 'python',
      errorTrace: pySample.errorTrace,
    });
    assert.ok(directDiag.responseMode === 'DIRECT_MATCH' || directDiag.responseMode === 'RELATED_GUIDANCE');
    assert.ok(directDiag.suggestedFix);

    // Related guidance: Completely distinct user variable names / logic
    const relatedDiag = await diagnoseSubmission({
      code: 'def build_cart(user_id, cart_items=[]):\n    cart_items.append("iron_ore")\n    return cart_items',
      language: 'python',
      errorTrace: 'AssertionError: multiple items in default cart across calls',
    });
    assert.equal(relatedDiag.responseMode, 'RELATED_GUIDANCE');
    assert.equal(relatedDiag.suggestedFix?.isDirectFix, false);
    assert.ok(relatedDiag.suggestedFix?.relatedPatternNote?.includes('derived from knowledge entry'));
  });

  it('13. should preserve Stage 5 source provenance and prevent fabricated citations', async () => {
    const pySample = SAMPLE_SNIPPETS.python;
    const { result } = await searchKnowledge({
      code: pySample.code,
      language: 'python',
      errorTrace: pySample.errorTrace,
    });

    assert.ok(result);
    assert.ok(result.sources.length >= 1);

    for (const src of result.sources) {
      assert.ok(src.url.startsWith('https://'), `Source URL must be valid HTTPS: ${src.url}`);
      assert.ok(src.title && src.title.length > 5, `Source title must exist`);
      assert.ok(src.recordId && src.recordId.startsWith('py-'), `Source must trace back to a valid python record ID: ${src.recordId}`);
      assert.equal(src.language, 'python');
      if (src.isPrimary) {
        assert.equal(src.recordId, 'py-mutable-default-argument');
      }
    }
  });

  it('14. should ensure Chat and Confession Booth use compatible structured response contracts', async () => {
    const session = createInitialChatSession('python');
    const userPrompt = 'def register_player_inventory(player_name, items=[]): items.append("torch")';

    const { assistantMessage, updatedSession } = await sendChatMessage(session, userPrompt);

    assert.ok(assistantMessage.diagnosisResult);
    assert.equal(assistantMessage.diagnosisResult.id, 'py-mutable-default-argument');
    assert.ok(assistantMessage.diagnosisResult.responseMode);
    assert.ok(assistantMessage.content.includes('Diagnosis'));
    assert.ok(assistantMessage.content.includes('Recommended Fix'));
    assert.ok(assistantMessage.content.includes('Why it works'));
    assert.ok(assistantMessage.content.includes('Recommended Verification Tests'));

    // Provenance must be intact
    assert.ok(assistantMessage.diagnosisResult.sources.length >= 1);
    const primarySource = assistantMessage.diagnosisResult.sources.find((s) => s.isPrimary);
    assert.ok(primarySource);
    assert.equal(primarySource.recordId, 'py-mutable-default-argument');
    assert.equal(updatedSession.status, 'Diagnosed');
  });

  it('15. should render JudgmentTerminal with Stage 5 provenance citations and empty citation state', async () => {
    const React = await import('react');
    const ReactDOMServer = await import('react-dom/server');
    const { JudgmentTerminal } = await import('../src/components/confession/JudgmentTerminal');

    // Case A: Result with Stage 5 attributed sources
    const mockResult = {
      id: 'py-mutable-default-argument',
      title: 'Mutable Default Argument Accumulation',
      language: 'python' as const,
      category: 'variable_scope',
      difficulty: 'beginner',
      roast: 'Default arguments are evaluated once at function definition time!',
      diagnosis: 'Python creates the default list once and reuses it.',
      symptoms: 'Lists accumulate across invocations.',
      debuggingSteps: ['Use None as default parameter.', 'Initialize new list inside function.'],
      buggyCode: 'def f(x=[]): x.append(1)',
      fixedCode: 'def f(x=None): if x is None: x = []',
      whyItWorks: 'Default None creates fresh list per invocation.',
      tests: 'pytest -v',
      sources: [
        {
          title: 'Python Docs — Default Parameter Values',
          url: 'https://docs.python.org/3/tutorial/controlflow.html#default-argument-values',
          recordId: 'py-mutable-default-argument',
          language: 'python' as const,
          category: 'variable_scope',
          isPrimary: true,
        },
      ],
      isDemo: false,
      timestamp: new Date().toISOString(),
      responseMode: 'DIRECT_MATCH' as const,
      matchedKnowledgeIds: ['py-mutable-default-argument'],
    };

    const htmlWithSources = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: mockResult,
        onReset: () => {},
      })
    );

    assert.ok(htmlWithSources.includes('DIRECT MATCH'));
    assert.ok(htmlWithSources.includes('#py-mutable-default-argument'));
    assert.ok(htmlWithSources.includes('PRIMARY'));
    assert.ok(htmlWithSources.includes('https://docs.python.org'));
    assert.ok(htmlWithSources.includes('rel="noopener noreferrer"'));

    // Case B: Result with no sources
    const mockResultNoSources = {
      ...mockResult,
      sources: [],
    };

    const htmlNoSources = ReactDOMServer.renderToStaticMarkup(
      React.createElement(JudgmentTerminal, {
        result: mockResultNoSources,
        onReset: () => {},
      })
    );

    assert.ok(htmlNoSources.includes('No documentation citations available for this record.'));
  });
});

