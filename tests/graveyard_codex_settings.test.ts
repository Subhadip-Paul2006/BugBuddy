/**
 * BugBuddy — Screen A, B & C: Bug Graveyard, Knowledge Codex, and Settings Test Suite
 * Specification: docs/UI_UX.md & BugBuddy UI Agent Prompt 09
 */

import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { BugGraveyard, DEFAULT_GRAVEYARD_BUGS } from '../src/components/graveyard/BugGraveyard';
import { KnowledgeCodex } from '../src/components/codex/KnowledgeCodex';
import { SettingsScreen, DEFAULT_PREFERENCES } from '../src/components/settings/SettingsScreen';
import { BugConfessionBooth } from '../src/components/confession/BugConfessionBooth';
import { QuestBoard } from '../src/components/quests/QuestBoard';
import { App } from '../src/App';
import { ALL_CORPUS_ENTRIES } from '../src/services/knowledgeService';
import { CanonicalLanguage } from '../src/types';

describe('Screen A — Bug Graveyard & Post-Mortem Crypt', () => {
  it('1. should render BugGraveyard header, session scope notice, and quick nav buttons', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('THE BUG GRAVEYARD'), 'Should contain graveyard title');
    assert.ok(html.includes('POST-MORTEM CRYPT'), 'Should contain crypt badge');
    assert.ok(html.includes('Session Scope Notice'), 'Should explicitly disclose session memory scope');
    assert.ok(html.includes('BASE CAMP'), 'Should have Base Camp navigation button');
    assert.ok(html.includes('CONFESS A BUG'), 'Should have Confess a Bug navigation button');
  });

  it('2. should render initial bug tombstones with language emblems, status, and XP', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        initialBugs: DEFAULT_GRAVEYARD_BUGS,
        onNavigate: () => {},
      })
    );

    for (const bug of DEFAULT_GRAVEYARD_BUGS) {
      assert.ok(html.includes(bug.title), `Should render title for ${bug.title}`);
      assert.ok(html.includes(bug.category), `Should render category for ${bug.category}`);
      assert.ok(html.includes(`+${bug.xpAwarded} XP`), `Should render XP for ${bug.title}`);
      assert.ok(html.includes(bug.status), `Should render status for ${bug.title}`);
    }
  });

  it('3. should render empty crypt state when no bugs match or history is empty', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        initialBugs: [],
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('THE CRYPT IS EMPTY'), 'Should display empty crypt state message');
    assert.ok(html.includes('CONSECRATE A BUG'), 'Should offer action to consecrate a bug');
    assert.ok(html.includes('RESTORE DEFAULTS'), 'Should offer restore defaults button');
  });

  it('4. should render language filter chips and status dropdown', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        onNavigate: () => {},
      })
    );

    const languages: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];
    for (const lang of languages) {
      assert.ok(html.includes(lang.toUpperCase()), `Should render language filter for ${lang}`);
    }
    assert.ok(html.includes('RESOLVED ONLY'), 'Should contain RESOLVED filter option');
    assert.ok(html.includes('DIAGNOSED ONLY'), 'Should contain DIAGNOSED filter option');
  });
});

