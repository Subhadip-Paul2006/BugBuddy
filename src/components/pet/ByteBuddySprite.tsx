import React from 'react';
import { ByteBuddyMood } from '../../types';

export type PetAccessory = 'NONE' | 'CROWN' | 'DIAMOND_HELMET' | 'WIZARD_HAT' | 'NIGHT_CAP';
export type PetAnimationOverride = 'DEFAULT' | 'DANCE' | 'SPIN' | 'POKE' | 'CELEBRATE';

export interface ByteBuddySpriteProps {
  mood: ByteBuddyMood;
  size?: number;
  className?: string;
  accessory?: PetAccessory;
  animation?: PetAnimationOverride;
  onClick?: () => void;
  interactive?: boolean;
}

export const ByteBuddySprite: React.FC<ByteBuddySpriteProps> = ({
  mood,
  size = 140,
  className = '',
  accessory = 'NONE',
  animation = 'DEFAULT',
  onClick,
  interactive = false,
}) => {
  // Crystal & Eye colors per mood
  const moodTheme = {
    ECSTATIC: {
      crystal: '#2ECC71',
      crystalGlow: '#27AE60',
      eyes: '#F1C40F',
      core: '#2ECC71',
      crown: true,
      mouth: 'wide',
      pose: 'jump',
    },
    HAPPY: {
      crystal: '#F1C40F',
      crystalGlow: '#F39C12',
      eyes: '#FFFFFF',
      core: '#2ECC71',
      crown: false,
      mouth: 'smile',
      pose: 'bounce',
    },
    NEUTRAL: {
      crystal: '#3498DB',
      crystalGlow: '#2980B9',
      eyes: '#FFFFFF',
      core: '#2ECC71',
      crown: false,
      mouth: 'neutral',
      pose: 'breath',
    },
    DISAPPOINTED: {
      crystal: '#E67E22',
      crystalGlow: '#D35400',
      eyes: '#BDC3C7',
      core: '#E67E22',
      crown: false,
      mouth: 'frown',
      pose: 'slump',
    },
    DRAMATIC_DESPAIR: {
      crystal: '#9B59B6',
      crystalGlow: '#8E44AD',
      eyes: '#E74C3C',
      core: '#C0392B',
      crown: false,
      mouth: 'collapse',
      pose: 'collapse',
    },
  }[mood];

  const activeAnimation = (() => {
    if (animation === 'DANCE') return 'bytebuddy-dance 0.8s steps(4) infinite';
    if (animation === 'SPIN') return 'bytebuddy-spin 0.8s steps(8) infinite';
    if (animation === 'POKE') return 'bytebuddy-poke 0.4s ease-out';
    if (animation === 'CELEBRATE') return 'bytebuddy-jump 0.5s steps(4) infinite';
    if (mood === 'ECSTATIC') return 'bytebuddy-jump 0.8s steps(4) infinite';
    if (mood === 'HAPPY') return 'bytebuddy-float 1.4s steps(4) infinite';
    if (mood === 'DRAMATIC_DESPAIR') return 'none';
    return 'bytebuddy-float 2.5s steps(2) infinite';
  })();

  const showCrown = accessory === 'CROWN' || (accessory === 'NONE' && moodTheme.crown);
  const showDiamondHelmet = accessory === 'DIAMOND_HELMET';
  const showWizardHat = accessory === 'WIZARD_HAT';
  const showNightCap = accessory === 'NIGHT_CAP';

  return (
    <div
      className={`bytebuddy-wrapper ${className} ${interactive || onClick ? 'bytebuddy-interactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: interactive || onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
          overflow: 'visible',
        }}
        aria-label={`ByteBuddy cyber-golem companion in ${mood} mood${accessory !== 'NONE' ? ` wearing ${accessory}` : ''}`}
        role="img"
      >
        <defs>
          {/* Drop shadow on block terrain */}
          <ellipse
            id="bb-shadow"
            cx="32"
            cy="58"
            rx="16"
            ry="4"
            fill="rgba(0,0,0,0.45)"
          />
        </defs>

        {/* 1. Ground Contact Shadow */}
        <use href="#bb-shadow" />

        {/* 2. Dramatic Cloud for DRAMATIC_DESPAIR */}
        {mood === 'DRAMATIC_DESPAIR' && (
          <g opacity="0.85">
            <rect x="20" y="2" width="24" height="6" fill="#34495E" />
            <rect x="16" y="5" width="32" height="5" fill="#2C3E50" />
            {/* Pixel rain drops */}
            <rect x="22" y="12" width="2" height="3" fill="#3498DB" />
            <rect x="28" y="14" width="2" height="3" fill="#3498DB" />
            <rect x="36" y="11" width="2" height="4" fill="#3498DB" />
            <rect x="42" y="15" width="2" height="3" fill="#3498DB" />
          </g>
        )}

        {/* 3. Golden Sparkles for ECSTATIC or CELEBRATE */}
        {(mood === 'ECSTATIC' || animation === 'CELEBRATE') && (
          <g>
            <rect x="12" y="10" width="3" height="3" fill="#F1C40F" />
            <rect x="10" y="11" width="7" height="1" fill="#F39C12" />
            <rect x="48" y="8" width="3" height="3" fill="#F1C40F" />
            <rect x="50" y="22" width="2" height="2" fill="#2ECC71" />
            <rect x="8" y="26" width="2" height="2" fill="#2ECC71" />
          </g>
        )}

        {/* 4. Puff of smoke for DISAPPOINTED */}
        {mood === 'DISAPPOINTED' && (
          <g opacity="0.6">
            <rect x="44" y="20" width="4" height="3" fill="#95A5A6" />
            <rect x="47" y="18" width="3" height="3" fill="#BDC3C7" />
          </g>
        )}

        {/* Main Creature Body Group */}
        <g
          style={{
            transformOrigin: '32px 48px',
            animation: activeAnimation,
          }}
        >
          {/* Head & Antenna Assembly */}
          {/* Top Antenna Pole */}
          <rect x="31" y="12" width="2" height="6" fill="#2C3E50" />
          {/* Floating Voxel Crystal */}
          <rect x="30" y="8" width="4" height="4" fill={moodTheme.crystal} />
          <rect x="31" y="9" width="2" height="2" fill="#FFFFFF" />

          {/* Golden Crown */}
          {showCrown && (
            <g>
              <rect x="23" y="15" width="18" height="3" fill="#F1C40F" />
              <rect x="23" y="13" width="3" height="2" fill="#F1C40F" />
              <rect x="30" y="12" width="4" height="3" fill="#F1C40F" />
              <rect x="38" y="13" width="3" height="2" fill="#F1C40F" />
              <rect x="31" y="13" width="2" height="2" fill="#E74C3C" />
            </g>
          )}

          {/* Minecraft Diamond Helmet */}
          {showDiamondHelmet && (
            <g>
              {/* Helmet Top Band */}
              <rect x="21" y="16" width="22" height="5" fill="#00E5FF" />
              <rect x="21" y="16" width="22" height="2" fill="#70FFFF" />
              {/* Side Flaps */}
              <rect x="21" y="21" width="4" height="12" fill="#00B4D8" />
              <rect x="39" y="21" width="4" height="12" fill="#0077B6" />
              {/* Nose Guard */}
              <rect x="31" y="21" width="2" height="5" fill="#00B4D8" />
            </g>
          )}

          {/* Voxel Wizard Hat */}
          {showWizardHat && (
            <g>
              {/* Wide Brim */}
              <rect x="18" y="17" width="28" height="3" fill="#5B2C6F" />
              {/* Hat Cone Body */}
              <rect x="24" y="12" width="16" height="5" fill="#7D3C98" />
              <rect x="27" y="7" width="10" height="5" fill="#8E44AD" />
              <rect x="29" y="3" width="6" height="4" fill="#9B59B6" />
              {/* Gold Buckle */}
              <rect x="29" y="15" width="6" height="3" fill="#F1C40F" />
              <rect x="31" y="16" width="2" height="1" fill="#1C2833" />
              {/* Star on tip */}
              <rect x="31" y="1" width="2" height="2" fill="#F1C40F" />
            </g>
          )}

          {/* Retro Night Cap */}
          {showNightCap && (
            <g>
              <rect x="21" y="16" width="22" height="4" fill="#2980B9" />
              <rect x="25" y="12" width="18" height="4" fill="#3498DB" />
              <rect x="33" y="8" width="14" height="4" fill="#2980B9" />
              <rect x="42" y="10" width="8" height="4" fill="#3498DB" />
              {/* White Pom-Pom */}
              <rect x="48" y="13" width="4" height="4" fill="#ECF0F1" />
            </g>
          )}

          {/* Main Cubic Head (20x18px) */}
          <rect x="22" y="18" width="20" height="18" fill="#4A5260" />
          {/* Head Highlight (Top & Left Bevel) */}
          <rect x="22" y="18" width="20" height="2" fill="#636D7E" />
          <rect x="22" y="18" width="2" height="18" fill="#636D7E" />
          {/* Head Shadow (Bottom & Right Bevel) */}
          <rect x="22" y="34" width="20" height="2" fill="#2D323B" />
          <rect x="40" y="18" width="2" height="18" fill="#2D323B" />

          {/* Eyes (2x2 square pixels each) */}
          {mood === 'DRAMATIC_DESPAIR' ? (
            // X_X Eyes
            <g>
              <rect x="26" y="24" width="2" height="2" fill="#E74C3C" />
              <rect x="28" y="26" width="2" height="2" fill="#E74C3C" />
              <rect x="26" y="26" width="2" height="2" fill="#E74C3C" />
              <rect x="28" y="24" width="2" height="2" fill="#E74C3C" />

              <rect x="34" y="24" width="2" height="2" fill="#E74C3C" />
              <rect x="36" y="26" width="2" height="2" fill="#E74C3C" />
              <rect x="34" y="26" width="2" height="2" fill="#E74C3C" />
              <rect x="36" y="24" width="2" height="2" fill="#E74C3C" />
            </g>
          ) : mood === 'DISAPPOINTED' ? (
            // Squint / Tired Slit Eyes
            <g>
              <rect x="26" y="26" width="4" height="2" fill="#2C3E50" />
              <rect x="34" y="26" width="4" height="2" fill="#2C3E50" />
            </g>
          ) : mood === 'HAPPY' || mood === 'ECSTATIC' ? (
            // Cheerful Curved Eyes
            <g>
              <rect x="26" y="24" width="4" height="2" fill={moodTheme.eyes} />
              <rect x="25" y="25" width="2" height="2" fill={moodTheme.eyes} />
              <rect x="29" y="25" width="1" height="2" fill={moodTheme.eyes} />
              <rect x="34" y="24" width="4" height="2" fill={moodTheme.eyes} />
              <rect x="33" y="25" width="1" height="2" fill={moodTheme.eyes} />
              <rect x="37" y="25" width="2" height="2" fill={moodTheme.eyes} />
            </g>
          ) : (
            // Neutral Focused Eyes with Square Pupils
            <g>
              <rect x="26" y="24" width="3" height="4" fill="#FFFFFF" />
              <rect x="27" y="25" width="2" height="2" fill="#1A252F" />
              <rect x="35" y="24" width="3" height="4" fill="#FFFFFF" />
              <rect x="36" y="25" width="2" height="2" fill="#1A252F" />
            </g>
          )}

          {/* Mouth Pixel Expressions */}
          {mood === 'ECSTATIC' ? (
            <g>
              <rect x="29" y="30" width="6" height="3" fill="#1A252F" />
              <rect x="30" y="31" width="4" height="2" fill="#E74C3C" />
            </g>
          ) : mood === 'HAPPY' ? (
            <rect x="29" y="30" width="6" height="2" fill="#1A252F" />
          ) : mood === 'DISAPPOINTED' ? (
            <rect x="29" y="31" width="5" height="1" fill="#1A252F" />
          ) : mood === 'DRAMATIC_DESPAIR' ? (
            <rect x="28" y="31" width="8" height="2" fill="#1A252F" />
          ) : (
            <rect x="30" y="30" width="4" height="1" fill="#2C3E50" />
          )}

          {/* Torso / Body (16x14px) */}
          <rect x="24" y="37" width="16" height="14" fill="#3D4450" />
          <rect x="24" y="37" width="16" height="2" fill="#555E6F" />
          <rect x="24" y="37" width="2" height="14" fill="#555E6F" />
          <rect x="24" y="49" width="16" height="2" fill="#272B33" />
          <rect x="38" y="37" width="2" height="14" fill="#272B33" />

          {/* Glowing Chest Core Orb (4x4px) */}
          <rect x="30" y="41" width="4" height="4" fill={moodTheme.core} />
          <rect x="31" y="42" width="2" height="2" fill="#FFFFFF" />

          {/* Arms (Left & Right) */}
          {mood === 'ECSTATIC' ? (
            // Raised Cheering Arms
            <g>
              <rect x="18" y="32" width="4" height="10" fill="#4A5260" />
              <rect x="42" y="32" width="4" height="10" fill="#4A5260" />
            </g>
          ) : mood === 'DRAMATIC_DESPAIR' ? (
            // Limp Drooping Arms
            <g>
              <rect x="20" y="42" width="4" height="10" fill="#323842" />
              <rect x="40" y="42" width="4" height="10" fill="#323842" />
            </g>
          ) : (
            // Standard Sturdy Arms (Holding Dev Wrench in Right)
            <g>
              <rect x="19" y="39" width="4" height="9" fill="#4A5260" />
              <rect x="41" y="39" width="4" height="9" fill="#4A5260" />
              {/* Iron Debugging Wrench / Sword in Hand */}
              <rect x="44" y="43" width="2" height="6" fill="#7F8C8D" />
              <rect x="43" y="41" width="4" height="2" fill="#BDC3C7" />
              <rect x="43" y="40" width="2" height="1" fill="#BDC3C7" />
              <rect x="45" y="40" width="2" height="1" fill="#BDC3C7" />
            </g>
          )}

          {/* Stubby Voxel Legs (Left & Right) */}
          <rect x="26" y="51" width="5" height="6" fill="#333944" />
          <rect x="33" y="51" width="5" height="6" fill="#2B303A" />
          {/* Feet */}
          <rect x="25" y="56" width="6" height="2" fill="#21252C" />
          <rect x="33" y="56" width="6" height="2" fill="#1C1F25" />
        </g>
      </svg>
    </div>
  );
};
