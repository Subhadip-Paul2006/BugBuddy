import React from 'react';
import { ByteBuddyMood, DailyQuest, SprintTask } from '../../types';
import { MOOD_QUOTES } from '../../mock/mockData';
import { PixelIcon } from '../common/PixelIcon';

interface PetStatusPanelProps {
  mood: ByteBuddyMood;
  onSetMood: (mood: ByteBuddyMood) => void;
  activeQuest: DailyQuest;
  activeTask?: SprintTask;
  onNavigateToQuests: () => void;
  onNavigateToConfession: () => void;
}

export const PetStatusPanel: React.FC<PetStatusPanelProps> = ({
  mood,
  onSetMood,
  activeQuest,
  activeTask,
  onNavigateToQuests,
  onNavigateToConfession,
}) => {
  const allMoods: ByteBuddyMood[] = [
    'ECSTATIC',
    'HAPPY',
    'NEUTRAL',
    'DISAPPOINTED',
    'DRAMATIC_DESPAIR',
  ];

  return (
    <aside
      className="bb-pet-status-drawer"
      style={{
        width: 'var(--bb-drawer-width)',
        background: 'var(--bb-surface-base)',
        borderLeft: '2px solid var(--bb-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        overflowY: 'auto',
        flexShrink: 0,
      }}
      aria-label="Companion Status & Sprint Quests"
    >
      {/* 1. Companion Status Header Card */}
      <section className="bb-panel-slab" style={{ padding: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="paw" size={18} />
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-text-primary)',
              }}
            >
              BYTEBUDDY
            </span>
          </div>
          <span className={`bb-badge-mood ${mood}`}>
            {mood.replace('_', ' ')}
          </span>
        </div>

        {/* Dynamic Sarcastic Dialogue Quote */}
        <div
          className="bb-panel-inset"
          style={{
            padding: '10px 12px',
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'var(--bb-text-secondary)',
            lineHeight: 1.5,
            borderLeft: '3px solid var(--bb-color-gold)',
            marginBottom: '12px',
          }}
        >
          {MOOD_QUOTES[mood]}
        </div>

        {/* Development Preview Mood Controller */}
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              color: 'var(--bb-text-muted)',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>PREVIEW MOOD CONTROLLER</span>
            <span style={{ color: 'var(--bb-color-emerald)' }}>[INTERACTIVE]</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '4px',
            }}
          >
            {allMoods.map((m) => (
              <button
                key={m}
                onClick={() => onSetMood(m)}
                className={`bb-btn ${mood === m ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                style={{
                  padding: '6px 2px',
                  fontSize: '7px',
                  letterSpacing: '0',
                }}
                title={`Switch ByteBuddy to ${m} state`}
              >
                {m === 'ECSTATIC' ? 'EXC'
                  : m === 'HAPPY' ? 'HAP'
                  : m === 'NEUTRAL' ? 'NEU'
                  : m === 'DISAPPOINTED' ? 'DIS'
                  : 'DES'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Active Daily Quest Summary Card */}
      <section className="bb-panel-slab" style={{ padding: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '9px',
              color: 'var(--bb-text-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PixelIcon name="scroll" size={10} color="var(--bb-text-gold)" />
            <span>DAILY CODING QUEST</span>
          </span>
          <span style={{ fontSize: '10px', color: 'var(--bb-color-gold)' }}>
            +{activeQuest.rewardXP} XP
          </span>
        </div>

        <div
          style={{
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--bb-text-primary)',
            marginBottom: '4px',
          }}
        >
          {activeQuest.title}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--bb-text-secondary)',
            marginBottom: '8px',
          }}
        >
          {activeQuest.description}
        </div>

        {/* Progress Bar */}
        <div className="bb-xp-bar-track" style={{ height: '8px', marginBottom: '10px' }}>
          <div
            className="bb-xp-bar-fill"
            style={{ width: `${(activeQuest.progress / activeQuest.maxProgress) * 100}%` }}
          />
        </div>

        <button
          className="bb-btn bb-btn-stone"
          style={{ width: '100%', fontSize: '8px', padding: '6px' }}
          onClick={onNavigateToQuests}
        >
          OPEN QUEST BOARD (3 ACTIVE)
        </button>
      </section>

      {/* 3. Active Sprint Task & Countdown Timer */}
      {activeTask && (
        <section className="bb-panel-slab" style={{ padding: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-redstone)',
              }}
            >
              ⏱️ SPRINT TIMER
            </span>
            <span
              style={{
                fontFamily: 'var(--bb-font-code)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--bb-color-redstone)',
              }}
            >
              {activeTask.deadlineMinutes}:00
            </span>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--bb-text-primary)',
              marginBottom: '10px',
              lineHeight: 1.4,
            }}
          >
            {activeTask.title}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="bb-btn bb-btn-emerald"
              style={{ flex: 1, fontSize: '8px', padding: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              onClick={onNavigateToConfession}
            >
              <PixelIcon name="swords" size={10} />
              <span>SOLVE BUG</span>
            </button>
            <button
              className="bb-btn bb-btn-stone"
              style={{ fontSize: '8px', padding: '6px 10px' }}
              onClick={() => onSetMood('DISAPPOINTED')}
              title="Snoozing drops ByteBuddy mood to DISAPPOINTED"
            >
              SNOOZE
            </button>
          </div>
        </section>
      )}

      {/* 4. Survival Base Status Footnote */}
      <div
        style={{
          fontFamily: 'var(--bb-font-pixel-display)',
          fontSize: '7px',
          color: 'var(--bb-text-muted)',
          textAlign: 'center',
          marginTop: 'auto',
          paddingTop: '8px',
        }}
      >
        BUGBUDDY BASE CAMP • PHASE 1 ONLINE
      </div>
    </aside>
  );
};
