import React, { useState } from 'react';
import { ByteBuddyMood } from '../../types';
import { MOOD_QUOTES } from '../../mock/mockData';
import { IsometricWorldCanvas } from '../world/IsometricWorldCanvas';
import { PixelIcon, PixelIconName } from '../common/PixelIcon';
import { ByteBuddySprite, PetAccessory, PetAnimationOverride } from '../pet/ByteBuddySprite';
import { playPetChirpSound } from '../../utils/audioSystem';

export interface PetHabitatProps {
  mood: ByteBuddyMood;
  onSetMood: (mood: ByteBuddyMood) => void;
  onNavigateToBaseCamp: () => void;
  onNavigateToConfession: () => void;
  onNavigateToChat: () => void;
}

interface MoodInfo {
  label: string;
  badge: string;
  iconName: PixelIconName;
  color: string;
  lore: string;
  harmonyLevel: number;
}

const MOOD_DETAILS: Record<ByteBuddyMood, MoodInfo> = {
  ECSTATIC: {
    label: 'Ecstatic',
    badge: 'CELEBRATORY',
    iconName: 'star',
    color: 'var(--bb-color-emerald)',
    lore: 'All test assertions green! ByteBuddy is leaping with syntactic euphoria.',
    harmonyLevel: 100,
  },
  HAPPY: {
    label: 'Happy',
    badge: 'COZY & CONTENT',
    iconName: 'flame',
    color: 'var(--bb-color-gold)',
    lore: 'The base campfire burns warm and serene. Code compiles without warnings.',
    harmonyLevel: 85,
  },
  NEUTRAL: {
    label: 'Neutral',
    badge: 'STANDBY ATTENTIVE',
    iconName: 'eye',
    color: 'var(--bb-color-diamond)',
    lore: 'Companion is in idle loop. Monitoring memory pointers and AST trees.',
    harmonyLevel: 65,
  },
  DISAPPOINTED: {
    label: 'Disappointed',
    badge: 'UNRESOLVED WARNINGS',
    iconName: 'shield',
    color: '#E67E22',
    lore: 'Unchecked return values or slow reviews detected. Needs some attention.',
    harmonyLevel: 40,
  },
  DRAMATIC_DESPAIR: {
    label: 'Dramatic Despair',
    badge: 'VOID COLLAPSE',
    iconName: 'skull',
    color: 'var(--bb-color-redstone)',
    lore: 'Segmentation fault or uncaught promise rejection dereferenced into the abyss!',
    harmonyLevel: 15,
  },
};

const ALL_MOODS: ByteBuddyMood[] = [
  'ECSTATIC',
  'HAPPY',
  'NEUTRAL',
  'DISAPPOINTED',
  'DRAMATIC_DESPAIR',
];

