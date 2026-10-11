import React, { useState, useEffect } from 'react';
import { NavigationTab, ByteBuddyMood } from '../../types';
import { PixelIcon } from '../common/PixelIcon';
import {
  playClickSound,
  playLevelUpSound,
  setSfxMuted,
  setMusicMuted,
  toggleMusic,
  nextMusicTrack,
  getCurrentTrack,
  isMusicPlaying,
} from '../../utils/audioSystem';
import {
  getGraveyardOptIn,
  setGraveyardOptIn,
  resetAllUserData,
} from '../../utils/storage';

export interface UserPreferences {
  audioEnabled: boolean;
  musicEnabled: boolean;
  sfxMuted: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  pixelFont: boolean;
  compactDensity: boolean;
  autoCheerPet: boolean;
  snarkyRoasts: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  audioEnabled: true,
  musicEnabled: false,
  sfxMuted: false,
  highContrast: false,
  reducedMotion: false,
  pixelFont: true,
  compactDensity: false,
  autoCheerPet: true,
  snarkyRoasts: true,
};

const STORAGE_KEY = 'bugbuddy_user_preferences';

function loadStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check system preference for reduced motion
      const prefersReducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
      return {
        ...DEFAULT_PREFERENCES,
        reducedMotion: prefersReducedMotion,
      };
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function saveStoredPreferences(prefs: UserPreferences): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export interface SettingsScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onSetMood: (mood: ByteBuddyMood) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigate,
  isAudioEnabled,
  onToggleAudio,
  onSetMood,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(loadStoredPreferences);
  const [currentTrack, setCurrentTrack] = useState<string>(() => getCurrentTrack().name);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(() => isMusicPlaying());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);
  const [graveyardPersistOptIn, setGraveyardPersistOptIn] = useState<boolean>(getGraveyardOptIn);

  // Check storage support on mount
  useEffect(() => {
    try {
      localStorage.setItem('__bb_test__', '1');
      localStorage.removeItem('__bb_test__');
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  // Synchronize CSS class modifiers to document.body
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;

    if (prefs.highContrast) {
      body.classList.add('bb-high-contrast');
    } else {
      body.classList.remove('bb-high-contrast');
    }

    if (prefs.reducedMotion) {
      body.classList.add('bb-reduced-motion');
    } else {
      body.classList.remove('bb-reduced-motion');
    }

    if (!prefs.pixelFont) {
      body.classList.add('bb-clean-font');
    } else {
      body.classList.remove('bb-clean-font');
    }
  }, [prefs.highContrast, prefs.reducedMotion, prefs.pixelFont]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    playClickSound();
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveStoredPreferences(next);
      return next;
    });
  };

  const handleToggleSfx = () => {
    const nextMuted = !prefs.sfxMuted;
    setSfxMuted(nextMuted);
    updatePreference('sfxMuted', nextMuted);
    showToast(nextMuted ? 'Sound effects muted.' : 'Sound effects active.');
  };

  const handleToggleMusicPlayback = () => {
    playClickSound();
    const isPlaying = toggleMusic();
    setIsMusicActive(isPlaying);
    setCurrentTrack(getCurrentTrack().name);
    updatePreference('musicEnabled', isPlaying);
    showToast(isPlaying ? `Playing: ${getCurrentTrack().name}` : 'Chiptune music stopped.');
  };

  const handleNextMusicTrack = () => {
    playClickSound();
    const nextName = nextMusicTrack();
    setCurrentTrack(nextName);
    showToast(`Switched track to: ${nextName}`);
  };

  const handleTestSoundEffect = () => {
    playLevelUpSound();
    showToast('8-bit Web Audio Synthesizer Test OK!');
  };

  const handleResetCompanionMood = () => {
    playClickSound();
    onSetMood('HAPPY');
    showToast('Companion mood reset to warm HAPPY state.');
  };

  const handleResetToDefaults = () => {
    playClickSound();
    setSfxMuted(DEFAULT_PREFERENCES.sfxMuted);
    setMusicMuted(true);
    setIsMusicActive(false);
    setPrefs(DEFAULT_PREFERENCES);
    saveStoredPreferences(DEFAULT_PREFERENCES);
    showToast('All preferences restored to factory defaults.');
  };

  return (
    <div
      className="bb-settings-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
      }}
      aria-label="BugBuddy Base Settings"
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
          borderLeft: '4px solid var(--bb-color-emerald)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="gear" size={18} />
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: 'var(--bb-color-emerald)',
                letterSpacing: '0.8px',
              }}
            >
              BASE CAMP CONTROL PANEL
            </h1>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                background: 'rgba(46, 204, 113, 0.15)',
                color: 'var(--bb-color-emerald)',
                border: '1px solid var(--bb-color-emerald)',
                padding: '2px 6px',
              }}
            >
              SYSTEM CONFIG
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Manage retro Web Audio synthesizer, visual display accessibility, companion behaviors, and local preferences.
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
            onClick={handleResetToDefaults}
            title="Reset all settings to default values"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="refresh" size={10} />
            <span>RESTORE DEFAULTS</span>
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
            background: 'rgba(46, 204, 113, 0.12)',
            border: '1px solid var(--bb-color-emerald)',
            color: 'var(--bb-color-emerald)',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{toastMessage}</span>
          <PixelIcon name="gear" size={10} color="var(--bb-color-emerald)" />
        </div>
      )}

      {/* 3. Security Guarantee Disclaimer */}
      <aside
        className="bb-panel-inset"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '3px solid var(--bb-color-emerald)',
          background: 'rgba(46, 204, 113, 0.05)',
        }}
        aria-label="Security and Storage Guarantee"
      >
        <PixelIcon name="lock" size={14} color="var(--bb-color-emerald)" />
        <span
          style={{
            fontSize: '11px',
            color: 'var(--bb-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong>Security Guarantee:</strong> BugBuddy operates entirely in your local browser sandbox. No API keys, passwords, bearer tokens, or telemetry are ever stored in browser storage. Only interface display toggles are saved ({storageAvailable ? 'LocalStorage Active [OK]' : 'In-Memory Fallback [!]'}).
        </span>
      </aside>

      {/* 4. Settings Sections Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Section 1: 8-Bit Audio & Sound Synthesizer */}
        <section
          className="bb-panel-slab"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Sound Preferences"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-color-gold)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="music" size={12} color="var(--bb-color-gold)" />
              <span>8-BIT AUDIO SYNTHESIS</span>
            </h2>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: isAudioEnabled ? 'var(--bb-color-emerald)' : 'var(--bb-color-redstone)',
              }}
            >
              {isAudioEnabled ? 'AUDIO ENABLED' : 'AUDIO MUTED'}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Pure Web Audio API chiptune synthesis. Generates vintage square, triangle, and noise waves without external audio files.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Master Audio Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Master Audio Engine</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Top HUD volume toggle</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${isAudioEnabled ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={onToggleAudio}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={isAudioEnabled}
              >
                {isAudioEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Sound Effects Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Sound Effects (SFX)</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Button clicks, XP gains, level ups</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${!prefs.sfxMuted ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={handleToggleSfx}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={!prefs.sfxMuted}
              >
                {!prefs.sfxMuted ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>

            {/* Retro Chiptune Music */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Chiptune Background Music</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Current: {currentTrack}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`bb-btn ${isMusicActive ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                  onClick={handleToggleMusicPlayback}
                  style={{ fontSize: '8px', padding: '6px 10px' }}
                  aria-pressed={isMusicActive}
                >
                  {isMusicActive ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  type="button"
                  className="bb-btn bb-btn-stone"
                  onClick={handleNextMusicTrack}
                  style={{ fontSize: '8px', padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }}
                  title="Next music track"
                >
                  <PixelIcon name="skip" size={9} />
                </button>
              </div>
            </div>

            {/* Audio Test Button */}
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleTestSoundEffect}
              style={{ fontSize: '8px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PixelIcon name="speaker-on" size={10} />
              <span>TEST SYNTHESIZER SOUND</span>
            </button>
          </div>
        </section>

        {/* Section 2: Visual & Display Accessibility */}
        <section
          className="bb-panel-slab"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Display Preferences"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-color-diamond)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="eye" size={12} color="var(--bb-color-diamond)" />
              <span>ACCESSIBILITY & DISPLAY</span>
            </h2>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-text-muted)',
              }}
            >
              WCAG 2.1 COMPLIANT
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Adjust typography, motion animations, and color contrast for optimal readability across developer workstations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Reduced Motion Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Reduced Motion</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Clamp floating animations & particles</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${prefs.reducedMotion ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => updatePreference('reducedMotion', !prefs.reducedMotion)}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={prefs.reducedMotion}
              >
                {prefs.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* High Contrast Mode Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>High Contrast Mode</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>WCAG AAA ultra-contrast border highlights</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${prefs.highContrast ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => updatePreference('highContrast', !prefs.highContrast)}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={prefs.highContrast}
              >
                {prefs.highContrast ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Pixel Typography Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Pixel Retro Typography</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Press Start 2P vs Clean System Sans</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${prefs.pixelFont ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => updatePreference('pixelFont', !prefs.pixelFont)}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={prefs.pixelFont}
              >
                {prefs.pixelFont ? 'PIXEL' : 'CLEAN'}
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Companion & Game Loop Preferences */}
        <section
          className="bb-panel-slab"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          aria-label="Companion Preferences"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-color-emerald)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="paw" size={12} color="var(--bb-color-emerald)" />
              <span>BYTEBUDDY COMPANION DYNAMICS</span>
            </h2>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-emerald)',
              }}
            >
              PET BEHAVIOR
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Configure how ByteBuddy reacts to resolved sprint tasks, confession penances, and debugging dialogues.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Auto-Cheer Pet */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Automatic Slay Celebration</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>Lifts companion mood upon quest completion</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${prefs.autoCheerPet ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => updatePreference('autoCheerPet', !prefs.autoCheerPet)}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={prefs.autoCheerPet}
              >
                {prefs.autoCheerPet ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Snarky Roasts */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Snarky Roast Commentary</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>ByteBuddy delivers sarcastic debugging critiques</div>
              </div>
              <button
                type="button"
                className={`bb-btn ${prefs.snarkyRoasts ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => updatePreference('snarkyRoasts', !prefs.snarkyRoasts)}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={prefs.snarkyRoasts}
              >
                {prefs.snarkyRoasts ? 'ENABLED' : 'MILD'}
              </button>
            </div>

            {/* Reset Companion Mood */}
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleResetCompanionMood}
              style={{ fontSize: '8px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <PixelIcon name="paw" size={10} />
              <span>RESET COMPANION MOOD (TO HAPPY)</span>
            </button>
          </div>
        </section>

        {/* 6. Data Safety & Client Persistence */}
        <section
          className="bb-panel-slab"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderLeft: '4px solid var(--bb-color-gold)',
          }}
          aria-label="Data Safety and Client Storage"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="shield" size={16} />
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '11px',
                color: 'var(--bb-color-gold)',
                letterSpacing: '0.5px',
              }}
            >
              DATA PRIVACY &amp; LOCAL PERSISTENCE
            </h2>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            BugBuddy keeps sensitive code snippets out of browser storage by default. You can opt in to persisting your Bug Graveyard post-mortems across reloads, or perform a complete factory reset.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Graveyard History Opt-In Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bb-surface-inset)',
                border: '1px solid var(--bb-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bb-text-primary)' }}>Graveyard History Persistence (Opt-In)</div>
                <div style={{ fontSize: '9px', color: 'var(--bb-text-muted)' }}>
                  {graveyardPersistOptIn ? 'Persisting post-mortems in localStorage across reloads' : 'Session-only mode (default): code purged on reload'}
                </div>
              </div>
              <button
                type="button"
                className={`bb-btn ${graveyardPersistOptIn ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
                onClick={() => {
                  const nextVal = !graveyardPersistOptIn;
                  setGraveyardPersistOptIn(nextVal);
                  setGraveyardOptIn(nextVal);
                  showToast(nextVal ? 'Graveyard persistence enabled in localStorage.' : 'Graveyard persistence disabled. Switched to session-only.');
                }}
                style={{ fontSize: '8px', padding: '6px 10px' }}
                aria-pressed={graveyardPersistOptIn}
              >
                {graveyardPersistOptIn ? 'ENABLED' : 'SESSION ONLY'}
              </button>
            </div>

            {/* Clear All Stored Data */}
            <button
              type="button"
              className="bb-btn bb-btn-redstone"
              onClick={() => {
                resetAllUserData();
                setPrefs(DEFAULT_PREFERENCES);
                setGraveyardPersistOptIn(false);
                showToast('All local storage data purged and reset to factory defaults.');
              }}
              style={{ fontSize: '8px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <PixelIcon name="trash" size={10} />
              <span>PURGE ALL LOCAL STORAGE &amp; RESET DEFAULTS</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
