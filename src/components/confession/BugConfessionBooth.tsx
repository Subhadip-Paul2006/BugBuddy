import React, { useState, useMemo, useEffect } from 'react';
import {
  CanonicalLanguage,
  ByteBuddyMood,
  ConfessionResult,
  ConfessionStatus,
} from '../../types';
import { LanguageSelector } from './LanguageSelector';
import { CodeEditorArea } from './CodeEditorArea';
import { JudgmentTerminal } from './JudgmentTerminal';
import { PixelIcon } from '../common/PixelIcon';
import { scanAndRedactSecrets } from '../../utils/secretRedactor';
import {
  SAMPLE_SNIPPETS,
  searchKnowledge,
} from '../../services/knowledgeService';
import {
  playErrorSound,
  playScanSound,
  playLoadSampleSound,
  playClearSound,
} from '../../utils/audioSystem';

export interface BugConfessionBoothProps {
  initialLanguage?: CanonicalLanguage;
  initialCode?: string;
  onLanguageChange?: (lang: CanonicalLanguage) => void;
  onSetMood: (mood: ByteBuddyMood) => void;
  onReturnToBaseCamp: () => void;
  onConfessionSuccess?: (result: ConfessionResult, code: string) => void;
  onVerifyAndResolve?: (result: ConfessionResult) => void;
  isResolved?: boolean;
}

