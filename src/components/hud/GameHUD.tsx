import React from 'react';
import { PlayerProfile } from '../../types';
import { PixelIcon } from '../common/PixelIcon';

interface GameHUDProps {
  player: PlayerProfile;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenSettings: () => void;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
  currentTrackName?: string;
  onNextTrack?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  isAudioEnabled,
  onToggleAudio,
  onOpenSettings,
  isMusicPlaying = false,
  onToggleMusic,
  currentTrackName,
  onNextTrack,
}) => {
  const xpPercent = Math.min(100, Math.round((player.currentXP / player.maxXP) * 100));

  return (
    <header
      className="bb-game-hud"
      style={{
        height: 'var(--bb-hud-height)',
        background: 'var(--bb-surface-hud)',
        borderBottom: '2px solid var(--bb-border-subtle)',
        boxShadow: '0 4px 0 var(--bb-surface-void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand & Player Identification (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Pixel Brand Logo */}
        <div
          style={{
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '13px',
            color: 'var(--bb-color-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '1px',
            textShadow: '0 2px 0 #000',
          }}
        >
          <PixelIcon name="bug" size={18} />
          <span>BUGBUDDY</span>
        </div>

        {/* Player Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bb-surface-inset)',
            border: '1px solid var(--bb-border-subtle)',
            padding: '4px 10px',
            fontSize: '11px',
          }}
        >
          <span style={{ color: 'var(--bb-color-gold)', fontFamily: 'var(--bb-font-pixel-display)', fontSize: '9px' }}>
            LVL {player.level}
          </span>
          <span style={{ color: 'var(--bb-text-primary)', fontWeight: 600 }}>
            {player.handle}
          </span>
          <span
            style={{
              color: 'var(--bb-text-muted)',
              fontSize: '10px',
              borderLeft: '1px solid #333',
              paddingLeft: '6px',
            }}
            className="hidden-mobile"
          >
            {player.title}
          </span>
        </div>
      </div>

      {/* Center: Segmented XP Progress Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          width: '280px',
        }}
        className="hud-xp-center"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '8px',
            color: 'var(--bb-text-gold)',
          }}
        >
          <span>EXPERIENCE</span>
          <span>{player.currentXP} / {player.maxXP} XP</span>
        </div>
        <div className="bb-xp-bar-track" style={{ width: '100%' }}>
          <div
            className="bb-xp-bar-fill"
            style={{ width: `${xpPercent}%` }}
            title={`${xpPercent}% to Level ${player.level + 1}`}
          />
        </div>
      </div>

      {/* Right: Streak & Game Utility Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Streak Campfire Flame */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(230, 126, 34, 0.15)',
            border: '1px solid rgba(230, 126, 34, 0.4)',
            padding: '4px 8px',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            color: '#F39C12',
          }}
        >
          <PixelIcon name="flame" size={14} className="bb-anim-fire" />
          <span>{player.streakDays}-DAY STREAK</span>
        </div>

        {/* 8-Bit Music Controller */}
        {onToggleMusic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className={`bb-btn ${isMusicPlaying ? 'bb-btn-emerald' : 'bb-btn-stone'}`}
              style={{
                padding: '6px 10px',
                fontSize: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={onToggleMusic}
              title={isMusicPlaying ? `Music Playing: ${currentTrackName || '8-Bit BGM'} (Click to Pause)` : 'Play 8-Bit Chiptune Music'}
              aria-label={isMusicPlaying ? 'Pause 8-Bit Music' : 'Play 8-Bit Music'}
            >
              <PixelIcon name="music" size={12} />
              <span>{isMusicPlaying ? 'MUSIC: ON' : 'MUSIC: OFF'}</span>
            </button>
            {isMusicPlaying && onNextTrack && (
              <button
                className="bb-btn bb-btn-stone"
                style={{
                  padding: '6px 8px',
                  fontSize: '9px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={onNextTrack}
                title={`Next Track (Current: ${currentTrackName || '8-Bit BGM'})`}
                aria-label="Skip to Next 8-Bit Track"
              >
                <PixelIcon name="skip" size={12} />
              </button>
            )}
          </div>
        )}

        {/* Audio SFX Toggle Button */}
        <button
          className="bb-btn bb-btn-stone"
          style={{
            padding: '6px 10px',
            fontSize: '9px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onClick={onToggleAudio}
          title={isAudioEnabled ? 'Mute 8-Bit Audio SFX' : 'Enable 8-Bit Audio SFX'}
          aria-label={isAudioEnabled ? 'Mute 8-Bit Audio SFX' : 'Enable 8-Bit Audio SFX'}
        >
          <PixelIcon name={isAudioEnabled ? 'speaker-on' : 'speaker-off'} size={12} />
          <span>{isAudioEnabled ? 'SFX: ON' : 'SFX: OFF'}</span>
        </button>

        {/* Settings Button */}
        <button
          className="bb-btn bb-btn-stone"
          style={{
            padding: '6px 10px',
            fontSize: '9px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onOpenSettings}
          title="Open Base Camp Settings (Esc)"
          aria-label="Open Base Camp Settings"
        >
          <PixelIcon name="gear" size={13} />
        </button>
      </div>
    </header>
  );
};
