import React, { useState } from 'react';
import { ConfessionResult } from '../../types';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { PixelIcon } from '../common/PixelIcon';

export interface JudgmentTerminalProps {
  result: ConfessionResult;
  onReset: () => void;
  onVerifyAndResolve?: (result: ConfessionResult) => void;
  isResolved?: boolean;
}

export const JudgmentTerminal: React.FC<JudgmentTerminalProps> = ({
  result,
  onReset,
  onVerifyAndResolve,
  isResolved = false,
}) => {
  const [localResolved, setLocalResolved] = useState<boolean>(isResolved);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'fixed-only' | 'minimal-diff'>('side-by-side');

  const handleResolve = () => {
    if (localResolved || isResolved) return;
    setLocalResolved(true);
    onVerifyAndResolve?.(result);
  };

  const handleCopyCode = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(label);
        setTimeout(() => setCopyFeedback(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyFeedback(label);
        setTimeout(() => setCopyFeedback(null), 2000);
      }
    } catch (err) {
      setCopyFeedback('Copy failed — please select manually');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  return (
    <div
      className="bb-panel-slab"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: '3px solid #2B213A',
        boxShadow: '0 0 16px rgba(0,0,0,0.8), inset 2px 2px 0 #3D4353',
        background: 'linear-gradient(180deg, #181A22 0%, #12141A 100%)',
      }}
    >
      {/* Terminal Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '2px solid var(--bb-border-subtle)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PixelIcon name="scales" size={24} />
          <div>
            <h2
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '12px',
                color: 'var(--bb-color-gold)',
                margin: 0,
                letterSpacing: '0.5px',
              }}
            >
              CODEX JUDGMENT TERMINAL
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span
                className="bb-tag-lang"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                }}
              >
                <LanguagePixelLogo language={result.language} size={14} />
                {result.language.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '11px',
                  color: 'var(--bb-text-secondary)',
                }}
              >
                ID: {result.id} • Category: <strong style={{ color: 'var(--bb-color-diamond)' }}>{result.category}</strong>
              </span>
              {result.responseMode && (
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--bb-font-pixel-display)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    backgroundColor:
                      result.responseMode === 'DIRECT_MATCH'
                        ? 'rgba(46, 204, 113, 0.2)'
                        : result.responseMode === 'RELATED_GUIDANCE'
                        ? 'rgba(0, 188, 212, 0.2)'
                        : result.responseMode === 'AMBIGUOUS_EVIDENCE'
                        ? 'rgba(241, 196, 15, 0.2)'
                        : 'rgba(149, 165, 166, 0.2)',
                    color:
                      result.responseMode === 'DIRECT_MATCH'
                        ? 'var(--bb-color-emerald)'
                        : result.responseMode === 'RELATED_GUIDANCE'
                        ? 'var(--bb-color-diamond)'
                        : result.responseMode === 'AMBIGUOUS_EVIDENCE'
                        ? 'var(--bb-color-gold)'
                        : 'var(--bb-text-muted)',
                    border: `1px solid ${
                      result.responseMode === 'DIRECT_MATCH'
                        ? 'var(--bb-color-emerald)'
                        : result.responseMode === 'RELATED_GUIDANCE'
                        ? 'var(--bb-color-diamond)'
                        : result.responseMode === 'AMBIGUOUS_EVIDENCE'
                        ? 'var(--bb-color-gold)'
                        : 'var(--bb-border-subtle)'
                    }`,
                  }}
                >
                  {result.responseMode === 'DIRECT_MATCH' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <PixelIcon name="star" size={10} />
                      <span>DIRECT MATCH</span>
                    </span>
                  ) : result.responseMode === 'RELATED_GUIDANCE' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <PixelIcon name="lamp" size={10} />
                      <span>RELATED GUIDANCE</span>
                    </span>
                  ) : result.responseMode === 'AMBIGUOUS_EVIDENCE' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <PixelIcon name="scales" size={10} />
                      <span>AMBIGUOUS EVIDENCE</span>
                    </span>
                  ) : (
                    'NO MATCH'
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onVerifyAndResolve && (
            <button
              type="button"
              className={localResolved || isResolved ? 'bb-btn bb-btn-stone' : 'bb-btn bb-btn-emerald'}
              onClick={handleResolve}
              disabled={localResolved || isResolved}
              style={{
                fontSize: '9px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: localResolved || isResolved ? 'none' : '0 0 10px rgba(46, 204, 113, 0.4)',
              }}
            >
              {localResolved || isResolved ? (
                <>
                  <PixelIcon name="check" size={10} color="#2ECC71" />
                  <span>BUG VERIFIED & RESOLVED (+50 XP CLAIMED)</span>
                </>
              ) : (
                <>
                  <PixelIcon name="swords" size={10} />
                  <span>VERIFY FIX & MARK RESOLVED (+50 XP)</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={onReset}
            style={{
              fontSize: '9px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PixelIcon name="refresh" size={10} />
            <span>CONFESS ANOTHER BUG</span>
          </button>
        </div>
      </div>

      {/* Resolution Celebration Banner */}
      {localResolved && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(46, 204, 113, 0.15)',
            border: '2px solid var(--bb-color-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <PixelIcon name="trophy" size={24} color="var(--bb-color-gold)" />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '10px',
                color: 'var(--bb-color-emerald)',
              }}
            >
              BUG SLAIN & VERIFIED! +50 XP AWARDED!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--bb-text-primary)' }}>
              Fix verified against test criteria and recorded in the Bug Graveyard archive.
            </div>
          </div>
        </div>
      )}

      {/* Demo Fallback Notice Banner */}
      {result.isDemo && (
        <div
          role="note"
          aria-label="Demonstration Fallback Notice"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(241, 196, 15, 0.1)',
            border: '2px dashed var(--bb-color-gold)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PixelIcon name="lightning" size={20} color="var(--bb-color-gold)" />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-gold)',
                marginBottom: '2px',
              }}
            >
              DEMONSTRATION RESULT (SIMULATED FALLBACK)
            </div>
            <div
              style={{
                fontFamily: 'var(--bb-font-body)',
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                lineHeight: 1.3,
              }}
            >
              {result.demoDisclaimer || 'This diagnosis is a simulated demonstration for interface testing.'}
            </div>
          </div>
        </div>
      )}

      {/* AI-Assisted Grounded Diagnosis Banner */}
      {!result.isDemo && result.providerId && result.providerId !== 'deterministic-fallback' && (
        <div
          role="note"
          aria-label="AI-Assisted Grounded Diagnosis Notice"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(155, 89, 182, 0.15)',
            border: '2px solid var(--bb-color-amethyst)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PixelIcon name="lightning" size={20} color="var(--bb-color-amethyst)" />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-amethyst)',
                marginBottom: '2px',
              }}
            >
              AI-ASSISTED GROUNDED DIAGNOSIS ({result.providerId.toUpperCase()}{result.modelId ? ` • ${result.modelId}` : ''})
            </div>
            <div
              style={{
                fontFamily: 'var(--bb-font-body)',
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                lineHeight: 1.3,
              }}
            >
              Grounded in BugBuddy curated records ({result.matchedKnowledgeIds?.join(', ') || result.id}). Citations are verified against authentic documentation.
              {result.executionTimeMs ? ` Completed in ${result.executionTimeMs}ms.` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Deterministic Fallback Notice Banner */}
      {!result.isDemo && (result.usedFallback || result.providerId === 'deterministic-fallback') && (
        <div
          role="note"
          aria-label="Deterministic Fallback Notice"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(52, 152, 219, 0.12)',
            border: '2px solid var(--bb-color-lapis)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PixelIcon name="scroll" size={20} color="var(--bb-color-lapis)" />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-lapis)',
                marginBottom: '2px',
              }}
            >
              DETERMINISTIC RETRIEVAL FALLBACK (STAGE 4 ENGINE)
            </div>
            <div
              style={{
                fontFamily: 'var(--bb-font-body)',
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                lineHeight: 1.3,
              }}
            >
              Diagnosis served via offline curated knowledge pattern matching ({result.id}). Authentic citations and verified fix patterns applied without external AI inference.
            </div>
          </div>
        </div>
      )}

      {/* Standard Curated Grounding (when neither AI nor fallback specified) */}
      {!result.isDemo && !result.providerId && !result.usedFallback && (
        <div
          role="note"
          aria-label="Curated Knowledge Grounding Notice"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(38, 166, 154, 0.12)',
            border: '2px solid var(--bb-color-diamond)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PixelIcon name="scroll" size={20} />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-diamond)',
                marginBottom: '2px',
              }}
            >
              VERIFIED CURATED KNOWLEDGE RETRIEVAL
            </div>
            <div
              style={{
                fontFamily: 'var(--bb-font-body)',
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                lineHeight: 1.3,
              }}
            >
              This diagnosis is grounded in verified BugBuddy knowledge record <code>{result.id}</code> ({result.language.toUpperCase()}). Citations and verification tests are anchored to canonical documentation.
            </div>
          </div>
        </div>
      )}

      {/* SECTION A: BugBuddy Roast */}
      <section
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          padding: '14px',
          backgroundColor: '#1E1B26',
          border: '2px solid #3B2A59',
          boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            filter: 'drop-shadow(0 0 6px rgba(241, 196, 15, 0.4))',
          }}
        >
          <PixelIcon name="paw" size={24} />
          <PixelIcon name="flame" size={24} className="bb-anim-fire" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '9px',
              color: 'var(--bb-color-fire-glow)',
              marginBottom: '6px',
            }}
          >
            BYTEBUDDY'S ROAST:
          </div>
          <blockquote
            style={{
              margin: 0,
              fontFamily: 'var(--bb-font-pixel-sub)',
              fontSize: '18px',
              color: 'var(--bb-text-white)',
              lineHeight: 1.3,
              fontStyle: 'normal',
            }}
          >
            "{result.roast}"
          </blockquote>
        </div>
      </section>

      {/* SECTION B: Diagnosis & Root Cause */}
      <section className="bb-panel-inset" style={{ padding: '16px' }}>
        <h3
          style={{
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '10px',
            color: 'var(--bb-color-diamond)',
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PixelIcon name="eye" size={12} />
          <span>DIAGNOSIS: {result.title}</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: 1.5 }}>
          <div>
            <strong style={{ color: 'var(--bb-color-redstone)', fontFamily: 'var(--bb-font-code)' }}>
              Observed Symptoms:
            </strong>{' '}
            <span style={{ color: 'var(--bb-text-primary)' }}>{result.symptoms}</span>
          </div>

          <div>
            <strong style={{ color: 'var(--bb-color-gold)', fontFamily: 'var(--bb-font-code)' }}>
              Root Cause:
            </strong>{' '}
            <span style={{ color: 'var(--bb-text-primary)' }}>{result.diagnosis}</span>
          </div>

          {result.whyItWorks && (
            <div>
              <strong style={{ color: 'var(--bb-color-emerald)', fontFamily: 'var(--bb-font-code)' }}>
                Remediation Rationale:
              </strong>{' '}
              <span style={{ color: 'var(--bb-text-primary)' }}>{result.whyItWorks}</span>
            </div>
          )}

          {/* Debugging Steps */}
          {result.debuggingSteps && result.debuggingSteps.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-text-secondary)',
                  marginBottom: '6px',
                }}
              >
                RECOMMENDED INVESTIGATION STEPS:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--bb-text-primary)' }}>
                {result.debuggingSteps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* SECTION C: Suggested Fix (Before vs After) */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="gear" size={14} />
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '10px',
                color: 'var(--bb-color-emerald)',
              }}
            >
              SUGGESTED CODEX REMEDY
            </span>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`bb-btn bb-btn-stone ${activeTab === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setActiveTab('side-by-side')}
              style={{ padding: '4px 8px', fontSize: '8px' }}
            >
              BEFORE vs AFTER
            </button>
            <button
              type="button"
              className={`bb-btn bb-btn-stone ${activeTab === 'fixed-only' ? 'active' : ''}`}
              onClick={() => setActiveTab('fixed-only')}
              style={{ padding: '4px 8px', fontSize: '8px' }}
            >
              FIXED CODE ONLY
            </button>
            {result.minimalDiff && (
              <button
                type="button"
                className={`bb-btn bb-btn-stone ${activeTab === 'minimal-diff' ? 'active' : ''}`}
                onClick={() => setActiveTab('minimal-diff')}
                style={{ padding: '4px 8px', fontSize: '8px' }}
              >
                MINIMAL DIFF
              </button>
            )}
          </div>
        </div>

        {activeTab === 'side-by-side' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Buggy / Bad Example */}
            <div
              className="bb-panel-inset"
              style={{
                padding: '12px',
                background: '#140E0E',
                border: '1px solid #4D1A1A',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  borderBottom: '1px solid rgba(229,57,53,0.3)',
                  paddingBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '9px',
                    color: 'var(--bb-color-redstone)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PixelIcon name="cross" size={10} color="var(--bb-color-redstone)" />
                  <span>CURSED (BUGGY)</span>
                </span>
                <button
                  type="button"
                  className="bb-btn bb-btn-stone"
                  onClick={() => handleCopyCode(result.buggyCode, 'buggy')}
                  style={{ padding: '2px 6px', fontSize: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {copyFeedback === 'buggy' ? (
                    <>
                      <PixelIcon name="check" size={8} color="#2ECC71" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <PixelIcon name="clipboard" size={8} />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '12px',
                  color: 'var(--bb-text-code-red)',
                  overflowX: 'auto',
                  lineHeight: 1.4,
                  whiteSpace: 'pre',
                }}
              >
                {result.buggyCode}
              </pre>
            </div>

            {/* Fixed / Remedy Example */}
            <div
              className="bb-panel-inset"
              style={{
                padding: '12px',
                background: '#0B150F',
                border: '1px solid #144626',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  borderBottom: '1px solid rgba(46,204,113,0.3)',
                  paddingBottom: '4px',
                }}
              >
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
                  <PixelIcon name="check" size={10} color="var(--bb-color-emerald)" />
                  <span>SANCTIFIED (FIXED)</span>
                </span>
                <button
                  type="button"
                  className="bb-btn bb-btn-emerald"
                  onClick={() => handleCopyCode(result.fixedCode, 'fixed')}
                  style={{ padding: '2px 8px', fontSize: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {copyFeedback === 'fixed' ? (
                    <>
                      <PixelIcon name="check" size={8} color="#2ECC71" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <PixelIcon name="clipboard" size={8} />
                      <span>COPY FIX</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '12px',
                  color: 'var(--bb-text-code-green)',
                  overflowX: 'auto',
                  lineHeight: 1.4,
                  whiteSpace: 'pre',
                }}
              >
                {result.fixedCode}
              </pre>
            </div>
          </div>
        ) : activeTab === 'minimal-diff' && result.minimalDiff ? (
          <div
            className="bb-panel-inset"
            style={{
              padding: '14px',
              background: '#0F121B',
              border: '2px solid var(--bb-color-amethyst)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-color-amethyst)',
                }}
              >
                MINIMAL SURGICAL DIFF
              </span>
              <button
                type="button"
                className="bb-btn bb-btn-amethyst"
                onClick={() => handleCopyCode(result.minimalDiff || '', 'diff-copy')}
                style={{ padding: '6px 12px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {copyFeedback === 'diff-copy' ? (
                  <>
                    <PixelIcon name="check" size={10} color="#2ECC71" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <PixelIcon name="clipboard" size={10} />
                    <span>COPY DIFF</span>
                  </>
                )}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-code)',
                fontSize: '13px',
                color: 'var(--bb-color-gold)',
                overflowX: 'auto',
                lineHeight: 1.5,
                whiteSpace: 'pre',
              }}
            >
              {result.minimalDiff}
            </pre>
          </div>
        ) : (
          <div
            className="bb-panel-inset"
            style={{
              padding: '14px',
              background: '#0B150F',
              border: '2px solid var(--bb-color-emerald-shadow)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-color-emerald)',
                }}
              >
                COMPLETE FIXED CODE SOLUTION
              </span>
              <button
                type="button"
                className="bb-btn bb-btn-emerald"
                onClick={() => handleCopyCode(result.fixedCode, 'fixed-solo')}
                style={{ padding: '6px 12px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {copyFeedback === 'fixed-solo' ? (
                  <>
                    <PixelIcon name="check" size={10} color="#2ECC71" />
                    <span>COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <PixelIcon name="clipboard" size={10} />
                    <span>COPY FIX</span>
                  </>
                )}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-code)',
                fontSize: '13px',
                color: 'var(--bb-text-code-green)',
                overflowX: 'auto',
                lineHeight: 1.5,
                whiteSpace: 'pre',
              }}
            >
              {result.fixedCode}
            </pre>
          </div>
        )}
      </section>

      {/* SECTION D: Verification Tests */}
      {result.tests && (
        <section className="bb-panel-inset" style={{ padding: '14px', background: '#12141A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <PixelIcon name="book" size={16} color="var(--bb-color-gold)" />
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-gold)',
              }}
            >
              VERIFICATION TEST RECOMMENDATION
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PixelIcon name="lightning" size={12} color="var(--bb-color-gold)" />
            <em>Recommendation only. The submitted source code was not compiled or executed in this browser session. Run these commands locally in your development shell:</em>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '8px 12px',
              backgroundColor: '#08090C',
              border: '1px solid var(--bb-border-subtle)',
              fontFamily: 'var(--bb-font-code)',
              fontSize: '12px',
              color: 'var(--bb-text-gold)',
              overflowX: 'auto',
            }}
          >
            {result.tests}
          </pre>
        </section>
      )}

      {/* SECTION E: Documentation Sources & Stage 5 Provenance */}
      <section
        style={{
          borderTop: '1px solid var(--bb-border-subtle)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '9px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            DOCUMENTATION CITATIONS & STAGE 5 PROVENANCE:
          </span>
          {result.responseMode && (
            <span
              style={{
                fontFamily: 'var(--bb-font-code)',
                fontSize: '10px',
                color: result.responseMode === 'DIRECT_MATCH' ? 'var(--bb-color-emerald)' : 'var(--bb-color-diamond)',
              }}
            >
              Mode: {result.responseMode}
            </span>
          )}
        </div>

        {result.sources && result.sources.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.sources.map((src, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '6px 10px',
                  backgroundColor: '#0F1118',
                  border: '1px solid var(--bb-border-subtle)',
                  borderRadius: '2px',
                }}
              >
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '11px',
                    color: 'var(--bb-color-diamond)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    wordBreak: 'break-all',
                  }}
                >
                  <PixelIcon name="book" size={12} color="var(--bb-color-diamond)" />
                  <span style={{ textDecoration: 'underline' }}>
                    {src.title || src.url}
                  </span>
                  <PixelIcon name="arrow-right" size={10} color="var(--bb-text-muted)" />
                </a>

                {/* Provenance attribution tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {src.recordId && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--bb-font-code)',
                        padding: '1px 5px',
                        backgroundColor: '#1E2333',
                        color: 'var(--bb-color-gold)',
                        borderRadius: '2px',
                      }}
                    >
                      #{src.recordId}
                    </span>
                  )}
                  {src.isPrimary !== undefined && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--bb-font-code)',
                        padding: '1px 5px',
                        backgroundColor: src.isPrimary ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0, 188, 212, 0.2)',
                        color: src.isPrimary ? 'var(--bb-color-emerald)' : 'var(--bb-color-diamond)',
                        borderRadius: '2px',
                      }}
                    >
                      {src.isPrimary ? 'PRIMARY' : 'RELATED'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#0D0F14',
              border: '1px dashed var(--bb-border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--bb-font-code)',
              color: 'var(--bb-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PixelIcon name="book" size={12} color="var(--bb-text-muted)" />
            <span>No documentation citations available for this record.</span>
          </div>
        )}
      </section>

      {/* SECTION F: Limitations & System Boundaries */}
      {result.limitations && result.limitations.length > 0 && (
        <section
          style={{
            borderTop: '1px solid var(--bb-border-subtle)',
            paddingTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PixelIcon name="scales" size={14} color="var(--bb-color-gold)" />
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-gold)',
              }}
            >
              LIMITATIONS & SYSTEM BOUNDARIES:
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontFamily: 'var(--bb-font-body)',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {result.limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
