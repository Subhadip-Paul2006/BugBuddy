import React, { useState } from 'react';
import { ByteBuddyMood, NavigationTab, SprintTask, CanonicalLanguage } from '../../types';
import { IsometricWorldCanvas } from '../world/IsometricWorldCanvas';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { PixelIcon } from '../common/PixelIcon';
import { MOCK_RECENT_BUGS, MOCK_SPRINT_TASKS } from '../../mock/mockData';

interface BaseCampDashboardProps {
  mood: ByteBuddyMood;
  onSetMood: (mood: ByteBuddyMood) => void;
  onNavigate: (tab: NavigationTab) => void;
  onAddXP: (amount: number) => void;
}

export const BaseCampDashboard: React.FC<BaseCampDashboardProps> = ({
  mood,
  onSetMood,
  onNavigate,
  onAddXP,
}) => {
  const [tasks, setTasks] = useState<SprintTask[]>(MOCK_SPRINT_TASKS);
  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          if (nextCompleted) {
            onAddXP(50);
            onSetMood('HAPPY');
            setXpToast({ amount: 50, key: Date.now() });
            setTimeout(() => setXpToast(null), 1800);
          }
          return { ...t, isCompleted: nextCompleted };
        }
        return t;
      })
    );
  };

  const handlePetInteraction = () => {
    // Interactive clicking on pet cycles to joyful states
    if (mood === 'NEUTRAL' || mood === 'DISAPPOINTED') {
      onSetMood('HAPPY');
    } else if (mood === 'HAPPY') {
      onSetMood('ECSTATIC');
    } else {
      onSetMood('HAPPY');
    }
  };

  return (
    <main
      className="bb-basecamp-main"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
        position: 'relative',
      }}
      aria-label="Base Camp Living World"
    >
      {/* Floating XP Toast Award Animation */}
      {xpToast && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bb-color-gold)',
            color: '#382B00',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '13px',
            padding: '8px 16px',
            border: '2px solid #FFFFFF',
            boxShadow: '0 4px 12px rgba(241, 196, 15, 0.5)',
            zIndex: 1000,
            animation: 'bytebuddy-jump 0.5s ease-out',
            pointerEvents: 'none',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            +{xpToast.amount} XP CLAIMED! <PixelIcon name="star" size={12} color="var(--bb-color-gold)" />
          </span>
        </div>
      )}

      {/* 1. The Central 2.5D Isometric World Stage */}
      <section style={{ width: '100%' }}>
        <IsometricWorldCanvas mood={mood} onPetClick={handlePetInteraction} />
      </section>

      {/* 2. Primary Actions Bar */}
      <section
        className="bb-panel-slab"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PixelIcon name="lightning" size={16} color="var(--bb-color-gold)" />
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '10px',
              color: 'var(--bb-text-primary)',
            }}
          >
            PRIMARY SPRINT WORKSTATION
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="bb-btn bb-btn-emerald"
            onClick={() => onNavigate('confession')}
            title="Open the Confession Booth to paste code and get diagnoses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PixelIcon name="swords" size={12} /> CONFESS A BUG (C, C++, Java, Py, JS, TS)
          </button>
          <button
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('chat')}
            title="Continue active multi-turn debugging chat"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PixelIcon name="chat" size={12} /> RESUME CHAT
          </button>
          <button
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('quests')}
            title="View daily quest board and tasks"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PixelIcon name="scroll" size={12} /> VIEW QUESTS
          </button>
        </div>
      </section>

      {/* 3. Modular Sub-Panels Grid (Recent Confessions & Sprint Tasks) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Left Sub-Panel: Recent Bug Confessions */}
        <section className="bb-panel-slab" style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid var(--bb-border-subtle)',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🪦</span>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-text-primary)',
                }}
              >
                RECENT BUG CONFESSIONS
              </span>
            </div>
            <button
              className="bb-btn bb-btn-stone"
              style={{ fontSize: '7px', padding: '4px 6px' }}
              onClick={() => onNavigate('graveyard')}
            >
              ARCHIVE →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_RECENT_BUGS.map((bug) => (
              <div
                key={bug.id}
                className="bb-panel-inset"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigate('confession')}
                title="Click to view bug diagnosis in Confession Booth"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      className="bb-tag-lang"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 6px',
                      }}
                    >
                      <LanguagePixelLogo
                        language={
                          bug.language.toLowerCase() === 'c++'
                            ? 'cpp'
                            : (bug.language.toLowerCase() as CanonicalLanguage)
                        }
                        size={12}
                      />
                      {bug.language}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--bb-text-muted)',
                      }}
                    >
                      {bug.category}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--bb-text-primary)',
                      fontFamily: 'var(--bb-font-code)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bug.title}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-gold)',
                    flexShrink: 0,
                  }}
                >
                  +{bug.xpAwarded} XP
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sub-Panel: Daily Sprint Tasks */}
        <section className="bb-panel-slab" style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid var(--bb-border-subtle)',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PixelIcon name="clipboard" size={12} />
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-text-primary)',
                }}
              >
                DAILY SPRINT TASKS
              </span>
            </div>
            <button
              className="bb-btn bb-btn-stone"
              style={{ fontSize: '7px', padding: '4px 6px' }}
              onClick={() => onNavigate('quests')}
            >
              ALL TASKS →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bb-panel-inset"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: task.isCompleted ? 0.65 : 1,
                  background: task.isCompleted ? 'rgba(46, 204, 113, 0.08)' : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => handleToggleTask(task.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--bb-color-emerald)',
                    cursor: 'pointer',
                  }}
                  id={`task-check-${task.id}`}
                />
                <label
                  htmlFor={`task-check-${task.id}`}
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    color: task.isCompleted ? 'var(--bb-color-emerald)' : 'var(--bb-text-primary)',
                    textDecoration: task.isCompleted ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {task.title}
                </label>
                {task.deadlineMinutes > 0 && !task.isCompleted && (
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-code)',
                      fontSize: '10px',
                      color: 'var(--bb-color-redstone)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <PixelIcon name="star" size={9} color="var(--bb-color-redstone)" /> {task.deadlineMinutes}m
                  </span>
                )}
                {task.isCompleted && (
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '7px',
                      color: 'var(--bb-color-emerald)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    SLAYED <PixelIcon name="check" size={8} color="var(--bb-color-emerald)" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
