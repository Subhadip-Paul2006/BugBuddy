import React, { useState, useMemo } from 'react';
import { CanonicalLanguage, NavigationTab } from '../../types';
import { ALL_CORPUS_ENTRIES, knowledgeIndex } from '../../services/knowledgeService';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import type { NormalizedKnowledgeRecord } from '../../knowledge/types';

export interface KnowledgeCodexProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectSnippetForConfession?: (code: string, lang: CanonicalLanguage) => void;
}

export const KnowledgeCodex: React.FC<KnowledgeCodexProps> = ({
  onNavigate,
  onSelectSnippetForConfession,
}) => {
  const [query, setQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | CanonicalLanguage>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Dynamically extract categories present in the genuine corpus
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const entry of ALL_CORPUS_ENTRIES) {
      if (entry.category) cats.add(entry.category);
    }
    return Array.from(cats).sort();
  }, []);

  // Execute BM25 search across the genuine knowledge index
  const searchResults = useMemo(() => {
    const filterOptions: Record<string, string> = {};
    if (selectedLanguage !== 'all') {
      filterOptions.language = selectedLanguage;
    }
    if (selectedCategory !== 'all') {
      filterOptions.category = selectedCategory;
    }
    if (selectedDifficulty !== 'all') {
      filterOptions.difficulty = selectedDifficulty;
    }

    const res = knowledgeIndex.search(query, {
      filter: Object.keys(filterOptions).length > 0 ? (filterOptions as any) : undefined,
      limit: 60,
      minScore: query.trim() ? 0.05 : 0.001,
    });

    return res.results;
  }, [query, selectedLanguage, selectedCategory, selectedDifficulty]);

  // Selected record details lookup
  const selectedRecord: NormalizedKnowledgeRecord | null = useMemo(() => {
    if (!selectedRecordId) return null;
    const found = ALL_CORPUS_ENTRIES.find((e) => e.id === selectedRecordId);
    if (!found) return null;
    return found as NormalizedKnowledgeRecord;
  }, [selectedRecordId]);

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(label);
      setTimeout(() => setCopiedSnippet(null), 1800);
    }
  };

  const handleTestInConfession = (record: NormalizedKnowledgeRecord) => {
    onSelectSnippetForConfession?.(record.badExample, record.language);
    onNavigate('confession');
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedLanguage('all');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
  };

  return (
    <div
      className="bb-knowledge-codex-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
      }}
      aria-label="Knowledge Codex Grounded Language Standards"
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
          borderLeft: '4px solid var(--bb-color-diamond)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }} aria-hidden="true">📖</span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: 'var(--bb-color-diamond)',
                letterSpacing: '0.8px',
              }}
            >
              THE KNOWLEDGE CODEX
            </h1>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                background: 'rgba(52, 152, 219, 0.15)',
                color: 'var(--bb-color-diamond)',
                border: '1px solid var(--bb-color-diamond)',
                padding: '2px 6px',
              }}
            >
              CURATED SPECIFICATIONS
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Verified offline library of 60 standard compiler specifications, memory models, and canonical documentation citations.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('base-camp')}
            title="Return to Base Camp Dashboard"
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            🏕️ BASE CAMP
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onNavigate('chat')}
            title="Discuss concepts in Debugging Chat"
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            💬 DEBUG CHAT
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={() => onNavigate('confession')}
            title="Test a code snippet in the Confession Booth"
            style={{ fontSize: '9px', padding: '6px 12px' }}
          >
            ⚔️ CONFESS A BUG
          </button>
        </div>
      </header>

      {/* 2. Epistemic Disclosure Banner */}
      <aside
        className="bb-panel-inset"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '3px solid var(--bb-color-diamond)',
          background: 'rgba(52, 152, 219, 0.05)',
        }}
        aria-label="Codex Nature Disclosure"
      >
        <span style={{ fontSize: '14px' }}>🛡️</span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--bb-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong>Curated Offline Reference:</strong> These scrolls are sourced from verified compiler standards (ISO C++, Java SE, Python 3, ECMA) and indexed with deterministic BM25 search. They represent permanent language truths, distinct from live diagnosis results.
        </span>
      </aside>

      {/* 3. Search Bar and Filter Controls */}
      <section
        className="bb-panel-slab"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        aria-label="Codex Search and Filter Panel"
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Keyword Search Input */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search codex by concept, keyword, symptom, or error (e.g. pointer, borrow, async)..."
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
              aria-label="Search knowledge codex"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              background: 'var(--bb-surface-inset)',
              border: '1px solid var(--bb-border-subtle)',
              color: 'var(--bb-text-primary)',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            aria-label="Filter by category"
          >
            <option value="all">ALL CATEGORIES</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase().replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              background: 'var(--bb-surface-inset)',
              border: '1px solid var(--bb-border-subtle)',
              color: 'var(--bb-text-primary)',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            aria-label="Filter by difficulty"
          >
            <option value="all">ALL DIFFICULTIES</option>
            <option value="beginner">BEGINNER</option>
            <option value="intermediate">INTERMEDIATE</option>
            <option value="advanced">ADVANCED</option>
          </select>

          {/* Reset Action */}
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={handleResetFilters}
            style={{ fontSize: '8px', padding: '6px 12px' }}
            title="Clear all codex search filters"
          >
            🔄 RESET
          </button>
        </div>

        {/* Language Tabs */}
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
            const isActive = selectedLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  padding: '4px 8px',
                  background: isActive ? 'var(--bb-surface-inset)' : 'var(--bb-surface-panel)',
                  border: `1px solid ${isActive ? 'var(--bb-color-diamond)' : 'var(--bb-border-subtle)'}`,
                  color: isActive ? 'var(--bb-color-diamond)' : 'var(--bb-text-secondary)',
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

      {/* 4. Two-Column Layout: Scroll Catalog & Reader Pane */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedRecord ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: '16px',
        }}
      >
        {/* Left: Scroll Catalog List */}
        <section
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          aria-label="Codex Scrolls List"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-text-muted)',
              }}
            >
              INDEXED SCROLLS ({searchResults.length} OF {ALL_CORPUS_ENTRIES.length})
              {query.trim() && ' [BM25 RANKED]'}
            </span>
          </div>

          {searchResults.length === 0 ? (
            /* Empty State */
            <div
              className="bb-panel-inset"
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                border: '2px dashed #2A3648',
                background: '#0F1318',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '32px' }}>📜</span>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '11px',
                  color: 'var(--bb-color-diamond)',
                }}
              >
                NO MATCHING CODEX SCROLLS FOUND
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--bb-text-secondary)',
                  maxWidth: '380px',
                }}
              >
                No language specification scrolls matched your query &ldquo;{query}&rdquo;. Try using broader terms or clearing language and category filters.
              </p>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={handleResetFilters}
                style={{ fontSize: '8px', padding: '6px 12px', marginTop: '6px' }}
              >
                🔄 RESET FILTERS
              </button>
            </div>
          ) : (
            /* Scrolls Catalog Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {searchResults.map((item) => {
                const record = item.record;
                const isSelected = selectedRecordId === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className="bb-panel-slab"
                    style={{
                      padding: '14px',
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? 'var(--bb-color-diamond)' : 'var(--bb-border-subtle)'}`,
                      boxShadow: isSelected ? '0 0 10px rgba(52, 152, 219, 0.35)' : undefined,
                      background: isSelected ? 'rgba(52, 152, 219, 0.08)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 80ms ease, border-color 80ms ease',
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedRecordId(record.id);
                      }
                    }}
                    aria-label={`Read codex entry for ${record.title}`}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LanguagePixelLogo language={record.language} size={18} />
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '8px',
                            color: 'var(--bb-text-muted)',
                          }}
                        >
                          {record.language.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '7px',
                            padding: '2px 5px',
                            background: 'var(--bb-surface-inset)',
                            color: 'var(--bb-color-diamond)',
                            border: '1px solid var(--bb-border-subtle)',
                          }}
                        >
                          {record.difficulty.toUpperCase()}
                        </span>
                        {item.score > 0 && query.trim() && (
                          <span
                            style={{
                              fontFamily: 'var(--bb-font-code)',
                              fontSize: '8px',
                              color: 'var(--bb-color-gold)',
                            }}
                          >
                            BM25: {item.score.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scroll Title */}
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: 'var(--bb-font-body)',
                        fontSize: '13px',
                        lineHeight: 1.3,
                        color: 'var(--bb-text-primary)',
                      }}
                    >
                      {record.title}
                    </h3>

                    {/* Symptoms Teaser */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        color: 'var(--bb-text-secondary)',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {record.symptoms}
                    </p>

                    {/* Tags Chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                      {record.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '9px',
                            color: 'var(--bb-text-muted)',
                            background: 'var(--bb-surface-inset)',
                            padding: '1px 5px',
                            border: '1px solid var(--bb-border-subtle)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Selected Scroll Reader Tome Pane */}
        {selectedRecord && (
          <aside
            className="bb-panel-slab"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '2px solid var(--bb-color-diamond)',
            }}
            aria-label="Selected Codex Scroll Reader"
          >
            {/* Scroll Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LanguagePixelLogo language={selectedRecord.language} size={18} />
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      color: 'var(--bb-color-diamond)',
                    }}
                  >
                    CODEX RECORD [{selectedRecord.id}]
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
                  {selectedRecord.title}
                </h2>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--bb-text-muted)',
                  }}
                >
                  Category: {selectedRecord.category.replace(/_/g, ' ')} • Difficulty: {selectedRecord.difficulty}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecordId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--bb-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px',
                }}
                title="Close scroll reader"
                aria-label="Close scroll reader"
              >
                ✕
              </button>
            </div>

            {/* Companion Snark / Roast Warning */}
            {selectedRecord.roast && (
              <blockquote
                className="bb-panel-inset"
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  fontStyle: 'italic',
                  fontSize: '11px',
                  color: 'var(--bb-color-gold)',
                  borderLeft: '3px solid var(--bb-color-gold)',
                  lineHeight: 1.4,
                }}
              >
                🔥 ByteBuddy: &ldquo;{selectedRecord.roast}&rdquo;
              </blockquote>
            )}

            {/* Symptoms Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-redstone)',
                }}
              >
                ⚠️ IDENTIFIED SYMPTOMS
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--bb-text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {selectedRecord.symptoms}
              </p>
            </div>

            {/* Root Cause Diagnosis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-diamond)',
                }}
              >
                🔬 COMPILER SPECIFICATION & ROOT CAUSE
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
                {selectedRecord.diagnosis}
              </p>
            </div>

            {/* Debugging Steps Checklist */}
            {selectedRecord.debuggingSteps && selectedRecord.debuggingSteps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-gold)',
                  }}
                >
                  📋 DEBUGGING ACTION CHECKLIST
                </span>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '11px',
                    color: 'var(--bb-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedRecord.debuggingSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Buggy vs Fixed Code Examples */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      color: 'var(--bb-color-redstone)',
                    }}
                  >
                    💀 FLAWED IMPLEMENTATION
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRecord.badExample, 'bad')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--bb-text-muted)',
                      fontSize: '9px',
                      fontFamily: 'var(--bb-font-code)',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedSnippet === 'bad' ? '✓ COPIED' : '📋 COPY'}
                  </button>
                </div>
                <pre
                  className="bb-panel-inset"
                  style={{
                    margin: '4px 0 0',
                    padding: '8px 10px',
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-text-code-red)',
                    overflowX: 'auto',
                    borderLeft: '3px solid var(--bb-color-redstone)',
                  }}
                >
                  <code>{selectedRecord.badExample}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      color: 'var(--bb-color-emerald)',
                    }}
                  >
                    ✨ CANONICAL RESOLUTION
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRecord.fixedExample, 'fixed')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--bb-text-muted)',
                      fontSize: '9px',
                      fontFamily: 'var(--bb-font-code)',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedSnippet === 'fixed' ? '✓ COPIED' : '📋 COPY'}
                  </button>
                </div>
                <pre
                  className="bb-panel-inset"
                  style={{
                    margin: '4px 0 0',
                    padding: '8px 10px',
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-text-code-green)',
                    overflowX: 'auto',
                    borderLeft: '3px solid var(--bb-color-emerald)',
                  }}
                >
                  <code>{selectedRecord.fixedExample}</code>
                </pre>
              </div>
            </div>

            {/* Why It Works */}
            {selectedRecord.whyItWorks && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-color-diamond)',
                  }}
                >
                  🛡️ WHY THE FIX OPERATES CORRECTLY
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: 'var(--bb-text-secondary)',
                    lineHeight: 1.4,
                  }}
                >
                  {selectedRecord.whyItWorks}
                </p>
              </div>
            )}

            {/* Regression Test Command */}
            {selectedRecord.tests && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-text-muted)',
                  }}
                >
                  🧪 VERIFICATION TEST COMMAND
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
                  <code>$ {selectedRecord.tests}</code>
                </div>
              </div>
            )}

            {/* Grounded Source Attributions */}
            {selectedRecord.sources && selectedRecord.sources.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    color: 'var(--bb-text-muted)',
                  }}
                >
                  📖 GROUNDED CANONICAL CITATIONS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedRecord.sources.map((source, idx) => (
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
                      🔗 {source.title || source.url}
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
                onClick={() => handleTestInConfession(selectedRecord)}
                style={{ fontSize: '8px', padding: '8px 12px' }}
              >
                ⚔️ TEST IN CONFESSION BOOTH
              </button>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={() => setSelectedRecordId(null)}
                style={{ fontSize: '8px', padding: '8px 12px' }}
              >
                CLOSE SCROLL
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
