import React from 'react';
import { CanonicalLanguage } from '../../types';

export interface LanguagePixelLogoProps {
  language: CanonicalLanguage;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * BugBuddy — Enhanced Mastercrafted Pixel-Art Programming Language Emblems
 * 
 * 100% Original, Hand-Authored 16x16 Pixel Matrices
 * Rendered using SVG with shape-rendering="crispEdges"
 * Zero blurred raster scaling, zero smooth gradients, pure 8-bit voxel glory.
 */
export const LanguagePixelLogo: React.FC<LanguagePixelLogoProps> = ({
  language,
  size = 20,
  className = '',
  style = {},
  title,
}) => {
  const accessibleTitle = title || `${language.toUpperCase()} pixel emblem`;

  const renderPixelGrid = () => {
    switch (language) {
      /* ====================================================================
         1. C — Chiseled Granite & Cobalt Steel Voxel Cartridge
         ==================================================================== */
      case 'c':
        return (
          <>
            {/* Outer Chiseled Bevel Frame */}
            <rect x="0" y="2" width="16" height="12" fill="#0E1217" />
            <rect x="2" y="0" width="12" height="16" fill="#0E1217" />
            <rect x="1" y="1" width="14" height="14" fill="#18202A" />

            {/* Sunlight Specular Edge (Top-Left) */}
            <rect x="2" y="1" width="12" height="1" fill="#4B5E78" />
            <rect x="1" y="2" width="1" height="12" fill="#4B5E78" />
            <rect x="2" y="2" width="2" height="2" fill="#7D99BF" />

            {/* Shadow Bevel (Bottom-Right) */}
            <rect x="14" y="2" width="1" height="12" fill="#0A0D11" />
            <rect x="2" y="14" width="12" height="1" fill="#0A0D11" />

            {/* Inner Slab Floor */}
            <rect x="3" y="3" width="10" height="10" fill="#202A36" />

            {/* Glyph C — Deep Inset Shadow Drop */}
            <rect x="5" y="4" width="7" height="9" fill="#0B131C" />

            {/* Glyph C — Cobalt Steel Body */}
            <rect x="5" y="3" width="7" height="2" fill="#3D75A0" />
            <rect x="4" y="4" width="3" height="8" fill="#3D75A0" />
            <rect x="5" y="11" width="7" height="2" fill="#3D75A0" />

            {/* Glyph C — Glowing Cyan Highlight Edge */}
            <rect x="5" y="3" width="7" height="1" fill="#75C2F6" />
            <rect x="4" y="4" width="1" height="8" fill="#75C2F6" />
            <rect x="5" y="4" width="2" height="1" fill="#E0F2FE" />
            <rect x="10" y="4" width="2" height="1" fill="#75C2F6" />
            <rect x="10" y="11" width="2" height="1" fill="#75C2F6" />

            {/* Glyph C — Inner Shadow Depth */}
            <rect x="5" y="12" width="7" height="1" fill="#1C3F5E" />
            <rect x="6" y="5" width="1" height="6" fill="#284E70" />

            {/* Core Energy Spark Pixel */}
            <rect x="5" y="7" width="2" height="2" fill="#38BDF8" />
            <rect x="5" y="7" width="1" height="1" fill="#FFFFFF" />
          </>
        );

      /* ====================================================================
         2. C++ — Royal Cobalt Cartridge with Dual Neon Cyan Pluses
         ==================================================================== */
      case 'cpp':
        return (
          <>
            {/* Outer Obsidian Frame */}
            <rect x="0" y="2" width="16" height="12" fill="#0A0E17" />
            <rect x="2" y="0" width="12" height="16" fill="#0A0E17" />
            <rect x="1" y="1" width="14" height="14" fill="#121C2F" />

            {/* Top-Left Specular Reflection */}
            <rect x="2" y="1" width="12" height="1" fill="#3B5A8F" />
            <rect x="1" y="2" width="1" height="12" fill="#3B5A8F" />
            <rect x="2" y="2" width="2" height="2" fill="#60A5FA" />

            {/* Bottom-Right Deep Shadow */}
            <rect x="14" y="2" width="1" height="12" fill="#060910" />
            <rect x="2" y="14" width="12" height="1" fill="#060910" />

            {/* Inner Dark Navy Bed */}
            <rect x="3" y="3" width="10" height="10" fill="#1A2840" />

            {/* Glyph C (Left Side) */}
            <rect x="3" y="4" width="5" height="2" fill="#2563EB" />
            <rect x="2" y="5" width="3" height="6" fill="#2563EB" />
            <rect x="3" y="10" width="5" height="2" fill="#2563EB" />

            {/* Glyph C Ice Blue Highlights */}
            <rect x="3" y="4" width="5" height="1" fill="#93C5FD" />
            <rect x="2" y="5" width="1" height="5" fill="#93C5FD" />
            <rect x="3" y="5" width="1" height="1" fill="#FFFFFF" />
            <rect x="3" y="11" width="5" height="1" fill="#1D4ED8" />

            {/* Plus #1 (Center Top) — Glowing Neon Cyan */}
            <rect x="9" y="4" width="1" height="5" fill="#06B6D4" />
            <rect x="7" y="6" width="5" height="1" fill="#06B6D4" />
            <rect x="9" y="6" width="1" height="1" fill="#FFFFFF" />
            <rect x="9" y="4" width="1" height="1" fill="#A5F3FC" />

            {/* Plus #2 (Right Bottom) — Glowing Neon Cyan */}
            <rect x="13" y="8" width="1" height="5" fill="#06B6D4" />
            <rect x="11" y="10" width="5" height="1" fill="#06B6D4" />
            <rect x="13" y="10" width="1" height="1" fill="#FFFFFF" />
            <rect x="13" y="8" width="1" height="1" fill="#A5F3FC" />

            {/* Ambient Energy Glow Pixels */}
            <rect x="8" y="5" width="1" height="1" fill="#0891B2" />
            <rect x="12" y="9" width="1" height="1" fill="#0891B2" />
          </>
        );

      /* ====================================================================
         3. Java — Roasted Mahogany Chalice & Swirling Pixel Steam
         ==================================================================== */
      case 'java':
        return (
          <>
            {/* Dark Roasted Coffee Base Cartridge */}
            <rect x="0" y="2" width="16" height="12" fill="#1A0D08" />
            <rect x="2" y="0" width="12" height="16" fill="#1A0D08" />
            <rect x="1" y="1" width="14" height="14" fill="#2E1710" />

            {/* Bevel highlights */}
            <rect x="2" y="1" width="12" height="1" fill="#663524" />
            <rect x="1" y="2" width="1" height="12" fill="#663524" />
            <rect x="14" y="2" width="1" height="12" fill="#100704" />
            <rect x="2" y="14" width="12" height="1" fill="#100704" />

            {/* Rising Dual Steam Ribbons (Stylized 8-Bit) */}
            {/* Left Cyan-Blue Thermal Ribbon */}
            <rect x="4" y="1" width="1" height="1" fill="#7DD3FC" />
            <rect x="5" y="2" width="1" height="1" fill="#38BDF8" />
            <rect x="4" y="3" width="1" height="1" fill="#0284C7" />
            <rect x="5" y="4" width="1" height="1" fill="#0369A1" />
            <rect x="4" y="5" width="1" height="1" fill="#075985" />

            {/* Right Fiery Amber-Red Ribbon */}
            <rect x="9" y="1" width="1" height="1" fill="#FCA5A5" />
            <rect x="8" y="2" width="1" height="1" fill="#EF4444" />
            <rect x="9" y="3" width="1" height="1" fill="#D946EF" />
            <rect x="8" y="4" width="1" height="1" fill="#8B5CF6" />
            <rect x="9" y="5" width="1" height="1" fill="#6366F1" />

            {/* Coffee Mug Rim & Rich Dark Espresso Liquid */}
            <rect x="3" y="6" width="9" height="1" fill="#FFEDD5" />
            <rect x="4" y="7" width="7" height="1" fill="#451A03" />

            {/* Mug Body (Warm Terracotta / Glazed Clay) */}
            <rect x="3" y="7" width="9" height="4" fill="#EA580C" />
            <rect x="4" y="11" width="7" height="1" fill="#C2410C" />

            {/* Mug Glaze Specular Highlight */}
            <rect x="3" y="7" width="1" height="4" fill="#FDBA74" />
            <rect x="4" y="7" width="1" height="3" fill="#FED7AA" />
            <rect x="4" y="7" width="1" height="1" fill="#FFFFFF" />

            {/* Mug Shadow Face */}
            <rect x="10" y="7" width="2" height="4" fill="#9A3412" />

            {/* Mug Handle (Right) */}
            <rect x="11" y="8" width="3" height="1" fill="#EA580C" />
            <rect x="13" y="9" width="1" height="2" fill="#EA580C" />
            <rect x="11" y="11" width="3" height="1" fill="#9A3412" />

            {/* Saucer Base */}
            <rect x="2" y="12" width="11" height="1" fill="#FB923C" />
            <rect x="1" y="13" width="13" height="1" fill="#C2410C" />
            <rect x="3" y="14" width="9" height="1" fill="#7C2D12" />
          </>
        );

      /* ====================================================================
         4. Python — Interlocking Azure & Sunflower Gold Cyber-Serpents
         ==================================================================== */
      case 'python':
        return (
          <>
            {/* Deep Slate Voxel Backing */}
            <rect x="0" y="2" width="16" height="12" fill="#0C1017" />
            <rect x="2" y="0" width="12" height="16" fill="#0C1017" />
            <rect x="1" y="1" width="14" height="14" fill="#171F2C" />

            {/* Cartridge Bevel */}
            <rect x="2" y="1" width="12" height="1" fill="#334155" />
            <rect x="1" y="2" width="1" height="12" fill="#334155" />
            <rect x="14" y="2" width="1" height="12" fill="#080B0F" />
            <rect x="2" y="14" width="12" height="1" fill="#080B0F" />

            {/* TOP SERPENT (Azure Sky Blue) */}
            {/* Top Head & Crown */}
            <rect x="3" y="2" width="7" height="3" fill="#387EB8" />
            <rect x="2" y="3" width="3" height="6" fill="#387EB8" />
            <rect x="3" y="7" width="6" height="2" fill="#387EB8" />
            <rect x="7" y="5" width="2" height="4" fill="#387EB8" />

            {/* Top Serpent Specular Highlights */}
            <rect x="4" y="2" width="6" height="1" fill="#7DD3FC" />
            <rect x="2" y="4" width="1" height="5" fill="#7DD3FC" />
            <rect x="4" y="3" width="2" height="1" fill="#BAE6FD" />

            {/* Top Serpent Eye Socket & Brilliant Pupil */}
            <rect x="8" y="3" width="1" height="1" fill="#0C4A6E" />
            <rect x="8" y="3" width="1" height="1" fill="#FFFFFF" />

            {/* BOTTOM SERPENT (Radiant Gold / Amber) */}
            {/* Bottom Head & Crown */}
            <rect x="6" y="11" width="7" height="3" fill="#FACC15" />
            <rect x="11" y="7" width="3" height="6" fill="#FACC15" />
            <rect x="7" y="7" width="6" height="2" fill="#FACC15" />
            <rect x="7" y="7" width="2" height="4" fill="#FACC15" />

            {/* Bottom Serpent Specular Highlights */}
            <rect x="6" y="13" width="7" height="1" fill="#EAB308" />
            <rect x="13" y="8" width="1" height="5" fill="#FEF08A" />
            <rect x="11" y="12" width="2" height="1" fill="#FEF9C3" />

            {/* Bottom Serpent Eye Socket & Brilliant Pupil */}
            <rect x="7" y="12" width="1" height="1" fill="#713F12" />
            <rect x="7" y="12" width="1" height="1" fill="#FFFFFF" />

            {/* Interlocking 3D Overlap Seam */}
            <rect x="6" y="6" width="2" height="2" fill="#1D4ED8" />
            <rect x="8" y="8" width="2" height="2" fill="#CA8A04" />
          </>
        );

      /* ====================================================================
         5. JavaScript — Solid Amber Gold Voxel Ingot with 3D Obsidian 'JS'
         ==================================================================== */
      case 'javascript':
        return (
          <>
            {/* Golden Voxel Cartridge (Beveled 3D Ingot) */}
            <rect x="0" y="2" width="16" height="12" fill="#6B4F00" />
            <rect x="2" y="0" width="12" height="16" fill="#6B4F00" />
            <rect x="1" y="1" width="14" height="14" fill="#EAB308" />

            {/* Top/Left Sunlight Reflection */}
            <rect x="2" y="1" width="12" height="1" fill="#FEF9C3" />
            <rect x="1" y="2" width="1" height="12" fill="#FEF9C3" />
            <rect x="2" y="2" width="2" height="2" fill="#FFFFFF" />

            {/* Bottom/Right Cast Shadow */}
            <rect x="14" y="2" width="1" height="12" fill="#854D0E" />
            <rect x="2" y="14" width="12" height="1" fill="#854D0E" />

            {/* Ingot Face Field */}
            <rect x="2" y="2" width="12" height="12" fill="#FACC15" />

            {/* Micro Voxel Texture Accents */}
            <rect x="3" y="3" width="1" height="1" fill="#FEF08A" />
            <rect x="12" y="3" width="1" height="1" fill="#FEF08A" />

            {/* Inset Pixel 'J' (Charcoal Obsidian with Bevel) */}
            <rect x="4" y="6" width="2" height="5" fill="#18181B" />
            <rect x="2" y="9" width="3" height="2" fill="#18181B" />
            <rect x="3" y="11" width="3" height="1" fill="#18181B" />
            {/* 'J' Bevel Edge */}
            <rect x="4" y="6" width="2" height="1" fill="#3F3F46" />
            <rect x="2" y="9" width="1" height="2" fill="#3F3F46" />
            <rect x="4" y="12" width="2" height="1" fill="#CA8A04" />

            {/* Inset Pixel 'S' (Charcoal Obsidian with Bevel) */}
            <rect x="8" y="6" width="5" height="1" fill="#18181B" />
            <rect x="8" y="7" width="2" height="2" fill="#18181B" />
            <rect x="8" y="8" width="5" height="1" fill="#18181B" />
            <rect x="11" y="9" width="2" height="2" fill="#18181B" />
            <rect x="8" y="11" width="5" height="1" fill="#18181B" />
            {/* 'S' Bevel Edge */}
            <rect x="8" y="6" width="5" height="1" fill="#3F3F46" />
            <rect x="8" y="12" width="5" height="1" fill="#CA8A04" />
            <rect x="12" y="7" width="1" height="1" fill="#FEF08A" />
          </>
        );

      /* ====================================================================
         6. TypeScript — Radiant Cobalt Diamond Slab with Snow-White 'TS'
         ==================================================================== */
      case 'typescript':
        return (
          <>
            {/* Sapphire Gemstone Cartridge Frame */}
            <rect x="0" y="2" width="16" height="12" fill="#0C2340" />
            <rect x="2" y="0" width="12" height="16" fill="#0C2340" />
            <rect x="1" y="1" width="14" height="14" fill="#2563EB" />

            {/* Top/Left Glint Sunlight Reflection */}
            <rect x="2" y="1" width="12" height="1" fill="#BAE6FD" />
            <rect x="1" y="2" width="1" height="12" fill="#BAE6FD" />
            <rect x="2" y="2" width="2" height="2" fill="#FFFFFF" />

            {/* Diamond Corner Sparkle */}
            <rect x="13" y="2" width="1" height="1" fill="#E0F2FE" />
            <rect x="2" y="13" width="1" height="1" fill="#1D4ED8" />

            {/* Bottom/Right Shadow Facet */}
            <rect x="14" y="2" width="1" height="12" fill="#172554" />
            <rect x="2" y="14" width="12" height="1" fill="#172554" />

            {/* Core Radiant Azure Field */}
            <rect x="2" y="2" width="12" height="12" fill="#3B82F6" />

            {/* Inset Pixel 'T' (Crisp Snow White with 3D Base Drop) */}
            <rect x="3" y="6" width="5" height="1" fill="#FFFFFF" />
            <rect x="5" y="7" width="1" height="5" fill="#FFFFFF" />
            {/* 'T' drop shadow */}
            <rect x="3" y="7" width="2" height="1" fill="#1E40AF" />
            <rect x="6" y="8" width="1" height="4" fill="#1E40AF" />
            <rect x="4" y="12" width="3" height="1" fill="#172554" />

            {/* Inset Pixel 'S' (Crisp Snow White with 3D Base Drop) */}
            <rect x="9" y="6" width="4" height="1" fill="#FFFFFF" />
            <rect x="8" y="7" width="2" height="2" fill="#FFFFFF" />
            <rect x="8" y="8" width="5" height="1" fill="#FFFFFF" />
            <rect x="11" y="9" width="2" height="2" fill="#FFFFFF" />
            <rect x="9" y="11" width="4" height="1" fill="#FFFFFF" />
            {/* 'S' drop shadow */}
            <rect x="12" y="7" width="1" height="1" fill="#1E40AF" />
            <rect x="9" y="12" width="4" height="1" fill="#172554" />
          </>
        );

      default:
        return (
          <rect x="2" y="2" width="12" height="12" fill="#7F8287" />
        );
    }
  };

  return (
    <svg
      role="img"
      aria-label={accessibleTitle}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`bb-pixel-emblem bb-pixel-emblem--${language} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style,
      }}
    >
      <title>{accessibleTitle}</title>
      {renderPixelGrid()}
    </svg>
  );
};
