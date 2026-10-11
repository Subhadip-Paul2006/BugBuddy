import React, { useState, useMemo, useEffect } from 'react';
import { CanonicalLanguage, NavigationTab, ConfessionSource } from '../../types';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { PixelIcon } from '../common/PixelIcon';
import { getGraveyardOptIn, setGraveyardOptIn, saveGraveyardBugs } from '../../utils/storage';

export interface GraveyardBugEntry {
  id: string;
  title: string;
  language: CanonicalLanguage;
  category: string;
  slayedAt: string;
  xpAwarded: number;
  status: 'RESOLVED' | 'DIAGNOSED';
  isSeededExample?: boolean;
  diagnosis?: string;
  buggyCode?: string;
  fixedCode?: string;
  whyItWorks?: string;
  tests?: string;
  sources?: ConfessionSource[];
}

export interface BugGraveyardProps {
  initialBugs?: GraveyardBugEntry[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectLanguageForConfession?: (lang: CanonicalLanguage) => void;
}

export const DEFAULT_GRAVEYARD_BUGS: GraveyardBugEntry[] = [
  {
    id: 'bug-104',
    title: 'Segmentation fault: 11 (char *ptr = NULL dereference)',
    language: 'c',
    category: 'Memory Management',
    slayedAt: 'Canonical Reference Seed',
    xpAwarded: 50,
    status: 'RESOLVED',
    isSeededExample: true,
    diagnosis:
      'Attempted to write to an unallocated NULL pointer. In C, dereferencing a NULL pointer leads to immediate process termination (SIGSEGV) and undefined behavior.',
    buggyCode: `char *ptr = NULL;
*ptr = 'A'; // SIGSEGV crash!`,
    fixedCode: `char *ptr = (char *)malloc(16);
if (ptr != NULL) {
    *ptr = 'A';
    free(ptr);
}`,
    whyItWorks:
      'Allocating heap memory via malloc() and explicitly checking ptr != NULL guarantees memory validity before indirection.',
    tests: 'gcc -Wall -Werror main.c -o main && ./main',
    sources: [
      {
        title: 'ISO C11 Standard — §6.5.3.2 Address and indirection operators',
        url: 'https://en.cppreference.com/w/c/language/pointer',
        isPrimary: true,
      },
    ],
  },
  {
    id: 'bug-103',
    title: 'ConcurrentModificationException in EventBus listener loop',
    language: 'java',
    category: 'Concurrency',
    slayedAt: 'Canonical Reference Seed',
    xpAwarded: 75,
    status: 'RESOLVED',
    isSeededExample: true,
    diagnosis:
      'Modifying an ArrayList directly during an enhanced for-each iteration violates the fail-fast iterator contract, causing ConcurrentModificationException.',
    buggyCode: `for (EventListener listener : listeners) {
    if (listener.isDisposed()) {
        listeners.remove(listener); // CME panic!
    }
}`,
    fixedCode: `listeners.removeIf(EventListener::isDisposed);`,
    whyItWorks:
      'Collection.removeIf() manages the iterator safely internally or uses an explicit CopyOnWriteArrayList to prevent modification collisions.',
    tests: 'mvn test -Dtest=EventBusConcurrencyTest',
    sources: [
      {
        title: 'Oracle Java SE 17 — ConcurrentModificationException Specification',
        url: 'https://docs.oracle.com/javase/8/docs/api/java/util/ConcurrentModificationException.html',
        isPrimary: true,
      },
    ],
  },
  {
    id: 'bug-102',
    title: 'UnhandledPromiseRejection: Cannot read properties of undefined',
    language: 'typescript',
    category: 'Async Flow',
    slayedAt: 'Canonical Reference Seed',
    xpAwarded: 50,
    status: 'RESOLVED',
    isSeededExample: true,
    diagnosis:
      'Accessed nested properties on an unresolved Promise payload without awaiting the asynchronous operation or handling rejection.',
    buggyCode: `const userResponse = fetchUserData(userId);
console.log(userResponse.data.profile.username); // TypeError!`,
    fixedCode: `const userResponse = await fetchUserData(userId);
console.log(userResponse?.data?.profile?.username ?? 'Anonymous');`,
    whyItWorks:
      'Awaiting the Promise resolution and applying TypeScript optional chaining (?.) safeguards against unpopulated nested object graphs.',
    tests: 'npx vitest run user.service.test.ts',
    sources: [
      {
        title: 'TypeScript Official Handbook — Optional Chaining & Narrowing',
        url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
        isPrimary: true,
      },
    ],
  },
  {
    id: 'bug-101',
    title: 'UnboundLocalError: local variable referenced before assignment',
    language: 'python',
    category: 'Variable Scope',
    slayedAt: 'Canonical Reference Seed',
    xpAwarded: 50,
    status: 'RESOLVED',
    isSeededExample: true,
    diagnosis:
      'Python compiles functions with local scope resolution. Reassigning a module-level variable inside a function without the "global" keyword causes Python to treat it as local.',
    buggyCode: `counter = 0
def increment():
    counter += 1 # UnboundLocalError!`,
    fixedCode: `counter = 0
def increment():
    global counter
    counter += 1`,
    whyItWorks:
      'Declaring "global counter" instructs the bytecode compiler to bind writes to module scope rather than allocating an uninitialized local slot.',
    tests: 'pytest -v tests/test_counter.py',
    sources: [
      {
        title: 'Python 3 Execution Model — Naming and Binding',
        url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding',
        isPrimary: true,
      },
    ],
  },
];

export const BugGraveyard: React.FC<BugGraveyardProps> = ({
  initialBugs = DEFAULT_GRAVEYARD_BUGS,
  onNavigate,
  onSelectLanguageForConfession,
}) => {
  const [bugs, setBugs] = useState<GraveyardBugEntry[]>(initialBugs);
  const [selectedBug, setSelectedBug] = useState<GraveyardBugEntry | null>(null);
  const [isPersistOptIn, setIsPersistOptIn] = useState<boolean>(getGraveyardOptIn);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | CanonicalLanguage>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'RESOLVED' | 'DIAGNOSED'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'session' | 'seeded'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setBugs(initialBugs);
  }, [initialBugs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  const handleToggleOptIn = () => {
    const nextVal = !isPersistOptIn;
    setIsPersistOptIn(nextVal);
    setGraveyardOptIn(nextVal);
    if (nextVal) {
      saveGraveyardBugs(bugs);
      showToast('Opted in: Graveyard post-mortems will persist across reloads.');
    } else {
      showToast('Opted out: Cleared browser storage. History is now session-only.');
    }
  };

  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      if (originFilter === 'session' && bug.isSeededExample) {
        return false;
      }
      if (originFilter === 'seeded' && !bug.isSeededExample) {
        return false;
      }
      if (languageFilter !== 'all' && bug.language !== languageFilter) {
        return false;
      }
      if (statusFilter !== 'all' && bug.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = bug.title.toLowerCase().includes(query);
        const matchesCategory = bug.category.toLowerCase().includes(query);
        const matchesDiagnosis = bug.diagnosis?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesCategory && !matchesDiagnosis) {
          return false;
        }
      }
      return true;
    });
  }, [bugs, originFilter, languageFilter, statusFilter, searchQuery]);

  const handleClearHistory = () => {
    setBugs([]);
    setSelectedBug(null);
    if (isPersistOptIn) {
      saveGraveyardBugs([]);
    }
    showToast('Graveyard crypt purged.');
  };

  const handleResetHistory = () => {
    setBugs(initialBugs);
    setSelectedBug(null);
    showToast('Restored default session post-mortems.');
  };

  const handleReconfess = (bug: GraveyardBugEntry) => {
    onSelectLanguageForConfession?.(bug.language);
    onNavigate('confession');
  };

  return (
    <div
      className="bb-bug-graveyard-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
      }}
      aria-label="Bug Graveyard & Post-Mortem Archive"
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
          borderLeft: '4px solid var(--bb-mat-obsidian)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }} aria-hidden="true">🪦</span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: '#9B59B6',
                letterSpacing: '0.8px',
              }}
            >
              THE BUG GRAVEYARD
            </h1>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                background: 'rgba(155, 89, 182, 0.15)',
                color: '#9B59B6',
                border: '1px solid #9B59B6',
                padding: '2px 6px',
              }}
            >
              POST-MORTEM CRYPT
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Solemn memorial honoring resolved runtime crashes, slain syntax sins, and preserved code fixes.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('base-camp')}
            title="Return to Base Camp Dashboard"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="tent" size={10} /> BASE CAMP
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('chat')}
            title="Open Debugging Chat Workbench"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="chat" size={10} /> DEBUG CHAT
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={() => onNavigate('confession')}
            title="Slay another bug at the Confession Booth"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="swords" size={10} /> CONFESS A BUG
          </button>
        </div>
      </header>

      {/* 2. Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bb-panel-slab"
          style={{
            padding: '8px 14px',
            background: 'rgba(155, 89, 182, 0.15)',
            border: '1px solid #9B59B6',
            color: '#D2B4DE',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{toastMessage}</span>
          <PixelIcon name="tombstone" size={12} color="#D2B4DE" />
        </div>
      )}

      {/* 3. Session Storage Notice Banner */}
      <aside
        className="bb-panel-inset"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '3px solid var(--bb-color-gold)',
          background: 'rgba(241, 196, 15, 0.05)',
        }}
        aria-label="Session Memory Disclosure"
      >
        <PixelIcon name="shield" size={14} color="var(--bb-color-gold)" />
        <span
          style={{
            fontSize: '11px',
            color: 'var(--bb-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong>Session Scope Notice:</strong> Bug Graveyard records are archived in volatile session memory for this active debugging sprint and will reset upon browser reload. Post-mortems reflect real diagnostic data and verified language citations.
        </span>
      </aside>

      {/* 4. Filter Toolbar & Search Deck */}
      <section
        className="bb-panel-slab"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        aria-label="Graveyard Search and Filters"
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Keyword Search */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deceased bugs by error trace, title, or category..."
              style={{
                width: '100%',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
                color: 'var(--bb-text-primary)',
                fontFamily: 'var(--bb-font-code)',
                fontSize: '11px',
                padding: '8px 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Search graveyard bugs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              background: 'var(--bb-surface-inset)',
              border: '1px solid var(--bb-border-subtle)',
              color: 'var(--bb-text-primary)',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            aria-label="Filter by resolution status"
          >
            <option value="all">ALL STATUSES</option>
            <option value="RESOLVED">RESOLVED ONLY</option>
            <option value="DIAGNOSED">DIAGNOSED ONLY</option>
          </select>

          {/* Origin Filter */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            style={{
              background: 'var(--bb-surface-inset)',
              border: '1px solid var(--bb-border-subtle)',
              color: 'var(--bb-text-primary)',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            aria-label="Filter by record origin"
          >
            <option value="all">ALL ORIGINS</option>
            <option value="session">SESSION RESOLUTIONS ONLY</option>
            <option value="seeded">CANONICAL SEED ARCHIVES ONLY</option>
          </select>

          {/* Bulk Crypt Actions */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={isPersistOptIn ? 'bb-btn bb-btn-emerald' : 'bb-btn bb-btn-stone'}
              onClick={handleToggleOptIn}
              style={{ fontSize: '8px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title={
                isPersistOptIn
                  ? 'History persists across browser reloads. Click to switch to session-only.'
                  : 'History is session-only by default to protect code privacy. Click to enable local persistence.'
              }
            >
              <PixelIcon name="book" size={10} />
              <span>PERSIST: {isPersistOptIn ? 'STORAGE (ON)' : 'SESSION ONLY (OFF)'}</span>
            </button>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleClearHistory}
              style={{ fontSize: '8px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Clear graveyard records"
            >
              <PixelIcon name="broom" size={10} /> PURGE
            </button>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleResetHistory}
              style={{ fontSize: '8px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Restore default gravestones"
            >
              <PixelIcon name="refresh" size={10} /> RESTORE
            </button>
          </div>
        </div>

        {/* Language Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              color: 'var(--bb-text-muted)',
              marginRight: '4px',
            }}
          >
            LANGUAGE:
          </span>
          {(['all', 'c', 'cpp', 'java', 'python', 'javascript', 'typescript'] as const).map((lang) => {
            const isActive = languageFilter === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguageFilter(lang)}
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  padding: '4px 8px',
                  background: isActive ? 'var(--bb-surface-inset)' : 'var(--bb-surface-panel)',
                  border: `1px solid ${isActive ? '#9B59B6' : 'var(--bb-border-subtle)'}`,
                  color: isActive ? '#D2B4DE' : 'var(--bb-text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {lang !== 'all' && <LanguagePixelLogo language={lang} size={12} />}
                {lang.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Main Crypt Grid & Detail Inspector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedBug ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: '16px',
        }}
      >
        {/* Left / Main: Gravestone Tombstones Grid */}
        <section
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          aria-label="Gravestones List"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-text-muted)',
              }}
            >
              ARCHIVED POST-MORTEMS ({filteredBugs.length} OF {bugs.length})
            </span>
          </div>

          {filteredBugs.length === 0 ? (
            /* Empty State */
            <div
              className="bb-panel-inset"
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                border: '2px dashed #3D334D',
                background: '#131118',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '32px' }}>🪦</span>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '11px',
                  color: '#9B59B6',
                }}
              >
                THE CRYPT IS EMPTY
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--bb-text-secondary)',
                  maxWidth: '380px',
                }}
              >
                No slain bugs match your search filters. Slay code errors at the Confession Booth to consecrate new gravestones!
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="bb-btn bb-btn-emerald"
                  onClick={() => onNavigate('confession')}
                  style={{ fontSize: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <PixelIcon name="swords" size={10} /> CONSECRATE A BUG
                </button>
                <button
                  type="button"
                  className="bb-btn bb-btn-stone"
                  onClick={handleResetHistory}
                  style={{ fontSize: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <PixelIcon name="refresh" size={10} /> RESTORE DEFAULTS
                </button>
              </div>
            </div>
          ) : (
            /* Tombstones Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredBugs.map((bug) => {
                const isSelected = selectedBug?.id === bug.id;
                return (
                  <div
                    key={bug.id}
                    onClick={() => setSelectedBug(bug)}
                    className="bb-panel-slab"
                    style={{
                      padding: '14px',
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? '#9B59B6' : 'var(--bb-border-subtle)'}`,
                      boxShadow: isSelected ? '0 0 10px rgba(155, 89, 182, 0.35)' : undefined,
                      background: isSelected ? 'rgba(155, 89, 182, 0.08)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative',
                      transition: 'transform 80ms ease, border-color 80ms ease',
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedBug(bug);
                      }
                    }}
                    aria-label={`View post-mortem for ${bug.title}`}
                  >
                    {/* Gravestone Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LanguagePixelLogo language={bug.language} size={18} />
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '8px',
                            color: 'var(--bb-text-muted)',
                          }}
                        >
                          {bug.language.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '7px',
                            padding: '2px 5px',
                            background: bug.isSeededExample ? 'rgba(52, 152, 219, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                            color: bug.isSeededExample ? 'var(--bb-color-diamond)' : 'var(--bb-color-emerald)',
                            border: `1px solid ${bug.isSeededExample ? 'var(--bb-color-diamond)' : 'var(--bb-color-emerald)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <PixelIcon name={bug.isSeededExample ? 'book' : 'swords'} size={8} /> {bug.isSeededExample ? 'SEED' : 'SESSION'}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '7px',
                            padding: '2px 5px',
                            background: bug.status === 'RESOLVED' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                            color: bug.status === 'RESOLVED' ? 'var(--bb-color-emerald)' : 'var(--bb-color-gold)',
                            border: `1px solid ${bug.status === 'RESOLVED' ? 'var(--bb-color-emerald)' : 'var(--bb-color-gold)'}`,
                          }}
                        >
                          {bug.status}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '7px',
                            color: 'var(--bb-color-gold)',
                          }}
                        >
                          +{bug.xpAwarded} XP
                        </span>
                      </div>
                    </div>

                    {/* Bug Title */}
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: 'var(--bb-font-body)',
                        fontSize: '13px',
                        lineHeight: 1.3,
                        color: 'var(--bb-text-primary)',
                      }}
                    >
                      {bug.title}
                    </h3>

                    {/* Footer Info */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '10px',
                        color: 'var(--bb-text-muted)',
                        borderTop: '1px solid var(--bb-border-subtle)',
                        paddingTop: '6px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <PixelIcon name="scroll" size={9} /> {bug.category}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <PixelIcon name="star" size={9} /> {bug.slayedAt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Selected Post-Mortem Inspector Epitaph */}
        {selectedBug && (
          <aside
            className="bb-panel-slab"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '2px solid #9B59B6',
            }}
            aria-label="Post-Mortem Epitaph Details"
          >
            {/* Inspector Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LanguagePixelLogo language={selectedBug.language} size={18} />
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      color: '#9B59B6',
                    }}
                  >
                    EPITAPH [{selectedBug.id.toUpperCase()}]
                  </span>
                </div>
                <h2
                  style={{
                    margin: '6px 0 2px',
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '11px',
                    color: 'var(--bb-text-primary)',
                    lineHeight: 1.4,
                  }}
                >
                  {selectedBug.title}
                </h2>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--bb-text-muted)',
                  }}
                >
                  Slayed: {selectedBug.slayedAt} • Awarded: +{selectedBug.xpAwarded} XP • {selectedBug.isSeededExample ? 'Canonical Seed' : 'User Session'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBug(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--bb-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px',
                }}
                title="Close epitaph"
                aria-label="Close epitaph"
              >
                <PixelIcon name="cross" size={10} />
              </button>
            </div>

            {/* Diagnosis Post-Mortem */}
            {selectedBug.diagnosis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-gold)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="scroll" size={10} color="var(--bb-color-gold)" /> POST-MORTEM ROOT CAUSE
                </span>
                <p
                  className="bb-panel-inset"
                  style={{
                    margin: 0,
                    padding: '10px',
                    fontSize: '11px',
                    color: 'var(--bb-text-primary)',
                    lineHeight: 1.4,
                  }}
                >
                  {selectedBug.diagnosis}
                </p>
              </div>
            )}

            {/* Code Diff: Buggy vs Fixed */}
            {selectedBug.buggyCode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-redstone)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="skull" size={10} color="var(--bb-color-redstone)" /> FATAL SIN (ORIGINAL OFFERING)
                </span>
                <pre
                  className="bb-panel-inset"
                  style={{
                    margin: 0,
                    padding: '8px 10px',
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-text-code-red)',
                    overflowX: 'auto',
                    borderLeft: '3px solid var(--bb-color-redstone)',
                  }}
                >
                  <code>{selectedBug.buggyCode}</code>
                </pre>
              </div>
            )}

            {selectedBug.fixedCode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  <PixelIcon name="star" size={10} color="var(--bb-color-emerald)" /> CONSECRATED RESOLUTION
                </span>
                <pre
                  className="bb-panel-inset"
                  style={{
                    margin: 0,
                    padding: '8px 10px',
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-text-code-green)',
                    overflowX: 'auto',
                    borderLeft: '3px solid var(--bb-color-emerald)',
                  }}
                >
                  <code>{selectedBug.fixedCode}</code>
                </pre>
              </div>
            )}

            {/* Why It Works */}
            {selectedBug.whyItWorks && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-diamond)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="shield" size={10} color="var(--bb-color-diamond)" /> WHY THE PATCH PREVENTS REGRESSIONS
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: 'var(--bb-text-secondary)',
                    lineHeight: 1.4,
                  }}
                >
                  {selectedBug.whyItWorks}
                </p>
              </div>
            )}

            {/* Regression Verification Command */}
            {selectedBug.tests && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="book" size={10} color="var(--bb-color-gold)" /> VERIFICATION TEST COMMAND
                </span>
                <div
                  className="bb-panel-inset"
                  style={{
                    padding: '6px 10px',
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-color-gold)',
                  }}
                >
                  <code>$ {selectedBug.tests}</code>
                </div>
              </div>
            )}

            {/* Grounded Source Attributions */}
            {selectedBug.sources && selectedBug.sources.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="book" size={10} color="var(--bb-color-diamond)" /> GROUNDED CANONICAL CITATIONS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedBug.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '11px',
                        color: 'var(--bb-color-diamond)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PixelIcon name="scroll" size={10} color="var(--bb-color-diamond)" /> {source.title || source.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="bb-btn bb-btn-emerald"
                onClick={() => handleReconfess(selectedBug)}
                style={{ fontSize: '8px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <PixelIcon name="swords" size={10} /> RE-CONFESS IN BOOTH
              </button>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={() => setSelectedBug(null)}
                style={{ fontSize: '8px', padding: '8px 12px' }}
              >
                CLOSE EPITAPH
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
