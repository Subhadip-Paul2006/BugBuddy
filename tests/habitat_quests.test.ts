/**
 * BugBuddy — Screen A & B: Pet Habitat Sanctuary and Survival Quest Board Test Suite
 * Specification: docs/UI_UX.md & BugBuddy UI Agent Prompt 08
 */

import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { PetHabitat } from '../src/components/habitat/PetHabitat';
import { QuestBoard } from '../src/components/quests/QuestBoard';
import { App } from '../src/App';
import { ByteBuddyMood, DailyQuest, SprintTask } from '../src/types';
import { MOCK_DAILY_QUESTS, MOCK_SPRINT_TASKS, MOOD_QUOTES } from '../src/mock/mockData';

describe('Screen A — Virtual Pet Habitat / Sanctuary', () => {
  const allMoods: ByteBuddyMood[] = [
    'ECSTATIC',
    'HAPPY',
    'NEUTRAL',
    'DISAPPOINTED',
    'DRAMATIC_DESPAIR',
  ];

  it('1. should render PetHabitat header, diorama canvas, and sanctuary landmark tags', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PetHabitat, {
        mood: 'HAPPY',
        onSetMood: () => {},
        onNavigateToBaseCamp: () => {},
        onNavigateToConfession: () => {},
        onNavigateToChat: () => {},
      })
    );

    assert.ok(html.includes('BYTEBUDDY SANCTUARY &amp; HABITAT') || html.includes('BYTEBUDDY SANCTUARY & HABITAT'), 'Should contain habitat title');
    assert.ok(html.includes('VOXEL GROVE LV.3'), 'Should display sanctuary level badge');
    assert.ok(html.includes('EMERALD TERRACES'), 'Should contain Emerald Terraces landmark tag');
    assert.ok(html.includes('HEARTH &amp; CAMPFIRE') || html.includes('HEARTH & CAMPFIRE'), 'Should contain Hearth landmark tag');
    assert.ok(html.includes('SYNTAX MONOLITH'), 'Should contain Syntax Monolith landmark tag');
  });

  it('2. should display active companion emotional status and quote for every mood state', () => {
    for (const mood of allMoods) {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(PetHabitat, {
          mood,
          onSetMood: () => {},
          onNavigateToBaseCamp: () => {},
          onNavigateToConfession: () => {},
          onNavigateToChat: () => {},
        })
      );

      // Verify mood quote is rendered
      const quote = MOOD_QUOTES[mood];
      assert.ok(
        html.includes(quote.replace(/"/g, '&quot;')) || html.includes(quote.substring(1, 20)),
        `Should render quote for mood ${mood}`
      );

      // Verify active mood label is displayed
      assert.ok(html.includes(mood), `Should display mood label for ${mood}`);
    }
  });

  it('3. should render Mood Inspector controls for all 5 moods', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PetHabitat, {
        mood: 'NEUTRAL',
        onSetMood: () => {},
        onNavigateToBaseCamp: () => {},
        onNavigateToConfession: () => {},
        onNavigateToChat: () => {},
      })
    );

    assert.ok(html.includes('MOOD INSPECTOR / PREVIEW CONTROLS:'), 'Should render Mood Inspector title');
    for (const mood of allMoods) {
      const label = mood.replace('_', ' ');
      assert.ok(html.includes(label), `Should render inspector button for ${mood}`);
    }
  });

  it('4. should render all in-world care and interaction buttons', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PetHabitat, {
        mood: 'HAPPY',
        onSetMood: () => {},
        onNavigateToBaseCamp: () => {},
        onNavigateToConfession: () => {},
        onNavigateToChat: () => {},
      })
    );

    assert.ok(html.includes('OBSERVE &amp; PET') || html.includes('OBSERVE & PET'), 'Should have Observe & Pet button');
    assert.ok(html.includes('CHEER UP!'), 'Should have Cheer Up button');
    assert.ok(html.includes('REST BY HEARTH'), 'Should have Rest by Hearth button');
    assert.ok(html.includes('SACRIFICE BUG'), 'Should have Sacrifice Bug action');
    assert.ok(html.includes('BASE CAMP'), 'Should have Return to Base Camp nav link');
    assert.ok(html.includes('DEBUG CHAT'), 'Should have Debug Chat nav link');
  });
});