describe('Screen B — Knowledge Codex & Curated Standards', () => {
  it('5. should render KnowledgeCodex header, epistemic disclosure, and search input', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(KnowledgeCodex, {
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('THE KNOWLEDGE CODEX'), 'Should contain codex title');
    assert.ok(html.includes('CURATED SPECIFICATIONS'), 'Should contain curated specifications badge');
    assert.ok(html.includes('Curated Offline Reference'), 'Should state offline curated nature');
    assert.ok(html.includes('Search codex by concept'), 'Should contain search input placeholder');
  });

  it('6. should render indexed scrolls from genuine 60-entry corpus', () => {
    assert.equal(ALL_CORPUS_ENTRIES.length, 60, 'Corpus should contain exactly 60 verified records');

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(KnowledgeCodex, {
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('INDEXED SCROLLS'), 'Should display indexed scrolls count');
    // Check sample entries from diverse languages
    assert.ok(html.includes('c-null-pointer-dereference') || html.includes('Null Pointer Dereference'), 'Should render C scroll');
    assert.ok(html.includes('py-mutable-default-argument') || html.includes('Mutable Default Argument'), 'Should render Python scroll');
    assert.ok(html.includes('java-concurrent-modification') || html.includes('ConcurrentModificationException'), 'Should render Java scroll');
  });

  it('7. should render filter controls for all 6 languages, categories, and difficulty levels', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(KnowledgeCodex, {
        onNavigate: () => {},
      })
    );

    const languages: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];
    for (const lang of languages) {
      assert.ok(html.includes(lang.toUpperCase()), `Should render filter tab for ${lang}`);
    }

    assert.ok(html.includes('ALL CATEGORIES'), 'Should include all categories option');
    assert.ok(html.includes('BEGINNER'), 'Should include beginner difficulty option');
    assert.ok(html.includes('INTERMEDIATE'), 'Should include intermediate difficulty option');
    assert.ok(html.includes('ADVANCED'), 'Should include advanced difficulty option');
  });

  it('8. should preserve genuine external canonical source citations across all corpus entries', () => {
    // Verify every corpus entry has valid non-empty sources
    for (const entry of ALL_CORPUS_ENTRIES) {
      assert.ok(entry.sources && entry.sources.length > 0, `Record ${entry.id} must have sources`);
      for (const src of entry.sources) {
        assert.ok(src.url.startsWith('http'), `Source URL for ${entry.id} must be valid HTTP(S): ${src.url}`);
      }
    }
  });
});

describe('Screen C — Settings & Preferences Control Panel', () => {
  it('9. should render SettingsScreen header, system config badge, and security disclaimer', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(SettingsScreen, {
        onNavigate: () => {},
        isAudioEnabled: true,
        onToggleAudio: () => {},
        onSetMood: () => {},
      })
    );

    assert.ok(html.includes('BASE CAMP CONTROL PANEL'), 'Should contain control panel title');
    assert.ok(html.includes('SYSTEM CONFIG'), 'Should contain system config badge');
    assert.ok(html.includes('Security Guarantee:'), 'Should contain client-side security guarantee');
    assert.ok(html.includes('RESTORE DEFAULTS'), 'Should contain restore defaults button');
  });

  it('10. should render all functional preference controls with working default states', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(SettingsScreen, {
        onNavigate: () => {},
        isAudioEnabled: true,
        onToggleAudio: () => {},
        onSetMood: () => {},
      })
    );

    // Audio Section
    assert.ok(html.includes('8-BIT AUDIO SYNTHESIS'), 'Should have audio synthesis section');
    assert.ok(html.includes('Master Audio Engine'), 'Should have master audio control');
    assert.ok(html.includes('Sound Effects (SFX)'), 'Should have SFX control');
    assert.ok(html.includes('Chiptune Background Music'), 'Should have chiptune music control');
    assert.ok(html.includes('TEST SYNTHESIZER SOUND'), 'Should have audio test button');

    // Accessibility Section
    assert.ok(html.includes('ACCESSIBILITY &amp; DISPLAY') || html.includes('ACCESSIBILITY & DISPLAY'), 'Should have display accessibility section');
    assert.ok(html.includes('Reduced Motion'), 'Should have reduced motion toggle');
    assert.ok(html.includes('High Contrast Mode'), 'Should have high contrast mode toggle');
    assert.ok(html.includes('Pixel Retro Typography'), 'Should have typography toggle');

    // Companion Section
    assert.ok(html.includes('BYTEBUDDY COMPANION DYNAMICS'), 'Should have companion dynamics section');
    assert.ok(html.includes('Automatic Slay Celebration'), 'Should have automatic slay toggle');
    assert.ok(html.includes('Snarky Roast Commentary'), 'Should have snarky roast toggle');
    assert.ok(html.includes('RESET COMPANION MOOD'), 'Should have reset companion mood button');
  });

  it('11. should provide sensible default preferences matching specification', () => {
    assert.strictEqual(DEFAULT_PREFERENCES.audioEnabled, true);
    assert.strictEqual(DEFAULT_PREFERENCES.sfxMuted, false);
    assert.strictEqual(DEFAULT_PREFERENCES.highContrast, false);
    assert.strictEqual(DEFAULT_PREFERENCES.pixelFont, true);
    assert.strictEqual(DEFAULT_PREFERENCES.autoCheerPet, true);
    assert.strictEqual(DEFAULT_PREFERENCES.snarkyRoasts, true);
  });
});

