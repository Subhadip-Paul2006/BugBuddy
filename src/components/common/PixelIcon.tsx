import React from 'react';

export type PixelIconName =
  | 'bug'
  | 'flame'
  | 'speaker-on'
  | 'speaker-off'
  | 'music'
  | 'skip'
  | 'gear'
  | 'inventory'
  | 'tent'
  | 'swords'
  | 'chat'
  | 'scroll'
  | 'paw'
  | 'tombstone'
  | 'book'
  | 'clipboard'
  | 'broom'
  | 'lightning'
  | 'fast-forward'
  | 'shield'
  | 'eye'
  | 'pencil'
  | 'scales'
  | 'arrow-left'
  | 'arrow-right'
  | 'refresh'
  | 'explosion'
  | 'lamp'
  | 'check'
  | 'cross'
  | 'star'
  | 'heart'
  | 'skull'
  | 'trash'
  | 'pin'
  | 'sun'
  | 'plus'
  | 'lock'
  | 'trophy'
  | 'paperclip'
  | 'pickaxe'
  | 'coin'
  | 'rocket';

export interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Handcrafted 16x16 Pixel Art SVG Icons
 * Zero emoji characters — 100% authentic crisp pixel vectors.
 */
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 16,
  color,
  className = '',
  style = {},
  title,
}) => {
  const renderIconGrid = () => {
    switch (name) {
      /* BugBuddy Emerald Beetle */
      case 'bug':
        return (
          <>
            {/* Antennae */}
            <rect x="3" y="1" width="1" height="2" fill="#2ECC71" />
            <rect x="4" y="2" width="1" height="1" fill="#2ECC71" />
            <rect x="12" y="1" width="1" height="2" fill="#2ECC71" />
            <rect x="11" y="2" width="1" height="1" fill="#2ECC71" />
            {/* Head */}
            <rect x="6" y="2" width="4" height="3" fill="#1E8449" />
            <rect x="5" y="3" width="6" height="2" fill="#2ECC71" />
            <rect x="6" y="3" width="1" height="1" fill="#FFFFFF" />
            <rect x="9" y="3" width="1" height="1" fill="#FFFFFF" />
            {/* Carapace Body */}
            <rect x="4" y="5" width="8" height="8" fill="#27AE60" />
            <rect x="5" y="5" width="6" height="7" fill="#2ECC71" />
            <rect x="6" y="6" width="2" height="5" fill="#A9DFBF" />
            <rect x="7" y="5" width="2" height="8" fill="#145A32" /> {/* Center Split */}
            {/* Legs */}
            <rect x="2" y="6" width="2" height="1" fill="#1E8449" />
            <rect x="1" y="7" width="2" height="1" fill="#1E8449" />
            <rect x="12" y="6" width="2" height="1" fill="#1E8449" />
            <rect x="13" y="7" width="2" height="1" fill="#1E8449" />
            <rect x="2" y="9" width="2" height="1" fill="#1E8449" />
            <rect x="12" y="9" width="2" height="1" fill="#1E8449" />
            <rect x="1" y="12" width="3" height="1" fill="#1E8449" />
            <rect x="12" y="12" width="3" height="1" fill="#1E8449" />
          </>
        );

      /* Campfire Flame (Flickering) */
      case 'flame':
        return (
          <>
            {/* Logs at base */}
            <rect x="2" y="13" width="12" height="2" fill="#6C4F2E" />
            <rect x="3" y="14" width="10" height="1" fill="#4A341D" />
            {/* Outer Red Flame */}
            <rect x="6" y="1" width="3" height="3" fill="#E53935" />
            <rect x="5" y="4" width="6" height="4" fill="#E53935" />
            <rect x="4" y="7" width="8" height="6" fill="#E53935" />
            <rect x="3" y="9" width="10" height="4" fill="#E53935" />
            {/* Orange Core */}
            <rect x="6" y="4" width="4" height="4" fill="#E67E22" />
            <rect x="5" y="7" width="6" height="5" fill="#E67E22" />
            <rect x="4" y="10" width="8" height="3" fill="#F39C12" />
            {/* Yellow / White Heart */}
            <rect x="7" y="6" width="2" height="4" fill="#F1C40F" />
            <rect x="6" y="9" width="4" height="3" fill="#FFF176" />
            <rect x="7" y="10" width="2" height="2" fill="#FFFFFF" />
          </>
        );

      /* Speaker Sound On */
      case 'speaker-on':
        return (
          <>
            {/* Speaker Body */}
            <rect x="2" y="5" width="3" height="6" fill="#F0F2F5" />
            <rect x="5" y="4" width="2" height="8" fill="#F0F2F5" />
            <rect x="7" y="2" width="2" height="12" fill="#F0F2F5" />
            <rect x="3" y="6" width="2" height="4" fill="#9DA3AE" />
            {/* Sound Wave Inner */}
            <rect x="10" y="5" width="1" height="1" fill="#2ECC71" />
            <rect x="11" y="6" width="1" height="4" fill="#2ECC71" />
            <rect x="10" y="10" width="1" height="1" fill="#2ECC71" />
            {/* Sound Wave Outer */}
            <rect x="12" y="3" width="1" height="1" fill="#2ECC71" />
            <rect x="13" y="4" width="1" height="1" fill="#2ECC71" />
            <rect x="14" y="5" width="1" height="6" fill="#2ECC71" />
            <rect x="13" y="11" width="1" height="1" fill="#2ECC71" />
            <rect x="12" y="12" width="1" height="1" fill="#2ECC71" />
          </>
        );

      /* Speaker Muted */
      case 'speaker-off':
        return (
          <>
            <rect x="2" y="5" width="3" height="6" fill="#9DA3AE" />
            <rect x="5" y="4" width="2" height="8" fill="#9DA3AE" />
            <rect x="7" y="2" width="2" height="12" fill="#9DA3AE" />
            {/* Red Slash Cross */}
            <rect x="11" y="5" width="1" height="1" fill="#E53935" />
            <rect x="12" y="6" width="1" height="1" fill="#E53935" />
            <rect x="13" y="7" width="1" height="2" fill="#E53935" />
            <rect x="14" y="9" width="1" height="1" fill="#E53935" />
            <rect x="15" y="10" width="1" height="1" fill="#E53935" />
            <rect x="15" y="5" width="1" height="1" fill="#E53935" />
            <rect x="14" y="6" width="1" height="1" fill="#E53935" />
            <rect x="12" y="9" width="1" height="1" fill="#E53935" />
            <rect x="11" y="10" width="1" height="1" fill="#E53935" />
          </>
        );

      /* 8-Bit Music Note */
      case 'music':
        return (
          <>
            {/* Beam Bar */}
            <rect x="4" y="2" width="8" height="2" fill="#F1C40F" />
            <rect x="4" y="3" width="8" height="1" fill="#F39C12" />
            {/* Left Stem */}
            <rect x="4" y="4" width="2" height="6" fill="#F1C40F" />
            {/* Right Stem */}
            <rect x="10" y="4" width="2" height="7" fill="#F1C40F" />
            {/* Left Note Head */}
            <rect x="2" y="8" width="4" height="3" fill="#F1C40F" />
            <rect x="1" y="9" width="4" height="2" fill="#F39C12" />
            <rect x="2" y="9" width="2" height="1" fill="#FFFFFF" />
            {/* Right Note Head */}
            <rect x="8" y="9" width="4" height="3" fill="#F1C40F" />
            <rect x="7" y="10" width="4" height="2" fill="#F39C12" />
            <rect x="8" y="10" width="2" height="1" fill="#FFFFFF" />
          </>
        );

      /* Skip Track Arrow */
      case 'skip':
        return (
          <>
            {/* First Triangle */}
            <rect x="2" y="7" width="1" height="2" fill="#F0F2F5" />
            <rect x="3" y="6" width="1" height="4" fill="#F0F2F5" />
            <rect x="4" y="5" width="1" height="6" fill="#F0F2F5" />
            <rect x="5" y="4" width="1" height="8" fill="#F0F2F5" />
            <rect x="6" y="3" width="1" height="10" fill="#F0F2F5" />
            {/* Second Triangle */}
            <rect x="7" y="7" width="1" height="2" fill="#F0F2F5" />
            <rect x="8" y="6" width="1" height="4" fill="#F0F2F5" />
            <rect x="9" y="5" width="1" height="6" fill="#F0F2F5" />
            <rect x="10" y="4" width="1" height="8" fill="#F0F2F5" />
            <rect x="11" y="3" width="1" height="10" fill="#F0F2F5" />
            {/* Vertical End Bar */}
            <rect x="13" y="3" width="2" height="10" fill="#F0F2F5" />
          </>
        );

      /* Mechanical Gear */
      case 'gear':
        return (
          <>
            {/* Teeth */}
            <rect x="6" y="1" width="4" height="2" fill="#9DA3AE" />
            <rect x="6" y="13" width="4" height="2" fill="#9DA3AE" />
            <rect x="1" y="6" width="2" height="4" fill="#9DA3AE" />
            <rect x="13" y="6" width="2" height="4" fill="#9DA3AE" />
            {/* Corner Teeth */}
            <rect x="3" y="3" width="2" height="2" fill="#9DA3AE" />
            <rect x="11" y="3" width="2" height="2" fill="#9DA3AE" />
            <rect x="3" y="11" width="2" height="2" fill="#9DA3AE" />
            <rect x="11" y="11" width="2" height="2" fill="#9DA3AE" />
            {/* Outer Rim */}
            <rect x="4" y="3" width="8" height="10" fill="#656C78" />
            <rect x="3" y="4" width="10" height="8" fill="#656C78" />
            {/* Body */}
            <rect x="4" y="4" width="8" height="8" fill="#9DA3AE" />
            <rect x="5" y="5" width="2" height="2" fill="#F0F2F5" />
            {/* Center Hole */}
            <rect x="6" y="6" width="4" height="4" fill="#14161B" />
          </>
        );

      /* Inventory / Chest */
      case 'inventory':
        return (
          <>
            {/* Wood Planks Body */}
            <rect x="1" y="3" width="14" height="10" fill="#866043" />
            {/* Iron Rim */}
            <rect x="1" y="3" width="14" height="2" fill="#3D4353" />
            <rect x="1" y="3" width="2" height="10" fill="#3D4353" />
            <rect x="13" y="3" width="2" height="10" fill="#3D4353" />
            <rect x="1" y="12" width="14" height="2" fill="#1E2128" />
            {/* Chest Seam */}
            <rect x="1" y="7" width="14" height="1" fill="#14161B" />
            {/* Gold Latch */}
            <rect x="7" y="6" width="2" height="3" fill="#F1C40F" />
            <rect x="7" y="7" width="2" height="1" fill="#FFFFFF" />
          </>
        );

      /* Wilderness Tent */
      case 'tent':
        return (
          <>
            {/* Ground */}
            <rect x="1" y="13" width="14" height="1" fill="#5B8C32" />
            {/* Canopy */}
            <rect x="7" y="2" width="2" height="2" fill="#A27848" />
            <rect x="6" y="4" width="4" height="2" fill="#E67E22" />
            <rect x="5" y="6" width="6" height="2" fill="#E67E22" />
            <rect x="4" y="8" width="8" height="2" fill="#E67E22" />
            <rect x="3" y="10" width="10" height="3" fill="#D35400" />
            {/* Ridge Highlight */}
            <rect x="7" y="2" width="1" height="11" fill="#F39C12" />
            {/* Tent Flap Door */}
            <rect x="6" y="9" width="4" height="4" fill="#1E2128" />
            <rect x="7" y="9" width="2" height="4" fill="#0D0E11" />
          </>
        );

      /* Crossed Swords */
      case 'swords':
        return (
          <>
            {/* Sword 1 (Top-Left to Bottom-Right) */}
            <rect x="1" y="1" width="2" height="2" fill="#75C2F6" />
            <rect x="3" y="3" width="2" height="2" fill="#3D75A0" />
            <rect x="5" y="5" width="2" height="2" fill="#3D75A0" />
            <rect x="7" y="7" width="2" height="2" fill="#F1C40F" /> {/* Crossguard Center */}
            <rect x="9" y="9" width="2" height="2" fill="#866043" /> {/* Grip */}
            <rect x="11" y="11" width="2" height="2" fill="#F1C40F" /> {/* Pommel */}

            {/* Sword 2 (Top-Right to Bottom-Left) */}
            <rect x="13" y="1" width="2" height="2" fill="#75C2F6" />
            <rect x="11" y="3" width="2" height="2" fill="#3D75A0" />
            <rect x="9" y="5" width="2" height="2" fill="#3D75A0" />
            <rect x="5" y="9" width="2" height="2" fill="#866043" />
            <rect x="3" y="11" width="2" height="2" fill="#F1C40F" />

            {/* Crossguard Wings */}
            <rect x="5" y="7" width="1" height="2" fill="#F1C40F" />
            <rect x="10" y="7" width="1" height="2" fill="#F1C40F" />
            <rect x="7" y="5" width="2" height="1" fill="#F1C40F" />
            <rect x="7" y="10" width="2" height="1" fill="#F1C40F" />
          </>
        );

      /* Chat Bubble */
      case 'chat':
        return (
          <>
            {/* Bubble Frame */}
            <rect x="1" y="2" width="14" height="10" fill="#2ECC71" />
            <rect x="2" y="1" width="12" height="12" fill="#2ECC71" />
            {/* Bubble Inner */}
            <rect x="2" y="2" width="12" height="10" fill="#14161B" />
            {/* Dialogue Dots */}
            <rect x="4" y="6" width="2" height="2" fill="#2ECC71" />
            <rect x="7" y="6" width="2" height="2" fill="#2ECC71" />
            <rect x="10" y="6" width="2" height="2" fill="#2ECC71" />
            {/* Tail */}
            <rect x="3" y="12" width="4" height="1" fill="#2ECC71" />
            <rect x="2" y="13" width="3" height="1" fill="#2ECC71" />
            <rect x="1" y="14" width="2" height="1" fill="#2ECC71" />
          </>
        );

      /* Parchment Quest Scroll */
      case 'scroll':
        return (
          <>
            {/* Scroll Rolls */}
            <rect x="2" y="1" width="12" height="2" fill="#D4AC0D" />
            <rect x="2" y="13" width="12" height="2" fill="#D4AC0D" />
            {/* Parchment Body */}
            <rect x="3" y="2" width="10" height="12" fill="#F9E79F" />
            {/* Written Ink Lines */}
            <rect x="5" y="4" width="6" height="1" fill="#7D6608" />
            <rect x="5" y="6" width="6" height="1" fill="#7D6608" />
            <rect x="5" y="8" width="6" height="1" fill="#7D6608" />
            <rect x="5" y="10" width="4" height="1" fill="#7D6608" />
            {/* Red Wax Seal */}
            <rect x="10" y="10" width="2" height="2" fill="#E53935" />
          </>
        );

      /* Cyber Golem Paw Print */
      case 'paw':
        return (
          <>
            {/* 3 Toes */}
            <rect x="2" y="2" width="3" height="4" fill="#3498DB" />
            <rect x="3" y="3" width="1" height="2" fill="#FFFFFF" />
            <rect x="6" y="1" width="4" height="4" fill="#3498DB" />
            <rect x="7" y="2" width="2" height="2" fill="#FFFFFF" />
            <rect x="11" y="2" width="3" height="4" fill="#3498DB" />
            <rect x="12" y="3" width="1" height="2" fill="#FFFFFF" />
            {/* Center Main Pad */}
            <rect x="4" y="7" width="8" height="6" fill="#2980B9" />
            <rect x="5" y="8" width="6" height="5" fill="#3498DB" />
            <rect x="6" y="9" width="3" height="2" fill="#A9DFBF" />
          </>
        );

      /* Tombstone */
      case 'tombstone':
        return (
          <>
            {/* Stone Arch Top */}
            <rect x="5" y="2" width="6" height="2" fill="#7F8287" />
            <rect x="4" y="4" width="8" height="9" fill="#7F8287" />
            <rect x="3" y="13" width="10" height="2" fill="#57585C" />
            {/* Granite Highlight */}
            <rect x="4" y="4" width="1" height="9" fill="#BDC3C7" />
            <rect x="5" y="2" width="6" height="1" fill="#BDC3C7" />
            {/* Inset Cross */}
            <rect x="7" y="5" width="2" height="5" fill="#2C3E50" />
            <rect x="5" y="6" width="6" height="1" fill="#2C3E50" />
            {/* Grass Fringe */}
            <rect x="1" y="14" width="14" height="1" fill="#5B8C32" />
          </>
        );

      /* Codex Book */
      case 'book':
        return (
          <>
            {/* Cover Spine */}
            <rect x="1" y="2" width="14" height="12" fill="#78281F" />
            <rect x="7" y="2" width="2" height="12" fill="#4A235A" />
            {/* Pages Left */}
            <rect x="2" y="3" width="5" height="10" fill="#FDFEFE" />
            <rect x="3" y="5" width="3" height="1" fill="#7F8287" />
            <rect x="3" y="7" width="3" height="1" fill="#7F8287" />
            <rect x="3" y="9" width="3" height="1" fill="#7F8287" />
            {/* Pages Right */}
            <rect x="9" y="3" width="5" height="10" fill="#FDFEFE" />
            <rect x="10" y="5" width="3" height="1" fill="#7F8287" />
            <rect x="10" y="7" width="3" height="1" fill="#7F8287" />
            <rect x="10" y="9" width="3" height="1" fill="#7F8287" />
            {/* Gold Ribbon Bookmark */}
            <rect x="7" y="3" width="1" height="12" fill="#F1C40F" />
            <rect x="6" y="13" width="2" height="2" fill="#F39C12" />
          </>
        );

      /* Clipboard */
      case 'clipboard':
        return (
          <>
            {/* Clip */}
            <rect x="6" y="1" width="4" height="3" fill="#BDC3C7" />
            <rect x="7" y="2" width="2" height="1" fill="#2C3E50" />
            {/* Board */}
            <rect x="2" y="3" width="12" height="12" fill="#866043" />
            {/* Paper */}
            <rect x="4" y="4" width="8" height="10" fill="#FFFFFF" />
            {/* Check Lines */}
            <rect x="5" y="6" width="6" height="1" fill="#2ECC71" />
            <rect x="5" y="8" width="6" height="1" fill="#3498DB" />
            <rect x="5" y="10" width="5" height="1" fill="#7F8287" />
            <rect x="5" y="12" width="4" height="1" fill="#7F8287" />
          </>
        );

      /* Broom Sweeper */
      case 'broom':
        return (
          <>
            {/* Wooden Handle */}
            <rect x="12" y="1" width="2" height="2" fill="#A27848" />
            <rect x="10" y="3" width="2" height="2" fill="#A27848" />
            <rect x="8" y="5" width="2" height="2" fill="#A27848" />
            <rect x="6" y="7" width="2" height="2" fill="#A27848" />
            {/* Straw Bundle */}
            <rect x="4" y="9" width="4" height="3" fill="#F1C40F" />
            <rect x="2" y="11" width="5" height="4" fill="#F39C12" />
            {/* Bristles Sweep */}
            <rect x="1" y="13" width="3" height="2" fill="#F9E79F" />
          </>
        );

      /* Lightning Bolt */
      case 'lightning':
        return (
          <>
            <rect x="8" y="1" width="4" height="2" fill="#FFF176" />
            <rect x="7" y="3" width="4" height="2" fill="#F1C40F" />
            <rect x="6" y="5" width="4" height="2" fill="#F1C40F" />
            <rect x="4" y="7" width="8" height="2" fill="#F39C12" />
            <rect x="6" y="9" width="4" height="2" fill="#F1C40F" />
            <rect x="5" y="11" width="3" height="2" fill="#F1C40F" />
            <rect x="4" y="13" width="2" height="2" fill="#FFF176" />
          </>
        );

      /* Fast Forward */
      case 'fast-forward':
        return (
          <>
            <rect x="2" y="7" width="2" height="2" fill="#F1C40F" />
            <rect x="4" y="6" width="2" height="4" fill="#F1C40F" />
            <rect x="6" y="5" width="2" height="6" fill="#F1C40F" />
            <rect x="9" y="7" width="2" height="2" fill="#F1C40F" />
            <rect x="11" y="6" width="2" height="4" fill="#F1C40F" />
            <rect x="13" y="5" width="2" height="6" fill="#F1C40F" />
          </>
        );

      /* Security Shield */
      case 'shield':
        return (
          <>
            <rect x="2" y="2" width="12" height="4" fill="#3498DB" />
            <rect x="3" y="6" width="10" height="4" fill="#2980B9" />
            <rect x="4" y="10" width="8" height="3" fill="#1F618D" />
            <rect x="6" y="13" width="4" height="2" fill="#154360" />
            {/* Gold Cross Crest */}
            <rect x="7" y="3" width="2" height="8" fill="#F1C40F" />
            <rect x="4" y="5" width="8" height="2" fill="#F1C40F" />
            <rect x="7" y="5" width="2" height="2" fill="#FFFFFF" />
          </>
        );

      /* Scanner Eye */
      case 'eye':
        return (
          <>
            <rect x="4" y="4" width="8" height="1" fill="#2ECC71" />
            <rect x="2" y="5" width="12" height="6" fill="#F0F2F5" />
            <rect x="4" y="11" width="8" height="1" fill="#2ECC71" />
            {/* Iris */}
            <rect x="6" y="5" width="4" height="6" fill="#27AE60" />
            {/* Pupil */}
            <rect x="7" y="6" width="2" height="4" fill="#14161B" />
            {/* Spark */}
            <rect x="7" y="6" width="1" height="1" fill="#FFFFFF" />
          </>
        );

      /* Edit Quill / Pencil */
      case 'pencil':
        return (
          <>
            <rect x="11" y="2" width="3" height="3" fill="#E67E22" />
            <rect x="9" y="4" width="3" height="3" fill="#F1C40F" />
            <rect x="7" y="6" width="3" height="3" fill="#F1C40F" />
            <rect x="5" y="8" width="3" height="3" fill="#F1C40F" />
            <rect x="3" y="10" width="3" height="3" fill="#A27848" />
            {/* Graphite Tip */}
            <rect x="2" y="12" width="2" height="2" fill="#2C3E50" />
            <rect x="1" y="14" width="1" height="1" fill="#14161B" />
          </>
        );

      /* Scales of Judgment */
      case 'scales':
        return (
          <>
            {/* Center Pillar */}
            <rect x="7" y="2" width="2" height="12" fill="#F1C40F" />
            <rect x="5" y="13" width="6" height="2" fill="#B7950B" />
            {/* Crossbeam */}
            <rect x="2" y="3" width="12" height="2" fill="#F1C40F" />
            {/* Left Pan */}
            <rect x="2" y="5" width="1" height="4" fill="#B7950B" />
            <rect x="1" y="9" width="4" height="1" fill="#F1C40F" />
            {/* Right Pan */}
            <rect x="13" y="5" width="1" height="4" fill="#B7950B" />
            <rect x="11" y="9" width="4" height="1" fill="#F1C40F" />
          </>
        );

      /* Collapse Left */
      case 'arrow-left':
        return (
          <>
            <rect x="7" y="3" width="2" height="2" fill="#F0F2F5" />
            <rect x="5" y="5" width="2" height="2" fill="#F0F2F5" />
            <rect x="3" y="7" width="2" height="2" fill="#F0F2F5" />
            <rect x="5" y="9" width="2" height="2" fill="#F0F2F5" />
            <rect x="7" y="11" width="2" height="2" fill="#F0F2F5" />
          </>
        );

      /* Expand Right */
      case 'arrow-right':
        return (
          <>
            <rect x="5" y="3" width="2" height="2" fill="#F0F2F5" />
            <rect x="7" y="5" width="2" height="2" fill="#F0F2F5" />
            <rect x="9" y="7" width="2" height="2" fill="#F0F2F5" />
            <rect x="7" y="9" width="2" height="2" fill="#F0F2F5" />
            <rect x="5" y="11" width="2" height="2" fill="#F0F2F5" />
          </>
        );

      /* Refresh / Retry */
      case 'refresh':
        return (
          <>
            <rect x="4" y="2" width="8" height="2" fill="#2ECC71" />
            <rect x="12" y="4" width="2" height="5" fill="#2ECC71" />
            <rect x="10" y="8" width="4" height="2" fill="#2ECC71" />
            <rect x="4" y="12" width="8" height="2" fill="#2ECC71" />
            <rect x="2" y="7" width="2" height="5" fill="#2ECC71" />
            <rect x="2" y="6" width="4" height="2" fill="#2ECC71" />
          </>
        );

      /* Explosion / Error */
      case 'explosion':
        return (
          <>
            <rect x="7" y="1" width="2" height="3" fill="#E53935" />
            <rect x="7" y="12" width="2" height="3" fill="#E53935" />
            <rect x="1" y="7" width="3" height="2" fill="#E53935" />
            <rect x="12" y="7" width="3" height="2" fill="#E53935" />
            <rect x="4" y="4" width="8" height="8" fill="#E67E22" />
            <rect x="6" y="6" width="4" height="4" fill="#F1C40F" />
            <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
          </>
        );

      /* Lamp */
      case 'lamp':
        return (
          <>
            <rect x="5" y="2" width="6" height="2" fill="#A27848" />
            <rect x="4" y="4" width="8" height="8" fill="#E67E22" />
            <rect x="5" y="5" width="6" height="6" fill="#F1C40F" />
            <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
            <rect x="5" y="12" width="6" height="2" fill="#6C4F2E" />
          </>
        );

      /* Checkmark */
      case 'check':
        return (
          <>
            <rect x="12" y="3" width="2" height="2" fill="#2ECC71" />
            <rect x="10" y="5" width="2" height="2" fill="#2ECC71" />
            <rect x="8" y="7" width="2" height="2" fill="#2ECC71" />
            <rect x="6" y="9" width="2" height="2" fill="#2ECC71" />
            <rect x="4" y="7" width="2" height="2" fill="#2ECC71" />
            <rect x="2" y="5" width="2" height="2" fill="#2ECC71" />
          </>
        );

      /* Cross */
      case 'cross':
        return (
          <>
            <rect x="2" y="2" width="3" height="3" fill="#E53935" />
            <rect x="11" y="2" width="3" height="3" fill="#E53935" />
            <rect x="5" y="5" width="6" height="6" fill="#E53935" />
            <rect x="2" y="11" width="3" height="3" fill="#E53935" />
            <rect x="11" y="11" width="3" height="3" fill="#E53935" />
          </>
        );

      /* Star */
      case 'star':
        return (
          <>
            <rect x="7" y="1" width="2" height="4" fill="#F1C40F" />
            <rect x="2" y="5" width="12" height="3" fill="#F1C40F" />
            <rect x="4" y="8" width="8" height="4" fill="#F1C40F" />
            <rect x="3" y="12" width="3" height="3" fill="#F1C40F" />
            <rect x="10" y="12" width="3" height="3" fill="#F1C40F" />
            <rect x="7" y="6" width="2" height="2" fill="#FFFFFF" />
          </>
        );

      /* Heart */
      case 'heart':
        return (
          <>
            <rect x="2" y="3" width="5" height="4" fill="#E53935" />
            <rect x="9" y="3" width="5" height="4" fill="#E53935" />
            <rect x="1" y="5" width="14" height="4" fill="#E53935" />
            <rect x="3" y="9" width="10" height="3" fill="#E53935" />
            <rect x="5" y="12" width="6" height="2" fill="#E53935" />
            <rect x="7" y="14" width="2" height="1" fill="#E53935" />
            <rect x="3" y="4" width="2" height="2" fill="#FFFFFF" />
          </>
        );

      /* Skull */
      case 'skull':
        return (
          <>
            <rect x="4" y="2" width="8" height="8" fill="#ECF0F1" />
            <rect x="3" y="4" width="10" height="5" fill="#ECF0F1" />
            {/* Eye Sockets */}
            <rect x="5" y="5" width="2" height="3" fill="#14161B" />
            <rect x="9" y="5" width="2" height="3" fill="#14161B" />
            {/* Teeth */}
            <rect x="5" y="10" width="6" height="3" fill="#ECF0F1" />
            <rect x="6" y="11" width="1" height="2" fill="#14161B" />
            <rect x="8" y="11" width="1" height="2" fill="#14161B" />
            <rect x="10" y="11" width="1" height="2" fill="#14161B" />
          </>
        );

      /* Trash Can */
      case 'trash':
        return (
          <>
            <rect x="6" y="2" width="4" height="1" fill={color || '#E53935'} />
            <rect x="3" y="3" width="10" height="2" fill={color || '#E53935'} />
            <rect x="4" y="5" width="8" height="9" fill={color || '#E53935'} opacity="0.85" />
            <rect x="6" y="6" width="1" height="7" fill="#14161B" />
            <rect x="9" y="6" width="1" height="7" fill="#14161B" />
          </>
        );

      /* Pin */
      case 'pin':
        return (
          <>
            <rect x="5" y="2" width="6" height="3" fill={color || '#E53935'} />
            <rect x="7" y="5" width="2" height="4" fill={color || '#E53935'} />
            <rect x="5" y="8" width="6" height="2" fill={color || '#E53935'} />
            <rect x="7" y="10" width="2" height="4" fill="#BDC3C7" />
          </>
        );

      /* Sun */
      case 'sun':
        return (
          <>
            <rect x="5" y="5" width="6" height="6" fill={color || '#F1C40F'} />
            <rect x="7" y="1" width="2" height="3" fill={color || '#F1C40F'} />
            <rect x="7" y="12" width="2" height="3" fill={color || '#F1C40F'} />
            <rect x="1" y="7" width="3" height="2" fill={color || '#F1C40F'} />
            <rect x="12" y="7" width="3" height="2" fill={color || '#F1C40F'} />
            <rect x="3" y="3" width="2" height="2" fill={color || '#F39C12'} />
            <rect x="11" y="3" width="2" height="2" fill={color || '#F39C12'} />
            <rect x="3" y="11" width="2" height="2" fill={color || '#F39C12'} />
            <rect x="11" y="11" width="2" height="2" fill={color || '#F39C12'} />
          </>
        );

      /* Plus / Add */
      case 'plus':
        return (
          <>
            <rect x="3" y="7" width="10" height="2" fill={color || '#2ECC71'} />
            <rect x="7" y="3" width="2" height="10" fill={color || '#2ECC71'} />
          </>
        );

      /* Security Lock */
      case 'lock':
        return (
          <>
            <rect x="5" y="2" width="6" height="5" fill="#BDC3C7" />
            <rect x="7" y="4" width="2" height="3" fill="#14161B" />
            <rect x="4" y="6" width="8" height="8" fill={color || '#F1C40F'} />
            <rect x="7" y="8" width="2" height="3" fill="#B7950B" />
            <rect x="7" y="11" width="2" height="2" fill="#B7950B" />
          </>
        );

      /* Trophy */
      case 'trophy':
        return (
          <>
            <rect x="4" y="2" width="8" height="6" fill={color || '#F1C40F'} />
            <rect x="2" y="3" width="2" height="3" fill={color || '#F39C12'} />
            <rect x="12" y="3" width="2" height="3" fill={color || '#F39C12'} />
            <rect x="6" y="5" width="4" height="2" fill="#FAD02C" />
            <rect x="7" y="8" width="2" height="3" fill={color || '#F1C40F'} />
            <rect x="4" y="11" width="8" height="3" fill="#7F8C8D" />
          </>
        );

      /* Paperclip */
      case 'paperclip':
        return (
          <>
            <rect x="5" y="2" width="5" height="1" fill={color || '#BDC3C7'} />
            <rect x="4" y="3" width="1" height="9" fill={color || '#BDC3C7'} />
            <rect x="5" y="12" width="6" height="1" fill={color || '#BDC3C7'} />
            <rect x="11" y="5" width="1" height="7" fill={color || '#BDC3C7'} />
            <rect x="8" y="4" width="3" height="1" fill={color || '#BDC3C7'} />
            <rect x="7" y="5" width="1" height="6" fill={color || '#BDC3C7'} />
            <rect x="8" y="10" width="2" height="1" fill={color || '#BDC3C7'} />
          </>
        );

      /* Pickaxe */
      case 'pickaxe':
        return (
          <>
            {/* Metal Head */}
            <rect x="3" y="4" width="2" height="3" fill="#BDC3C7" />
            <rect x="5" y="3" width="4" height="2" fill="#ECF0F1" />
            <rect x="9" y="3" width="3" height="3" fill="#95A5A6" />
            <rect x="12" y="5" width="2" height="2" fill="#7F8C8D" />
            {/* Wooden Handle */}
            <rect x="7" y="6" width="2" height="2" fill="#8D6E63" />
            <rect x="9" y="8" width="2" height="2" fill="#6D4C41" />
            <rect x="11" y="10" width="2" height="2" fill="#5D4037" />
            <rect x="13" y="12" width="2" height="2" fill="#4E342E" />
          </>
        );

      /* Coin */
      case 'coin':
        return (
          <>
            <rect x="4" y="3" width="8" height="10" fill={color || '#F1C40F'} />
            <rect x="3" y="4" width="10" height="8" fill={color || '#F1C40F'} />
            <rect x="5" y="5" width="6" height="6" fill="#F39C12" />
            <rect x="7" y="6" width="2" height="4" fill="#F1C40F" />
          </>
        );

      /* Rocket */
      case 'rocket':
        return (
          <>
            <rect x="7" y="1" width="2" height="2" fill="#E53935" />
            <rect x="6" y="3" width="4" height="7" fill="#ECF0F1" />
            <rect x="7" y="5" width="2" height="2" fill="#3498DB" />
            <rect x="4" y="8" width="2" height="4" fill="#E53935" />
            <rect x="10" y="8" width="2" height="4" fill="#E53935" />
            <rect x="7" y="10" width="2" height="2" fill="#95A5A6" />
            <rect x="7" y="12" width="2" height="3" fill="#F39C12" />
            <rect x="7" y="13" width="2" height="2" fill="#F1C40F" />
          </>
        );

      default:
        return <rect x="2" y="2" width="12" height="12" fill={color || '#7F8287'} />;
    }
  };

  return (
    <svg
      role="img"
      aria-label={title || `${name} pixel icon`}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`bb-pixel-icon bb-pixel-icon--${name} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style,
      }}
    >
      {title && <title>{title}</title>}
      {renderIconGrid()}
    </svg>
  );
};