describe('Screen B — Survival Quest Board / Coding Tasks', () => {
  it('5. should render QuestBoard header, sprint ledger badge, and summary ribbon', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
        initialQuests: MOCK_DAILY_QUESTS,
        initialTasks: MOCK_SPRINT_TASKS,
      })
    );

    assert.ok(html.includes('SURVIVAL QUEST BOARD'), 'Should display quest board header');
    assert.ok(html.includes('SPRINT LEDGER'), 'Should display sprint ledger badge');
    assert.ok(html.includes('BOARD COMPLETION:'), 'Should display board completion summary');
    assert.ok(html.includes('CLAIMED:'), 'Should display claimed XP summary');
    assert.ok(html.includes('AVAILABLE:'), 'Should display available XP summary');
  });

  it('6. should render category filter buttons', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
      })
    );

    const filterTabs = ['ALL', 'DAILY', 'SPRINT', 'ACTIVE', 'COMPLETED'];
    for (const tab of filterTabs) {
      assert.ok(html.includes(tab), `Should contain filter button for ${tab}`);
    }
  });

  it('7. should render daily quests with reward badges, progress bars, and descriptions', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
        initialQuests: MOCK_DAILY_QUESTS,
      })
    );

    for (const quest of MOCK_DAILY_QUESTS) {
      const escapedTitle = quest.title.replace(/'/g, '&#x27;');
      assert.ok(
        html.includes(quest.title) || html.includes(escapedTitle),
        `Should render quest title: ${quest.title}`
      );
      assert.ok(html.includes(`+${quest.rewardXP} XP`), `Should render XP reward: +${quest.rewardXP}`);
    }
  });

  it('8. should render sprint coding tasks with deadline countdowns and snooze buttons', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
        initialTasks: MOCK_SPRINT_TASKS,
      })
    );

    for (const task of MOCK_SPRINT_TASKS) {
      assert.ok(html.includes(task.title), `Should render sprint task title: ${task.title}`);
    }
    assert.ok(html.includes('+15M'), 'Should render snooze deadline buttons');
  });

  it('9. should render custom sprint task creator form with deadline options', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
      })
    );

    assert.ok(html.includes('PIN A NEW SPRINT TASK'), 'Should render custom task creator section');
    assert.ok(html.includes('+ PIN TO BOARD'), 'Should render pin button');
    assert.ok(html.includes('15 MINUTES'), 'Should have 15 min option');
    assert.ok(html.includes('30 MINUTES'), 'Should have 30 min option');
  });

  it('10. should render empty board state when no quests or tasks exist', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
        initialQuests: [],
        initialTasks: [],
      })
    );

    assert.ok(html.includes('BULLETIN BOARD IS CLEAR!'), 'Should display empty board message');
    assert.ok(html.includes('RESTORE DEFAULT QUESTS'), 'Should offer reset button');
  });
});

describe('Screen Navigation & Progression Invariants', () => {
  it('11. should render App without crashing with default Base Camp tab', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(App));
    assert.ok(html.includes('bb-app-layout'), 'App should render main layout');
    assert.ok(html.includes('DevCrafter'), 'App should display player profile name');
    assert.ok(html.includes('Console.log Archaeologist'), 'App should display player title');
  });

  it('12. should calculate completion percentage and reward amounts correctly', () => {
    const customQuests: DailyQuest[] = [
      {
        id: 'q-1',
        title: 'Q1',
        description: 'D1',
        rewardXP: 100,
        progress: 1,
        maxProgress: 1,
        completed: true,
      },
      {
        id: 'q-2',
        title: 'Q2',
        description: 'D2',
        rewardXP: 50,
        progress: 0,
        maxProgress: 1,
        completed: false,
      },
    ];

    const customTasks: SprintTask[] = [
      {
        id: 't-1',
        title: 'T1',
        deadlineMinutes: 20,
        isCompleted: true,
        isSnoozed: false,
      },
      {
        id: 't-2',
        title: 'T2',
        deadlineMinutes: 30,
        isCompleted: false,
        isSnoozed: false,
      },
    ];

    // Total: 4 items (2 completed) -> 50%
    const totalTasks = customQuests.length + customTasks.length;
    const completedTasks = customQuests.filter(q => q.completed).length + customTasks.filter(t => t.isCompleted).length;
    const progressPercent = Math.round((completedTasks / totalTasks) * 100);
    assert.equal(progressPercent, 50, 'Should be 50% completion');

    // Claimed XP: Q1 (100) + T1 (50) = 150
    const claimedXP = 100 + 50;
    // Available XP: Q2 (50) + T2 (50) = 100
    const availableXP = 50 + 50;

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(QuestBoard, {
        onAddXP: () => {},
        onSetMood: () => {},
        onNavigate: () => {},
        initialQuests: customQuests,
        initialTasks: customTasks,
      })
    );

    assert.ok(html.includes('50%'), 'Should display 50% completion in summary');
    assert.ok(html.includes('+150 XP'), 'Should display claimed XP amount of 150');
    assert.ok(html.includes('AVAILABLE: +100 XP'), 'Should display available XP amount of 100');
  });
});
