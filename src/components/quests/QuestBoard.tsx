import React, { useState, useEffect } from 'react';
import { DailyQuest, SprintTask, ByteBuddyMood, NavigationTab } from '../../types';
import { MOCK_DAILY_QUESTS, MOCK_SPRINT_TASKS } from '../../mock/mockData';
import { PixelIcon } from '../common/PixelIcon';
import {
  loadDailyQuests,
  saveDailyQuests,
  loadSprintTasks,
  saveSprintTasks,
  loadAwardedXPIds,
  saveAwardedXPIds,
} from '../../utils/storage';

export interface QuestBoardProps {
  onAddXP: (amount: number) => void;
  onSetMood: (mood: ByteBuddyMood) => void;
  onNavigate: (tab: NavigationTab) => void;
  initialQuests?: DailyQuest[];
  initialTasks?: SprintTask[];
}

type FilterTab = 'ALL' | 'DAILY' | 'SPRINT' | 'ACTIVE' | 'COMPLETED';

export const QuestBoard: React.FC<QuestBoardProps> = ({
  onAddXP,
  onSetMood,
  onNavigate,
  initialQuests = MOCK_DAILY_QUESTS,
  initialTasks = MOCK_SPRINT_TASKS,
}) => {
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => {
    if (initialQuests !== MOCK_DAILY_QUESTS) return initialQuests;
    return loadDailyQuests();
  });
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>(() => {
    if (initialTasks !== MOCK_SPRINT_TASKS) return initialTasks;
    return loadSprintTasks();
  });
  const [filter, setFilter] = useState<FilterTab>('ALL');

  // New Sprint Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  const [awardedIds, setAwardedIds] = useState<Set<string>>(() => {
    if (initialQuests !== MOCK_DAILY_QUESTS || initialTasks !== MOCK_SPRINT_TASKS) {
      const initialCompleted = new Set<string>();
      initialQuests.filter((q) => q.completed).forEach((q) => initialCompleted.add(q.id));
      initialTasks.filter((t) => t.isCompleted).forEach((t) => initialCompleted.add(t.id));
      return initialCompleted;
    }
    return loadAwardedXPIds();
  });

  useEffect(() => {
    saveDailyQuests(dailyQuests);
  }, [dailyQuests]);

  useEffect(() => {
    saveSprintTasks(sprintTasks);
  }, [sprintTasks]);

  useEffect(() => {
    saveAwardedXPIds(awardedIds);
  }, [awardedIds]);

  const showToast = (msg: string) => {
    setRewardToast(msg);
    setTimeout(() => {
      setRewardToast((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  // Toggle Daily Quest Completion
  const handleToggleQuest = (id: string) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextCompleted = !q.completed;
          if (nextCompleted) {
            if (!awardedIds.has(q.id)) {
              onAddXP(q.rewardXP);
              onSetMood('ECSTATIC');
              setAwardedIds((set) => new Set(set).add(q.id));
              showToast(`Quest Complete! Awarded +${q.rewardXP} XP!`);
            } else {
              showToast('Quest marked complete (XP already claimed).');
            }
          }
          return {
            ...q,
            completed: nextCompleted,
            progress: nextCompleted ? q.maxProgress : 0,
          };
        }
        return q;
      })
    );
  };

  // Toggle Sprint Task Completion
  const handleToggleSprint = (id: string) => {
    setSprintTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.isCompleted;
          if (nextCompleted) {
            if (!awardedIds.has(t.id)) {
              onAddXP(50);
              onSetMood('HAPPY');
              setAwardedIds((set) => new Set(set).add(t.id));
              showToast('Sprint Task Slayed! Awarded +50 XP!');
            } else {
              showToast('Sprint task marked complete (XP already claimed).');
            }
          }
          return { ...t, isCompleted: nextCompleted };
        }
        return t;
      })
    );
  };

  // Snooze Sprint Task
  const handleSnoozeSprint = (id: string) => {
    setSprintTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            deadlineMinutes: t.deadlineMinutes + 15,
            isSnoozed: true,
          };
        }
        return t;
      })
    );
    showToast('Added +15m to sprint timer.');
  };

  // Delete Sprint Task
  const handleDeleteSprint = (id: string) => {
    setSprintTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task removed from board.');
  };

  // Delete Daily Quest
  const handleDeleteQuest = (id: string) => {
    setDailyQuests((prev) => prev.filter((q) => q.id !== id));
    showToast('Quest removed from board.');
  };

  // Add Custom Sprint Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a task title before pinning to board.');
      return;
    }

    const newTask: SprintTask = {
      id: `task-${Date.now()}`,
      title: trimmed,
      deadlineMinutes: newDeadline,
      isCompleted: false,
      isSnoozed: false,
    };

    setSprintTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setErrorMessage(null);
    showToast('Custom sprint task pinned to board!');
  };

  // Clear all completed tasks
  const handleClearCompleted = () => {
    setSprintTasks((prev) => prev.filter((t) => !t.isCompleted));
    setDailyQuests((prev) => prev.filter((q) => !q.completed));
    showToast('Cleaned completed cards from board!');
  };

  // Reset to initial mock data
  const handleResetDefaults = () => {
    setDailyQuests(initialQuests);
    setSprintTasks(initialTasks);
    const initialCompleted = new Set<string>();
    initialQuests.filter((q) => q.completed).forEach((q) => initialCompleted.add(q.id));
    initialTasks.filter((t) => t.isCompleted).forEach((t) => initialCompleted.add(t.id));
    setAwardedIds(initialCompleted);
    showToast('Restored default quests and tasks.');
  };

  // Calculations for summary & progress
  const totalDaily = dailyQuests.length;
  const completedDaily = dailyQuests.filter((q) => q.completed).length;

  const totalSprint = sprintTasks.length;
  const completedSprint = sprintTasks.filter((t) => t.isCompleted).length;

  const totalTasks = totalDaily + totalSprint;
  const totalCompleted = completedDaily + completedSprint;
  const progressPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 100;

  const claimedXP = dailyQuests
    .filter((q) => q.completed)
    .reduce((sum, q) => sum + q.rewardXP, 0) + completedSprint * 50;

  const claimableXP = dailyQuests
    .filter((q) => !q.completed)
    .reduce((sum, q) => sum + q.rewardXP, 0) + (totalSprint - completedSprint) * 50;

  // Filter lists based on tab
  const showDaily = filter === 'ALL' || filter === 'DAILY' || (filter === 'ACTIVE' && dailyQuests.some(q => !q.completed)) || (filter === 'COMPLETED' && dailyQuests.some(q => q.completed));
  const showSprint = filter === 'ALL' || filter === 'SPRINT' || (filter === 'ACTIVE' && sprintTasks.some(t => !t.isCompleted)) || (filter === 'COMPLETED' && sprintTasks.some(t => t.isCompleted));

  const filteredDaily = dailyQuests.filter((q) => {
    if (filter === 'ACTIVE') return !q.completed;
    if (filter === 'COMPLETED') return q.completed;
    return true;
  });

  const filteredSprint = sprintTasks.filter((t) => {
    if (filter === 'ACTIVE') return !t.isCompleted;
    if (filter === 'COMPLETED') return t.isCompleted;
    return true;
  });

  const isBoardEmpty = filteredDaily.length === 0 && filteredSprint.length === 0;

  return (
    <div
      className="bb-quest-board-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
      }}
      aria-label="Survival Quest Board"
    >
      {/* 1. Header & Navigation Ribbon */}
      <header
        className="bb-panel-slab"
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid var(--bb-mat-planks)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="scroll" size={18} />
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: 'var(--bb-color-gold)',
                letterSpacing: '0.8px',
              }}
            >
              SURVIVAL QUEST BOARD
            </h1>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                background: 'rgba(241, 196, 15, 0.15)',
                color: 'var(--bb-color-gold)',
                border: '1px solid var(--bb-color-gold)',
                padding: '2px 6px',
              }}
            >
              SPRINT LEDGER
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Pinned coding challenges, daily procedural goals, and anti-procrastination sprint timers.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('base-camp')}
            title="Return to Base Camp Dashboard"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="tent" size={10} />
            <span>BASE CAMP</span>
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('habitat')}
            title="Visit Pet Sanctuary"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="paw" size={10} />
            <span>PET SANCTUARY</span>
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={() => onNavigate('confession')}
            title="Confess a bug to fulfill quest penance"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="swords" size={10} />
            <span>CONFESS A BUG</span>
          </button>
        </div>
      </header>

      {/* 2. Interactive Toast */}
      {rewardToast && (
        <div
          role="status"
          aria-live="polite"
          className="bb-panel-slab"
          style={{
            padding: '8px 14px',
            background: 'rgba(241, 196, 15, 0.12)',
            border: '1px solid var(--bb-color-gold)',
            color: 'var(--bb-color-gold)',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{rewardToast}</span>
          <PixelIcon name="star" size={10} color="var(--bb-color-gold)" />
        </div>
      )}

      {/* 3. Wooden Board Frame Wrapper */}
      <div
        className="bb-wooden-board-frame"
        style={{
          background: '#201A15',
          border: '4px solid #5A3D28',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 4px 0 #0D0E11',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Progress & Reward Summary Ribbon */}
        <div
          className="bb-panel-slab"
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: '#2A231C',
            border: '2px solid #432E1F',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-text-gold)',
                }}
              >
                BOARD COMPLETION: {totalCompleted} / {totalTasks} ({progressPercent}%)
              </span>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-emerald)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>CLAIMED: +{claimedXP} XP</span>
                <PixelIcon name="coin" size={9} color="var(--bb-color-gold)" />
              </span>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-text-muted)',
                }}
              >
                AVAILABLE: +{claimableXP} XP
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={handleClearCompleted}
                style={{ fontSize: '8px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Remove completed tasks"
              >
                <PixelIcon name="broom" size={9} />
                <span>CLEAR COMPLETED</span>
              </button>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={handleResetDefaults}
                style={{ fontSize: '8px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Restore default mock quests and tasks"
              >
                <PixelIcon name="refresh" size={9} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div
            style={{
              height: '10px',
              background: '#14110E',
              border: '1px solid #3A281B',
              overflow: 'hidden',
              position: 'relative',
            }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall quest board completion"
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background:
                  progressPercent === 100
                    ? 'var(--bb-color-emerald)'
                    : 'linear-gradient(90deg, #F1C40F 0%, #2ECC71 100%)',
                transition: 'width 250ms ease-out',
              }}
            />
          </div>
        </div>

        {/* 4. Filter / Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'DAILY', 'SPRINT', 'ACTIVE', 'COMPLETED'] as FilterTab[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  padding: '6px 12px',
                  background: isActive ? '#3A2E24' : '#1F1A14',
                  border: `1px solid ${isActive ? 'var(--bb-color-gold)' : '#3F2C1F'}`,
                  color: isActive ? 'var(--bb-color-gold)' : 'var(--bb-text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {tab === 'ALL' && <PixelIcon name="scroll" size={9} style={{ marginRight: '4px' }} />}
                {tab === 'DAILY' && <PixelIcon name="sun" size={9} style={{ marginRight: '4px' }} />}
                {tab === 'SPRINT' && <PixelIcon name="fast-forward" size={9} style={{ marginRight: '4px' }} />}
                {tab === 'ACTIVE' && <PixelIcon name="lightning" size={9} style={{ marginRight: '4px' }} />}
                {tab === 'COMPLETED' && <PixelIcon name="check" size={9} color="#2ECC71" style={{ marginRight: '4px' }} />}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* 5. Custom Sprint Task Form Card */}
        <form
          onSubmit={handleAddTask}
          className="bb-panel-slab"
          style={{
            padding: '12px 14px',
            background: '#241E18',
            border: '2px solid #432E1F',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          aria-label="Add New Sprint Task"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-emerald)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PixelIcon name="pin" size={10} color="var(--bb-color-emerald)" />
              <span>PIN A NEW SPRINT TASK</span>
            </span>
            <span
              style={{
                fontFamily: 'var(--bb-font-code)',
                fontSize: '9px',
                color: 'var(--bb-text-muted)',
              }}
            >
              Earn +50 XP per resolution
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Fix null pointer dereference in auth handler..."
              style={{
                flex: 1,
                minWidth: '220px',
                background: '#14110E',
                border: `1px solid ${errorMessage ? 'var(--bb-color-redstone)' : '#432E1F'}`,
                color: 'var(--bb-text-primary)',
                fontFamily: 'var(--bb-font-code)',
                fontSize: '11px',
                padding: '6px 10px',
                outline: 'none',
              }}
              aria-label="Task title input"
            />

            <select
              value={newDeadline}
              onChange={(e) => setNewDeadline(Number(e.target.value))}
              style={{
                background: '#14110E',
                border: '1px solid #432E1F',
                color: 'var(--bb-text-gold)',
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
              }}
              aria-label="Sprint timer selector"
            >
              <option value={15}>15 MINUTES</option>
              <option value={30}>30 MINUTES</option>
              <option value={45}>45 MINUTES</option>
              <option value={60}>60 MINUTES</option>
            </select>

            <button
              type="submit"
              className="bb-btn bb-btn-emerald"
              style={{ fontSize: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <PixelIcon name="plus" size={8} />
              <span>+ PIN TO BOARD</span>
            </button>
          </div>

          {errorMessage && (
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-redstone)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              role="alert"
            >
              <PixelIcon name="cross" size={10} color="var(--bb-color-redstone)" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* 6. Empty State if no tasks match */}
        {isBoardEmpty && (
          <div
            className="bb-panel-inset"
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              background: '#17130F',
              border: '2px dashed #432E1F',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <PixelIcon name="scroll" size={28} color="var(--bb-color-gold)" />
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-color-gold)',
              }}
            >
              BULLETIN BOARD IS CLEAR!
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                maxWidth: '420px',
              }}
            >
              No coding tasks or quests currently match your filter. Rest by the campfire or pin a new sprint challenge!
            </p>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleResetDefaults}
              style={{ fontSize: '8px', padding: '6px 12px', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <PixelIcon name="refresh" size={9} />
              <span>RESTORE DEFAULT QUESTS</span>
            </button>
          </div>
        )}

        {/* 7. Daily Quests Section */}
        {showDaily && filteredDaily.length > 0 && (
          <section
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            aria-label="Daily Coding Quests"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #432E1F',
                paddingBottom: '4px',
              }}
            >
              <PixelIcon name="sun" size={14} color="var(--bb-color-gold)" />
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-color-gold)',
                  letterSpacing: '0.5px',
                }}
              >
                DAILY SURVIVAL QUESTS ({filteredDaily.filter((q) => q.completed).length}/{filteredDaily.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredDaily.map((quest) => (
                <div
                  key={quest.id}
                  className="bb-panel-slab"
                  style={{
                    padding: '10px 14px',
                    background: quest.completed ? 'rgba(46, 204, 113, 0.08)' : '#261F18',
                    border: `1px solid ${quest.completed ? 'var(--bb-color-emerald)' : '#3F2C1F'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'border-color 120ms ease-out',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={quest.completed}
                    onChange={() => handleToggleQuest(quest.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--bb-color-emerald)',
                      cursor: 'pointer',
                      marginTop: '2px',
                    }}
                    id={`quest-chk-${quest.id}`}
                    aria-label={`Mark quest ${quest.title} as completed`}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <label
                        htmlFor={`quest-chk-${quest.id}`}
                        style={{
                          fontFamily: 'var(--bb-font-pixel-display)',
                          fontSize: '9px',
                          color: quest.completed ? 'var(--bb-color-emerald)' : 'var(--bb-text-primary)',
                          textDecoration: quest.completed ? 'line-through' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {quest.title}
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '8px',
                            color: 'var(--bb-color-gold)',
                            background: '#19140F',
                            border: '1px solid #432E1F',
                            padding: '2px 5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>+{quest.rewardXP} XP</span>
                          <PixelIcon name="coin" size={8} color="var(--bb-color-gold)" />
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuest(quest.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--bb-text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Remove quest"
                          aria-label={`Remove quest ${quest.title}`}
                        >
                          <PixelIcon name="trash" size={10} />
                        </button>
                      </div>
                    </div>

                    <p
                      style={{
                        margin: '4px 0 6px',
                        fontSize: '11px',
                        color: 'var(--bb-text-secondary)',
                      }}
                    >
                      {quest.description}
                    </p>

                    {/* Progress Bar within Quest */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: '#14110E',
                          border: '1px solid #3A281B',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(quest.progress / quest.maxProgress) * 100}%`,
                            background: quest.completed ? 'var(--bb-color-emerald)' : 'var(--bb-color-gold)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--bb-font-code)',
                          fontSize: '9px',
                          color: 'var(--bb-text-muted)',
                        }}
                      >
                        {quest.progress}/{quest.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Sprint Coding Tasks Section */}
        {showSprint && filteredSprint.length > 0 && (
          <section
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            aria-label="Sprint Coding Tasks"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #432E1F',
                paddingBottom: '4px',
              }}
            >
              <PixelIcon name="fast-forward" size={14} color="var(--bb-color-emerald)" />
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-color-emerald)',
                  letterSpacing: '0.5px',
                }}
              >
                SPRINT CODING TASKS ({filteredSprint.filter((t) => t.isCompleted).length}/{filteredSprint.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSprint.map((task) => (
                <div
                  key={task.id}
                  className="bb-panel-slab"
                  style={{
                    padding: '10px 14px',
                    background: task.isCompleted ? 'rgba(46, 204, 113, 0.08)' : '#261F18',
                    border: `1px solid ${task.isCompleted ? 'var(--bb-color-emerald)' : '#3F2C1F'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: task.isCompleted ? 0.75 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => handleToggleSprint(task.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--bb-color-emerald)',
                      cursor: 'pointer',
                    }}
                    id={`task-chk-${task.id}`}
                    aria-label={`Mark task ${task.title} as completed`}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label
                      htmlFor={`task-chk-${task.id}`}
                      style={{
                        fontFamily: 'var(--bb-font-body)',
                        fontSize: '12px',
                        color: task.isCompleted ? 'var(--bb-color-emerald)' : 'var(--bb-text-primary)',
                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      {task.title}
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {task.isCompleted ? (
                      <span
                        style={{
                          fontFamily: 'var(--bb-font-pixel-display)',
                          fontSize: '8px',
                          color: 'var(--bb-color-emerald)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>SLAYED</span>
                        <PixelIcon name="check" size={8} color="#2ECC71" />
                      </span>
                    ) : task.deadlineMinutes > 0 ? (
                      <span
                        style={{
                          fontFamily: 'var(--bb-font-code)',
                          fontSize: '10px',
                          color: task.deadlineMinutes <= 15 ? 'var(--bb-color-redstone)' : 'var(--bb-color-gold)',
                          background: '#16130F',
                          border: '1px solid #3F2C1F',
                          padding: '2px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <PixelIcon name="fast-forward" size={8} />
                        <span>{task.deadlineMinutes}m</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--bb-font-pixel-display)',
                          fontSize: '7px',
                          color: 'var(--bb-color-redstone)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>OVERDUE</span>
                        <PixelIcon name="lightning" size={8} color="var(--bb-color-redstone)" />
                      </span>
                    )}

                    {!task.isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleSnoozeSprint(task.id)}
                        style={{
                          background: '#19140F',
                          border: '1px solid #3F2C1F',
                          color: 'var(--bb-text-secondary)',
                          fontFamily: 'var(--bb-font-pixel-display)',
                          fontSize: '7px',
                          padding: '3px 6px',
                          cursor: 'pointer',
                        }}
                        title="Add 15 minutes to deadline"
                      >
                        +15M
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteSprint(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--bb-text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title="Delete sprint task"
                      aria-label={`Delete task ${task.title}`}
                    >
                      <PixelIcon name="trash" size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
