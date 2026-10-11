import React from 'react';
import { NavigationTab } from '../../types';
import { PixelIcon, PixelIconName } from '../common/PixelIcon';

interface PlaceholderScreenProps {
  tab: NavigationTab;
  onReturnToBaseCamp: () => void;
}

interface TabMeta {
  title: string;
  subtitle: string;
  icon: PixelIconName;
  phase: string;
  description: string;
  features: string[];
}

const TAB_METAS: Record<NavigationTab, TabMeta> = {
    confession: {
      title: 'THE BUG CONFESSION BOOTH',
      subtitle: 'Altar of Syntactic Penance',
      icon: 'swords',
      phase: 'Phase 2',
      description:
        'The multi-language confession booth where developers lay bare C, C++, Java, Python, JS, and TS errors to receive structured diagnoses and biting roasts from ByteBuddy.',
      features: [
        'Monaco/CodeMirror Syntax-Highlighted Dual-Pane Editor',
        'Automatic Language Detector with Manual Overrides',
        'Client-Side Regex Secret Redactor Shield',
        'Roast Card, Root Cause Diagnosis & Unified Code Diff Viewer',
      ],
    },
    chat: {
      title: 'DEBUGGING CHAT WORKBENCH',
      subtitle: 'Multi-Turn Sprint Collaboration',
      icon: 'chat',
      phase: 'Phase 3',
      description:
        'An interactive terminal conversation space where ByteBuddy provides contextual follow-ups, worked examples, deeper kernel memory analysis, and edge-case unit assertions.',
      features: [
        'Multi-Turn Chat History with Companion Speech Bubbles',
        '7 Contextual Follow-Up Action Chips',
        'Source Citations from Knowledge Codex',
        'One-Click Code Copy and Patch Verification',
      ],
    },
    quests: {
      title: 'SURVIVAL QUEST BOARD',
      subtitle: 'Daily Developer Milestones & Sprints',
      icon: 'scroll',
      phase: 'Phase 2',
      description:
        'A Minecraft-inspired bulletin board with pinned parchment notes tracking daily coding goals, sprint countdown timers, and XP reward milestones.',
      features: [
        'Daily Procedural Coding Quests',
        'Custom Sprint Task Creator with Countdown Timers',
        'Anti-Procrastination Snooze Penalties',
        'Claimable Gold XP Orbs and Streak Embers',
      ],
    },
    habitat: {
      title: 'BYTEBUDDY SANCTUARY & HABITAT',
      subtitle: 'Expanded Voxel Environment & Pet Wellness',
      icon: 'paw',
      phase: 'Phase 2',
      description:
        'An interactive, zoomable 2.5D voxel habitat where developers can observe ByteBuddy exploring, feed virtual coffee blocks, and inspect unlocked survival trophies.',
      features: [
        'Multi-Level Terraced Terrain with Animated Water Stream',
        'Dynamic Campfire Hearth with Lighting Shadows',
        'Pet Happiness & Hunger Status Meters',
        'Trophy Shelf for Milestone Achievements',
      ],
    },
    graveyard: {
      title: 'THE BUG GRAVEYARD',
      subtitle: 'Archive of Resolved Post-Mortems',
      icon: 'tombstone',
      phase: 'Phase 3',
      description:
        'A solemn collection of labeled dungeon chests and granite gravestones commemorating past bugs slayed in the line of duty.',
      features: [
        'Filterable Post-Mortem Archive by Language & Error Type',
        'Session Playback and Resolution Timestamps',
        'Offline IndexedDB Storage Export and Import',
        'Regression Prevention Test Command Shelf',
      ],
    },
    codex: {
      title: 'THE KNOWLEDGE CODEX',
      subtitle: "Explorer's Grounded Language Library",
      icon: 'book',
      phase: 'Phase 3',
      description:
        'An ancient enchanted tome containing curated language specifications, official memory model definitions, and compiler standards with honest attribution.',
      features: [
        'Curated ISO C++, Java SE, and Python 3 Specification Indices',
        'Grounded Source Attribution Badge & External Canonical Links',
        'Honest Epistemic Disclosure for Unmatched Inquiries',
        'Offline Full-Text Fast Search (Ctrl + K)',
      ],
    },
    settings: {
      title: 'BASE CAMP CONTROL PANEL',
      subtitle: 'Game & Developer Preferences',
      icon: 'gear',
      phase: 'Phase 1 Foundation',
      description:
        'Manage visual preferences, audio synthesis, accessibility settings, and safe in-memory AI provider API keys.',
      features: [
        'Pixel Display Font Toggle (Press Start 2P vs System Font)',
        'Retro 8-Bit Chiptune Web Audio SFX Toggle',
        'WCAG AAA High-Contrast Mode & Reduced Motion Toggle',
        'Safe Local-Only AI Provider Key Configuration (In-Memory)',
      ],
    },
    'base-camp': {
      title: 'BASE CAMP',
      subtitle: 'Survival Hub',
      icon: 'tent',
      phase: 'Phase 1',
      description: 'The central survival base.',
      features: [],
    },
};

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  tab,
  onReturnToBaseCamp,
}) => {
  const meta = TAB_METAS[tab] ?? TAB_METAS['base-camp'];

  return (
    <main
      className="bb-placeholder-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        className="bb-panel-slab"
        style={{
          maxWidth: '640px',
          width: '100%',
          padding: '24px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '14px' }}>
          <PixelIcon name={meta.icon} size={48} />
        </div>

        <div
          style={{
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '14px',
            color: 'var(--bb-text-primary)',
            letterSpacing: '1px',
            marginBottom: '6px',
          }}
        >
          {meta.title}
        </div>

        <div
          style={{
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            color: 'var(--bb-color-gold)',
            marginBottom: '16px',
          }}
        >
          {meta.subtitle} • SCHEDULED FOR {meta.phase.toUpperCase()}
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--bb-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          {meta.description}
        </p>

        {meta.features.length > 0 && (
          <div
            className="bb-panel-inset"
            style={{
              padding: '14px 18px',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-emerald)',
                marginBottom: '10px',
              }}
            >
              UPCOMING ARCHITECTURAL SPECIFICATIONS:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                fontSize: '12px',
                color: 'var(--bb-text-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {meta.features.map((feat, i) => (
                <li key={i}>{feat}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            className="bb-btn bb-btn-emerald"
            onClick={onReturnToBaseCamp}
          >
            ◀ RETURN TO ISOMETRIC BASE CAMP
          </button>
        </div>
      </div>
    </main>
  );
};