export const BugConfessionBooth: React.FC<BugConfessionBoothProps> = ({
  initialLanguage = 'python',
  initialCode = '',
  onLanguageChange,
  onSetMood,
  onReturnToBaseCamp,
  onConfessionSuccess,
  onVerifyAndResolve,
  isResolved,
}) => {
  // Form State
  const [language, setLanguage] = useState<CanonicalLanguage>(initialLanguage);
  const [code, setCode] = useState<string>(initialCode);

  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);
  const [errorTrace, setErrorTrace] = useState<string>('');
  const [expectedBehavior, setExpectedBehavior] = useState<string>('');
  const [actualBehavior, setActualBehavior] = useState<string>('');
  const [showOptionalContext, setShowOptionalContext] = useState<boolean>(false);
  const [isViewingSanitized, setIsViewingSanitized] = useState<boolean>(false);

  // Submission State
  const [status, setStatus] = useState<ConfessionStatus>('IDLE');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfessionResult | null>(null);

  // Client-Side Heuristic Secret Scan
  const secretScan = useMemo(() => {
    return scanAndRedactSecrets(code);
  }, [code]);

  // Load sample code for currently selected language
  const handleLoadSample = () => {
    playLoadSampleSound();
    const sample = SAMPLE_SNIPPETS[language];
    if (sample) {
      setCode(sample.code);
      setErrorTrace(sample.errorTrace);
      setExpectedBehavior(sample.expectedBehavior);
      setActualBehavior(sample.actualBehavior);
      setValidationError(null);
      setStatus('IDLE');
      setResult(null);
      setIsViewingSanitized(false);
      onSetMood('NEUTRAL');
    }
  };

  // Clear code editor
  const handleClearCode = () => {
    playClearSound();
    setCode('');
    setErrorTrace('');
    setExpectedBehavior('');
    setActualBehavior('');
    setValidationError(null);
    setStatus('IDLE');
    setResult(null);
    setIsViewingSanitized(false);
    onSetMood('NEUTRAL');
  };

  // Language switch handler (preserves code if non-empty, clears error and stale diagnosis)
  const handleLanguageChange = (newLang: CanonicalLanguage) => {
    setLanguage(newLang);
    onLanguageChange?.(newLang);
    setValidationError(null);
    if (result !== null) {
      setResult(null);
      setStatus('IDLE');
    }
  };

  // Primary Submission Handler
  const handleConfessBug = async () => {
    // 1. Validate Input
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      playErrorSound();
      setValidationError('Cannot confess an empty void! Paste your bugged code into the offering altar.');
      setStatus('VALIDATING');
      onSetMood('DISAPPOINTED');
      return;
    }

    playScanSound();
    setValidationError(null);
    setSubmissionError(null);
    setStatus('ANALYZING');
    setResult(null);
    onSetMood('NEUTRAL');

    try {
      // 2. Query Local Knowledge Integration Boundary with mandatory secret redaction
      const safeCode = secretScan.hasSecrets ? secretScan.redactedCode : code;
      const { result: matchedResult, isNoMatch } = await searchKnowledge({
        code: safeCode,
        language,
        errorTrace: errorTrace.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
      });

      if (isNoMatch || !matchedResult) {
        playErrorSound();
        setStatus('NO_MATCH');
        onSetMood('NEUTRAL');
      } else {
        // Diagnosis acquired — play scan/completion tone, do NOT falsely award XP or level up yet
        playScanSound();
        setResult(matchedResult);
        setStatus('SUCCESS');
        onSetMood('HAPPY');
        onConfessionSuccess?.(matchedResult, safeCode);
      }
    } catch (err: any) {
      playErrorSound();
      setSubmissionError(err?.message || 'An unexpected error occurred while communicating with the diagnostic backend.');
      setStatus('ERROR');
      onSetMood('DRAMATIC_DESPAIR');
    }
  };

  return (
    <div
      className="bb-confession-workspace"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      {/* 1. Header Altar */}
      <div
        className="bb-panel-hearth"
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              filter: 'drop-shadow(0 0 8px rgba(229,57,53,0.5))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <PixelIcon name="swords" size={32} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '15px',
                color: 'var(--bb-text-white)',
                margin: 0,
                letterSpacing: '0.8px',
              }}
            >
              THE BUG CONFESSION BOOTH
            </h1>
            <p
              style={{
                fontFamily: 'var(--bb-font-pixel-sub)',
                fontSize: '18px',
                color: 'var(--bb-color-fire-glow)',
                margin: '4px 0 0 0',
              }}
            >
              Kneel before the Codex. Offer your broken code, stack traces, and developer pride.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="bb-btn bb-btn-stone"
          onClick={onReturnToBaseCamp}
          style={{
            fontSize: '9px',
            padding: '8px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PixelIcon name="tent" size={11} />
          <span>RETURN TO BASE CAMP</span>
        </button>
      </div>

      {/* 2. Language Selector Bar */}
      <section className="bb-panel-slab" style={{ padding: '16px' }}>
        <LanguageSelector
          selectedLanguage={language}
          onSelectLanguage={handleLanguageChange}
          disabled={status === 'ANALYZING'}
        />
      </section>

      {/* 3. Code Offering Altar (Editor Area) */}
      <section>
        <CodeEditorArea
          code={code}
          language={language}
          onChangeCode={(newCode) => {
            setCode(newCode);
            if (validationError) setValidationError(null);
            if (result !== null) {
              setResult(null);
              setStatus('IDLE');
            }
          }}
          onLoadSample={handleLoadSample}
          onClearCode={handleClearCode}
          secretScan={secretScan}
          onToggleViewSanitized={() => setIsViewingSanitized((v) => !v)}
          isViewingSanitized={isViewingSanitized}
          disabled={status === 'ANALYZING'}
        />

        {/* Validation Error Alert */}
        {validationError && (
          <div
            role="alert"
            style={{
              marginTop: '10px',
              padding: '12px 16px',
              backgroundColor: 'rgba(229, 57, 53, 0.15)',
              border: '2px solid var(--bb-color-redstone)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 8px var(--bb-color-redstone-glow)',
            }}
          >
            <PixelIcon name="cross" size={18} />
            <div>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-color-redstone)',
                }}
              >
                ALTAR REJECTION:
              </div>
              <div
                style={{
                  fontFamily: 'var(--bb-font-body)',
                  fontSize: '12px',
                  color: 'var(--bb-text-primary)',
                  marginTop: '2px',
                }}
              >
                {validationError}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Optional Context & Stack Trace Section */}
      <section className="bb-panel-slab" style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setShowOptionalContext((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name={showOptionalContext ? 'arrow-left' : 'arrow-right'} size={10} />
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-text-secondary)',
              }}
            >
              OPTIONAL ERROR TRACE & CONTEXT (CLICK TO {showOptionalContext ? 'COLLAPSE' : 'EXPAND'})
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--bb-font-code)',
              fontSize: '11px',
              color: 'var(--bb-text-muted)',
            }}
          >
            {errorTrace || expectedBehavior || actualBehavior ? '● Context Attached' : '○ Empty'}
          </span>
        </div>

        {showOptionalContext && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid var(--bb-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Error Message / Stack Trace */}
            <div>
              <label
                htmlFor="bb-error-trace"
                style={{
                  display: 'block',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-redstone)',
                  marginBottom: '6px',
                }}
              >
                STACK TRACE OR COMPILER ERROR MESSAGE:
              </label>
              <textarea
                id="bb-error-trace"
                value={errorTrace}
                onChange={(e) => setErrorTrace(e.target.value)}
                placeholder="Paste the panic, traceback, or compiler diagnosis here..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bb-surface-inset)',
                  border: '1px solid var(--bb-border-subtle)',
                  color: 'var(--bb-text-code-red)',
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '12px',
                  lineHeight: '18px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Expected Behavior */}
            <div>
              <label
                htmlFor="bb-expected-behavior"
                style={{
                  display: 'block',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-emerald)',
                  marginBottom: '6px',
                }}
              >
                EXPECTED BEHAVIOR:
              </label>
              <input
                id="bb-expected-behavior"
                type="text"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What was supposed to happen? (e.g. returns sanitized string without throwing)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bb-surface-inset)',
                  border: '1px solid var(--bb-border-subtle)',
                  color: 'var(--bb-text-primary)',
                  fontFamily: 'var(--bb-font-body)',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* Actual Behavior */}
            <div>
              <label
                htmlFor="bb-actual-behavior"
                style={{
                  display: 'block',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-color-gold)',
                  marginBottom: '6px',
                }}
              >
                ACTUAL BEHAVIOR / ADDITIONAL SYMPTOMS:
              </label>
              <textarea
                id="bb-actual-behavior"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="What actually happens instead? (e.g. prints unexpected empty list on second invocation)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bb-surface-inset)',
                  border: '1px solid var(--bb-border-subtle)',
                  color: 'var(--bb-text-primary)',
                  fontFamily: 'var(--bb-font-body)',
                  fontSize: '12px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 5. Primary Action Hotbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        <button
          type="button"
          className="bb-btn bb-btn-emerald"
          onClick={handleConfessBug}
          disabled={status === 'ANALYZING'}
          style={{
            padding: '14px 28px',
            fontSize: '11px',
            letterSpacing: '1px',
            minWidth: '280px',
            boxShadow: status === 'ANALYZING' ? 'none' : '0 4px 12px var(--bb-color-emerald-glow)',
          }}
        >
          {status === 'ANALYZING' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PixelIcon name="flame" size={14} className="bb-anim-fire" />
              <span>CONSULTING THE CODEX...</span>
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PixelIcon name="swords" size={14} />
              <span>CONFESS BUG & GET ROASTED</span>
            </span>
          )}
        </button>
      </div>

      {/* 6. Loading State Presentation */}
      {status === 'ANALYZING' && (
        <div
          className="bb-panel-slab"
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            border: '2px solid var(--bb-color-gold)',
          }}
        >
          <PixelIcon name="flame" size={36} className="bb-anim-fire" />
          <div
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '11px',
              color: 'var(--bb-color-gold)',
            }}
          >
            SCANNING FOR ANCIENT ANTI-PATTERNS...
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--bb-font-pixel-sub)',
              fontSize: '18px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            ByteBuddy is forging your customized roasting dialogue and fetching remedy steps...
          </p>
          <div className="bb-xp-bar-track" style={{ width: '220px', height: '10px' }}>
            <div className="bb-xp-bar-fill" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {/* 7. Structured Judgment Results */}
      {status === 'SUCCESS' && result && (
        <section aria-label="Codex Judgment Results">
          <JudgmentTerminal
            result={result}
            onReset={() => {
              setStatus('IDLE');
              setResult(null);
              onSetMood('NEUTRAL');
            }}
            onVerifyAndResolve={onVerifyAndResolve}
            isResolved={isResolved}
          />
        </section>
      )}

      {/* 8. No Matching Knowledge State */}
      {status === 'NO_MATCH' && (
        <div
          className="bb-panel-slab"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: '2px dashed var(--bb-border-subtle)',
          }}
        >
          <PixelIcon name="skull" size={32} />
          <div
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '11px',
              color: 'var(--bb-text-primary)',
            }}
          >
            NO MATCHING PATTERN IN THE CODEX
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--bb-font-body)',
              fontSize: '13px',
              color: 'var(--bb-text-secondary)',
              maxWidth: '520px',
              lineHeight: 1.5,
            }}
          >
            The Codex found no registered diagnostic entry matching this code or pattern.
            Verify that the correct language (<strong>{language.toUpperCase()}</strong>) is selected,
            or try loading a sample bug snippet using the button above.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="bb-btn bb-btn-emerald"
              onClick={handleLoadSample}
              style={{
                fontSize: '9px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="clipboard" size={10} />
              <span>LOAD VERIFIED {language.toUpperCase()} SAMPLE</span>
            </button>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={() => {
                setStatus('IDLE');
                onSetMood('NEUTRAL');
              }}
              style={{
                fontSize: '9px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="pencil" size={10} />
              <span>EDIT CODE & RETRY</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. Retrieval Error State */}
      {status === 'ERROR' && (
        <div
          role="alert"
          className="bb-panel-slab"
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: '2px solid var(--bb-color-redstone)',
          }}
        >
          <PixelIcon name="explosion" size={32} />
          <div
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '11px',
              color: 'var(--bb-color-redstone)',
            }}
          >
            TRANSMISSION TO CODEX FAILED
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--bb-font-body)',
              fontSize: '13px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            {submissionError || 'An unexpected error occurred while communicating with the diagnostic backend.'}
          </p>
          <button
            type="button"
            className="bb-btn bb-btn-redstone"
            onClick={handleConfessBug}
            style={{
              fontSize: '9px',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PixelIcon name="refresh" size={10} />
            <span>RETRY SUBMISSION</span>
          </button>
        </div>
      )}
    </div>
  );
};