export const PetHabitat: React.FC<PetHabitatProps> = ({
  mood,
  onSetMood,
  onNavigateToBaseCamp,
  onNavigateToConfession,
  onNavigateToChat,
}) => {
  const [petCount, setPetCount] = useState(0);
  const [reactionToast, setReactionToast] = useState<string | null>(null);
  const [previewMood, setPreviewMood] = useState<ByteBuddyMood | null>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<PetAccessory>('NONE');
  const [petAnimOverride, setPetAnimOverride] = useState<PetAnimationOverride>('DEFAULT');

  const displayMood = previewMood ?? mood;
  const currentInfo = MOOD_DETAILS[displayMood];

  const triggerToast = (msg: string) => {
    setReactionToast(msg);
    setTimeout(() => {
      setReactionToast((current) => (current === msg ? null : current));
    }, 2400);
  };

  const handleObserve = () => {
    setPetCount((c) => c + 1);
    triggerToast(`ByteBuddy observes you attentively! (Affection: ${petCount + 1})`);
    if (mood === 'NEUTRAL' || mood === 'DISAPPOINTED') {
      onSetMood('HAPPY');
    }
  };

  const handlePokePet = () => {
    setPetCount((c) => c + 1);
    setPetAnimOverride('POKE');
    playPetChirpSound();
    triggerToast(`ByteBuddy chirps joyfully! *poke* (Affection: ${petCount + 1})`);
    if (mood === 'NEUTRAL' || mood === 'DISAPPOINTED') {
      onSetMood('HAPPY');
    }
    setTimeout(() => {
      setPetAnimOverride('DEFAULT');
    }, 450);
  };

  const handleDanceParty = () => {
    setPetAnimOverride('DANCE');
    playPetChirpSound();
    triggerToast('ByteBuddy dances to the chiptune groove! 💃');
    setTimeout(() => {
      setPetAnimOverride('DEFAULT');
    }, 3200);
  };

  const handleSpinTrick = () => {
    setPetAnimOverride('SPIN');
    playPetChirpSound();
    triggerToast('ByteBuddy executes a 360 spin trick! 🌀');
    setTimeout(() => {
      setPetAnimOverride('DEFAULT');
    }, 1800);
  };

  const handleCheer = () => {
    setPetCount((c) => c + 1);
    setPetAnimOverride('CELEBRATE');
    playPetChirpSound();
    onSetMood('ECSTATIC');
    setPreviewMood(null);
    triggerToast('ByteBuddy leaps with joy! "All tests are passing!"');
    setTimeout(() => {
      setPetAnimOverride('DEFAULT');
    }, 2000);
  };

  const handleCampfireRest = () => {
    onSetMood('HAPPY');
    setPreviewMood(null);
    triggerToast('ByteBuddy curls up near the warm campfire embers.');
  };

  const handleFeedBug = () => {
    triggerToast('Journeying to the Altar of Penance to feed syntax errors...');
    onNavigateToConfession();
  };

  return (
    <div
      className="bb-pet-habitat-screen"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 20px',
        overflowY: 'auto',
      }}
      aria-label="ByteBuddy Sanctuary and Habitat"
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
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelIcon name="paw" size={16} />
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: 'var(--bb-color-emerald)',
                letterSpacing: '0.8px',
              }}
            >
              BYTEBUDDY SANCTUARY & HABITAT
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
              VOXEL GROVE LV.3
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Peaceful 2.5D living sanctuary, emotional mood inspector, and companion care workstation.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={onNavigateToBaseCamp}
            title="Return to Base Camp Dashboard"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="tent" size={10} /> BASE CAMP
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={onNavigateToChat}
            title="Open Debugging Chat Workbench"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="chat" size={10} /> DEBUG CHAT
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={handleFeedBug}
            title="Feed ByteBuddy syntax errors at the Confession Booth"
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PixelIcon name="swords" size={10} /> FEED SYNTAX ERROR
          </button>
        </div>
      </header>

      {/* 2. Interactive Feedback Toast if active */}
      {reactionToast && (
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
          <span>{reactionToast}</span>
          <PixelIcon name="heart" size={10} color="var(--bb-color-emerald)" />
        </div>
      )}

      {/* 3. Main Stage: Isometric Habitat Diorama */}
      <section
        className="bb-panel-hearth"
        style={{
          position: 'relative',
          padding: '0',
          overflow: 'hidden',
          minHeight: '380px',
        }}
        aria-label="Voxel Habitat Diorama Canvas"
      >
        <IsometricWorldCanvas
          mood={displayMood}
          onPetClick={handleObserve}
          className="bb-habitat-canvas-view"
        />

        {/* Habitat Zone Overlays */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(13, 14, 17, 0.85)',
              border: '1px solid var(--bb-border-subtle)',
              padding: '3px 8px',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              color: 'var(--bb-color-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PixelIcon name="star" size={8} color="var(--bb-color-emerald)" /> EMERALD TERRACES
          </div>
          <div
            style={{
              background: 'rgba(13, 14, 17, 0.85)',
              border: '1px solid var(--bb-border-subtle)',
              padding: '3px 8px',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              color: 'var(--bb-color-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PixelIcon name="flame" size={8} color="var(--bb-color-gold)" /> HEARTH & CAMPFIRE
          </div>
          <div
            style={{
              background: 'rgba(13, 14, 17, 0.85)',
              border: '1px solid var(--bb-border-subtle)',
              padding: '3px 8px',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '8px',
              color: 'var(--bb-color-diamond)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PixelIcon name="eye" size={8} color="var(--bb-color-diamond)" /> SYNTAX MONOLITH
          </div>
        </div>

        {/* Floating Pet Reaction Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(13, 14, 17, 0.88)',
            border: `1px solid ${currentInfo.color}`,
            padding: '6px 10px',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PixelIcon name="paw" size={14} />
          <div>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: currentInfo.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PixelIcon name={currentInfo.iconName} size={8} color={currentInfo.color} />
              {currentInfo.badge}
            </div>
            <div
              style={{
                fontFamily: 'var(--bb-font-code)',
                fontSize: '9px',
                color: 'var(--bb-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              AFFECTION: {petCount} <PixelIcon name="heart" size={9} color="#E53935" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two-Column Control Center: Mood Inspector & Interaction Deck */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Left Column: Companion Mood & Lore Deck */}
        <section
          className="bb-panel-slab"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
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
                gap: '4px',
              }}
            >
              <PixelIcon name="star" size={12} color="var(--bb-color-gold)" /> COMPANION EMOTIONAL STATUS
            </h2>
            <span
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: currentInfo.color,
                background: 'var(--bb-surface-inset)',
                border: `1px solid ${currentInfo.color}`,
                padding: '2px 6px',
              }}
            >
              {currentInfo.label.toUpperCase()}
            </span>
          </div>

          {/* Dynamic Dialogue Quote */}
          <blockquote
            className="bb-panel-inset"
            style={{
              margin: 0,
              padding: '12px',
              fontStyle: 'italic',
              fontSize: '12px',
              color: 'var(--bb-text-gold)',
              borderLeft: `3px solid ${currentInfo.color}`,
              lineHeight: 1.4,
            }}
          >
            {MOOD_QUOTES[displayMood]}
          </blockquote>

          {/* Mood Lore & Syntactic Harmony meter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: 'var(--bb-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {currentInfo.lore}
            </p>

            {/* Syntactic Harmony Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '8px',
                  color: 'var(--bb-text-muted)',
                }}
              >
                <span>SYNTACTIC HARMONY</span>
                <span style={{ color: currentInfo.color }}>{currentInfo.harmonyLevel}%</span>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'var(--bb-surface-inset)',
                  border: '1px solid var(--bb-border-subtle)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${currentInfo.harmonyLevel}%`,
                    background: currentInfo.color,
                    transition: 'width 200ms ease-out',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Mood Selector / Inspector */}
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-text-muted)',
                marginBottom: '8px',
              }}
            >
              MOOD INSPECTOR / PREVIEW CONTROLS:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ALL_MOODS.map((m) => {
                const info = MOOD_DETAILS[m];
                const isActive = displayMood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onSetMood(m);
                      setPreviewMood(null);
                      triggerToast(`Switched companion state to ${info.label}!`);
                    }}
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      padding: '5px 8px',
                      background: isActive ? 'var(--bb-surface-inset)' : 'var(--bb-surface-panel)',
                      border: `1px solid ${isActive ? info.color : 'var(--bb-border-subtle)'}`,
                      color: isActive ? info.color : 'var(--bb-text-secondary)',
                      boxShadow: isActive ? `0 0 6px ${info.color}40` : undefined,
                      cursor: 'pointer',
                    }}
                    title={`Inspect ${info.label} mood state`}
                  >
                    {isActive ? '● ' : '○ '}
                    {info.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: In-World Interactive Controls & Habitat Workstation */}
        <section
          className="bb-panel-slab"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '11px',
              color: 'var(--bb-color-diamond)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PixelIcon name="lightning" size={12} color="var(--bb-color-diamond)" /> SANCTUARY CARE & ACTIONS
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Interact with ByteBuddy to raise syntactic harmony, test emotional states, or seek debugging guidance.
          </p>

          {/* Action Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleObserve}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="paw" size={10} /> OBSERVE & PET
            </button>

            <button
              type="button"
              className="bb-btn bb-btn-gold"
              onClick={handleCheer}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="star" size={10} /> CHEER UP!
            </button>

            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleDanceParty}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="music" size={10} /> DANCE PARTY
            </button>

            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleSpinTrick}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="refresh" size={10} /> SPIN TRICK
            </button>

            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={handleCampfireRest}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="flame" size={10} /> REST BY HEARTH
            </button>

            <button
              type="button"
              className="bb-btn bb-btn-emerald"
              onClick={handleFeedBug}
              style={{ fontSize: '9px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <PixelIcon name="swords" size={10} /> SACRIFICE BUG
            </button>
          </div>

          {/* Wardrobe & Accessories Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '8px',
                color: 'var(--bb-color-gold)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PixelIcon name="star" size={10} color="var(--bb-color-gold)" /> COMPANION WARDROBE & HATS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(
                [
                  { id: 'NONE', label: 'Default' },
                  { id: 'CROWN', label: '👑 Crown' },
                  { id: 'DIAMOND_HELMET', label: '🪖 Diamond' },
                  { id: 'WIZARD_HAT', label: '🧙 Wizard' },
                  { id: 'NIGHT_CAP', label: '💤 Cap' },
                ] as const
              ).map((acc) => {
                const isSelected = selectedAccessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccessory(acc.id);
                      playPetChirpSound();
                      triggerToast(`Equipped ${acc.label}!`);
                    }}
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '8px',
                      padding: '4px 6px',
                      background: isSelected ? 'var(--bb-surface-inset)' : 'var(--bb-surface-panel)',
                      border: `1px solid ${isSelected ? 'var(--bb-color-gold)' : 'var(--bb-border-subtle)'}`,
                      color: isSelected ? 'var(--bb-color-gold)' : 'var(--bb-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Mood Showcase / Avatar Card */}
          <div
            className="bb-panel-inset"
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ByteBuddySprite
                mood={displayMood}
                size={90}
                accessory={selectedAccessory}
                animation={petAnimOverride}
                onClick={handlePokePet}
                interactive={true}
              />
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '7px',
                  color: currentInfo.color,
                  marginTop: '4px',
                }}
              >
                [SPRITE: {displayMood}]
              </span>
              <span
                style={{
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '8px',
                  color: 'var(--bb-text-muted)',
                  marginTop: '2px',
                }}
              >
                (Click to poke!)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: 'var(--bb-text-primary)',
                }}
              >
                COMPANION STATS
              </div>
              <div style={{ fontSize: '11px', color: 'var(--bb-text-secondary)' }}>
                • Diet: Syntax Errors & Stack Traces
              </div>
              <div style={{ fontSize: '11px', color: 'var(--bb-text-secondary)' }}>
                • Wardrobe: {selectedAccessory}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--bb-text-secondary)' }}>
                • Affection: {petCount} pokes/pets
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
