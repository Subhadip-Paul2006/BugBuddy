import React, { useRef, useState, useEffect } from 'react';
import { CanonicalLanguage, SecretScanResult } from '../../types';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { PixelIcon } from '../common/PixelIcon';
import { SAMPLE_SNIPPETS } from '../../services/knowledgeService';
import {
  playClickSound,
  playKeyStrokeSound,
  playLoadSampleSound,
  playClearSound,
  playScanSound,
} from '../../utils/audioSystem';

interface CodeEditorAreaProps {
  code: string;
  language: CanonicalLanguage;
  onChangeCode: (newCode: string) => void;
  onLoadSample: () => void;
  onClearCode: () => void;
  secretScan: SecretScanResult;
  onToggleViewSanitized: () => void;
  isViewingSanitized: boolean;
  disabled?: boolean;
}

const PLACEHOLDERS: Record<CanonicalLanguage, string> = {
  python: `# Paste your cursed Python snippet here...
# Example: Mutable default args, off-by-one index, or unhandled exceptions
def solve_puzzle(grid, history=[]):
    pass`,

  javascript: `// Paste your chaotic JavaScript snippet here...
// Example: Promise.all unhandled rejections, undefined is not a function
async function syncInventory(player) {
    // Paste code here...
}`,

  typescript: `// Paste your TypeScript code here...
// Example: Strict null check issues, TS2532, unsound type casts
interface SpellBook {
    runes?: string[];
}`,

  c: `/* Paste your C code here... */
/* Example: Buffer overflows, pointer arithmetic, memory leaks */
#include <stdio.h>

void execute_ritual(void) {
    // Paste C code here...
}`,

  cpp: `// Paste your C++ snippet here...
// Example: Vector iterator invalidation, smart pointer cycles
#include <vector>

void battle_loop() {
    // Paste C++ code here...
}`,

  java: `// Paste your Java snippet here...
// Example: NullPointerException, unboxing traps, concurrent modification
public class DungeonMaster {
    // Paste Java code here...
}`,
};