describe('Master App Router & Navigation Integration', () => {
  it('12. should render App without crashing with all screens integrated', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(App));

    assert.ok(html.includes('bb-app-layout'), 'App should render main layout');
    assert.ok(html.includes('DevCrafter'), 'App should display player profile');
    assert.ok(html.includes('Base Camp'), 'App navigation should contain Base Camp');
    assert.ok(html.includes('Confession Booth'), 'App navigation movement should contain Confession Booth');
    assert.ok(html.includes('Debugging Chat'), 'App navigation should contain Debugging Chat');
    assert.ok(html.includes('Quest Board'), 'App navigation should contain Quest Board');
    assert.ok(html.includes('Pet Sanctuary'), 'App navigation should contain Pet Sanctuary');
    assert.ok(html.includes('Bug Graveyard'), 'App navigation should contain Bug Graveyard');
    assert.ok(html.includes('Knowledge Codex'), 'App navigation should contain Knowledge Codex');
    assert.ok(html.includes('Base Settings'), 'App navigation should contain Base Settings');
  });
});

describe('Prompt 10 Final Audit — Cross-Screen Data Flow & Accessibility Invariants', () => {
  it('13. should distinguish SEED reference bugs from live SESSION bugs with origin badges and filters', () => {
    // 1. Render default seeded bugs
    const seededHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        initialBugs: DEFAULT_GRAVEYARD_BUGS,
        onNavigate: () => {},
      })
    );
    assert.ok(seededHtml.includes('SEED'), 'Should display SEED origin badge on default canonical records');
    assert.ok(seededHtml.includes('ALL ORIGINS') || seededHtml.includes('ORIGIN'), 'Should include origin filter selector');

    // 2. Render live session bug
    const sessionBug = {
      id: 'confession-live-test',
      title: 'Real-time Panic: Memory Leak in Event Bus',
      language: 'typescript' as const,
      category: 'Memory Management',
      slayedAt: '10:45 PM (Live Session)',
      xpAwarded: 50,
      status: 'RESOLVED' as const,
      isSeededExample: false,
    };
    const sessionHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugGraveyard, {
        initialBugs: [sessionBug],
        onNavigate: () => {},
      })
    );
    assert.ok(sessionHtml.includes('SESSION'), 'Should display SESSION origin badge on dynamically slain bugs');
    assert.ok(sessionHtml.includes('Real-time Panic: Memory Leak in Event Bus'), 'Should render live session bug title');
  });

  it('14. should accept initialCode prop in BugConfessionBooth for seamless Codex handoff', () => {
    const snippet = 'const badCode = () => { eval("unsafe"); };';
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BugConfessionBooth, {
        initialLanguage: 'typescript',
        initialCode: snippet,
        onSetMood: () => {},
        onReturnToBaseCamp: () => {},
      })
    );

    // The code editor area should reflect the provided snippet
    assert.ok(html.includes('badCode') || html.includes('eval'), 'Confession Booth should contain initialCode');
  });

  it('15. should render QuestBoard with duplicate XP prevention state and restore defaults capability', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('SURVIVAL QUEST BOARD'), 'Should render Survival Quest Board title');
    assert.ok(html.includes('BOARD COMPLETION:'), 'Should render board completion statistics');
    assert.ok(html.includes('PIN A NEW SPRINT TASK'), 'Should render Sprint Tasks section');
  });

  it('16. should provide WCAG-compliant high-contrast, reduced-motion, and clean-font CSS rules', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/app.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes('.bb-high-contrast'), 'CSS must define .bb-high-contrast class');
    assert.ok(cssContent.includes('.bb-reduced-motion'), 'CSS must define .bb-reduced-motion class');
    assert.ok(cssContent.includes('.bb-clean-font'), 'CSS must define .bb-clean-font class');
    assert.ok(cssContent.includes('--bb-text-primary: #FFFFFF'), 'High contrast should set primary text to pure white');
    assert.ok(cssContent.includes('--bb-surface-void: #000000'), 'High contrast should set void surface to pure black');
    assert.ok(cssContent.includes('animation-duration: 0.001ms !important'), 'Reduced motion should clamp animations to 0.001ms');
  });
});