export const CodeEditorArea: React.FC<CodeEditorAreaProps> = ({
  code,
  language,
  onChangeCode,
  onLoadSample,
  onClearCode,
  secretScan,
  onToggleViewSanitized,
  isViewingSanitized,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Animated Code Typing State
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [targetAnimText, setTargetAnimText] = useState('');
  const animationRef = useRef<number | null>(null);

  // Synchronize scroll between textarea and line number gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Clean up animation on unmount or language change
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        window.clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Stop animated typing
  const stopAnimation = (finalText?: string) => {
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    if (typeof finalText === 'string') {
      onChangeCode(finalText);
    }
  };

  // Start animated typing effect with retro sound blips
  const startAnimatedTyping = (textToAnimate: string) => {
    if (!textToAnimate || disabled) return;
    stopAnimation();

    playLoadSampleSound();
    setIsAnimating(true);
    setTargetAnimText(textToAnimate);
    setAnimProgress(0);
    onChangeCode('');

    let charIndex = 0;
    const totalChars = textToAnimate.length;
    // Dynamic chunking for responsive retro speed (approx 2.5 - 3s total)
    const chunkSize = Math.max(2, Math.floor(totalChars / 80));

    animationRef.current = window.setInterval(() => {
      charIndex += chunkSize;
      if (charIndex >= totalChars) {
        charIndex = totalChars;
        stopAnimation(textToAnimate);
      } else {
        onChangeCode(textToAnimate.slice(0, charIndex));
        setAnimProgress(Math.round((charIndex / totalChars) * 100));
        // Retro keystroke sound tick every 2 ticks
        if (Math.random() > 0.4) {
          playKeyStrokeSound();
        }
      }

      // Auto scroll to bottom during typing
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 30);
  };

  const handleAnimateSample = () => {
    playClickSound();
    const sample = SAMPLE_SNIPPETS[language]?.code || PLACEHOLDERS[language];
    startAnimatedTyping(sample);
  };

  const handleManualLoadSample = () => {
    stopAnimation();
    playLoadSampleSound();
    onLoadSample();
  };

  const handleClear = () => {
    stopAnimation();
    playClearSound();
    onClearCode();
  };

  const lines = code ? code.split('\n') : [''];
  const lineCount = lines.length;
  const charCount = code.length;

  return (
    <div className="bb-panel-slab" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Editor Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--bb-border-subtle)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PixelIcon name="scroll" size={16} />
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '10px',
              color: 'var(--bb-text-primary)',
              letterSpacing: '0.5px',
            }}
          >
            SOURCE CODE OFFERING
          </span>
          <span
            className="bb-tag-lang"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
            }}
          >
            <LanguagePixelLogo language={language} size={15} />
            {language.toUpperCase()}
          </span>

          {isAnimating && (
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-emerald)',
                animation: 'bb-pixel-blink 800ms steps(1) infinite',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '6px',
              }}
            >
              <PixelIcon name="lightning" size={9} />
              <span>STREAMING {animProgress}%</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAnimating ? (
            <button
              type="button"
              className="bb-btn bb-btn-gold"
              onClick={() => stopAnimation(targetAnimText)}
              style={{
                padding: '6px 10px',
                fontSize: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Fast-forward and skip typing animation"
            >
              <PixelIcon name="fast-forward" size={10} />
              <span>SKIP ANIMATION</span>
            </button>
          ) : (
            <button
              type="button"
              className="bb-btn bb-btn-emerald"
              onClick={handleAnimateSample}
              disabled={disabled}
              style={{
                padding: '6px 10px',
                fontSize: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Type sample bug with retro pixel animation and sound effects"
            >
              <PixelIcon name="lightning" size={10} />
              <span>ANIMATE SAMPLE</span>
            </button>
          )}

          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={handleManualLoadSample}
            disabled={disabled}
            style={{
              padding: '6px 10px',
              fontSize: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Load a curated realistic bug snippet instantly"
          >
            <PixelIcon name="clipboard" size={10} />
            <span>LOAD SAMPLE</span>
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={handleClear}
            disabled={disabled || !code}
            style={{
              padding: '6px 10px',
              fontSize: '9px',
              opacity: !code ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Clear the code editor"
          >
            <PixelIcon name="broom" size={10} />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers Gutter & CRT Scanlines */}
      <div
        className="bb-panel-inset bb-crt-scanlines"
        style={{
          display: 'flex',
          minHeight: '270px',
          maxHeight: '450px',
          position: 'relative',
          overflow: 'hidden',
          background: '#0B0D12',
          border: '2px solid var(--bb-border-subtle)',
          boxShadow: 'inset 0 0 16px rgba(0,0,0,0.8)',
        }}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          style={{
            width: '48px',
            padding: '12px 8px',
            backgroundColor: '#0E1117',
            borderRight: '1px solid var(--bb-border-subtle)',
            color: '#3B6B4C',
            fontFamily: 'var(--bb-font-code)',
            fontSize: '18px',
            lineHeight: '22px',
            letterSpacing: '0.5px',
            textAlign: 'right',
            userSelect: 'none',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        {/* Textarea Input (Pixel Typography) */}
        <textarea
          ref={textareaRef}
          value={isViewingSanitized ? secretScan.redactedCode : code}
          onChange={(e) => {
            if (!isViewingSanitized) {
              onChangeCode(e.target.value);
              // Occasional subtle keystroke sound on manual typing
              if (Math.random() > 0.6) {
                playKeyStrokeSound();
              }
            }
          }}
          onScroll={handleScroll}
          disabled={disabled || isViewingSanitized}
          placeholder={PLACEHOLDERS[language]}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={`${language} source code editor`}
          className="bb-pixel-code-editor"
          style={{
            flex: 1,
            padding: '12px 14px',
            background: 'transparent',
            color: isViewingSanitized ? 'var(--bb-color-gold)' : '#58D68D',
            fontFamily: 'var(--bb-font-code)',
            fontSize: '18px',
            lineHeight: '22px',
            letterSpacing: '0.8px',
            textShadow: '0 0 3px rgba(88, 214, 141, 0.4)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'auto',
            overflowY: 'auto',
            tabSize: 4,
            zIndex: 1,
          }}
        />

        {/* Blinking Pixel Block Cursor at bottom during animation */}
        {isAnimating && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '16px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.7)',
              padding: '2px 8px',
              border: '1px solid var(--bb-color-emerald)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-emerald)',
              }}
            >
              VOXEL STREAM
            </span>
            <span className="bb-pixel-cursor" />
          </div>
        )}
      </div>

      {/* Editor Status Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '16px',
          fontFamily: 'var(--bb-font-pixel-sub)',
          color: 'var(--bb-text-secondary)',
          paddingTop: '2px',
          letterSpacing: '0.5px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>LINES: <strong style={{ color: 'var(--bb-color-emerald)' }}>{lineCount}</strong></span>
          <span>CHARS: <strong style={{ color: 'var(--bb-color-emerald)' }}>{charCount}</strong></span>
          {isAnimating && (
            <span style={{ color: 'var(--bb-color-gold)' }}>TYPING ANIMATION ACTIVE</span>
          )}
        </div>
        <div>
          {isViewingSanitized ? (
            <span style={{ color: 'var(--bb-color-gold)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PixelIcon name="eye" size={14} />
              <span>SANITIZED REPOSITORY COPY (READ-ONLY)</span>
            </span>
          ) : (
            <span style={{ color: 'var(--bb-text-muted)' }}>
              PIXEL TERMINAL • TAB 4-SPACES
            </span>
          )}
        </div>
      </div>

      {/* Secret Detection Warning Banner */}
      {secretScan.hasSecrets && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(230, 126, 34, 0.15)',
            border: '2px solid var(--bb-mat-fire)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PixelIcon name="shield" size={18} />
            <div>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-mat-fire-glow)',
                  letterSpacing: '0.5px',
                }}
              >
                SECURITY ANOMALY DETECTED ({secretScan.detections.length} SECRETS)
              </div>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-sub)',
                  fontSize: '15px',
                  color: 'var(--bb-text-primary)',
                  marginTop: '2px',
                }}
              >
                {secretScan.detections.map((f) => f.label).join(', ')} identified.
                Auto-redacted before submission to prevent credential leak.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => {
              playScanSound();
              onToggleViewSanitized();
            }}
            style={{ padding: '6px 12px', fontSize: '9px' }}
          >
            {isViewingSanitized ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="pencil" size={11} />
                <span>VIEW RAW SOURCE</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="eye" size={11} />
                <span>PREVIEW SANITIZED</span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
