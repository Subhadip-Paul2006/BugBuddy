import React, { useEffect, useRef, useState } from 'react';
import { ByteBuddyMood } from '../../types';
import { ByteBuddySprite } from '../pet/ByteBuddySprite';
import { PixelIcon } from '../common/PixelIcon';

interface IsometricWorldCanvasProps {
  mood: ByteBuddyMood;
  onPetClick?: () => void;
  className?: string;
}

interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  type: 'grass' | 'dirt' | 'stone' | 'wood' | 'water' | 'obsidian' | 'sand';
}

export const IsometricWorldCanvas: React.FC<IsometricWorldCanvasProps> = ({
  mood,
  onPetClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Isometric constants from docs/UI_UX.md Section 2
  const TILE_W = 64;
  const TILE_H = 32;
  const BLOCK_D = 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    interface BlockMaterial {
      top: string;
      left: string;
      right: string;
      fringe?: string;
    }

    // Palette Definition matching tokens.css
    const PALETTE: Record<VoxelBlock['type'], BlockMaterial> = {
      grass: { top: '#5B8C32', left: '#4A7328', right: '#395A1E', fringe: '#33501A' },
      dirt: { top: '#866043', left: '#6E4E36', right: '#563C2A' },
      stone: { top: '#7F8287', left: '#6B6D71', right: '#57585C' },
      wood: { top: '#A27848', left: '#87643B', right: '#6C4F2E' },
      obsidian: { top: '#261B3D', left: '#1D142E', right: '#140E20' },
      water: { top: '#2E72B8', left: '#255D96', right: '#1C4774' },
      sand: { top: '#D4AC0D', left: '#B7950B', right: '#9A7D0A' },
    };

    // Pre-defined Base Camp Voxel Grid (Terraces & Campfire Stage)
    const blocks: VoxelBlock[] = [
      // Layer 0: Bedrock Water & River Shore
      { x: -3, y: -2, z: -1, type: 'water' },
      { x: -3, y: -1, z: -1, type: 'water' },
      { x: -3, y: 0, z: -1, type: 'water' },
      { x: -3, y: 1, z: -1, type: 'water' },
      { x: -2, y: -2, z: -1, type: 'sand' },
      { x: -2, y: -1, z: -1, type: 'sand' },
      { x: -2, y: 0, z: -1, type: 'sand' },

      // Base Terrace (Z = 0) — 5x5 Main Camp Ground
      { x: -2, y: -2, z: 0, type: 'grass' },
      { x: -1, y: -2, z: 0, type: 'grass' },
      { x: 0, y: -2, z: 0, type: 'grass' },
      { x: 1, y: -2, z: 0, type: 'grass' },
      { x: 2, y: -2, z: 0, type: 'grass' },

      { x: -2, y: -1, z: 0, type: 'grass' },
      { x: -1, y: -1, z: 0, type: 'stone' },
      { x: 0, y: -1, z: 0, type: 'stone' },
      { x: 1, y: -1, z: 0, type: 'stone' },
      { x: 2, y: -1, z: 0, type: 'grass' },

      { x: -2, y: 0, z: 0, type: 'grass' },
      { x: -1, y: 0, z: 0, type: 'stone' },
      { x: 0, y: 0, z: 0, type: 'stone' }, // Hearth Center
      { x: 1, y: 0, z: 0, type: 'wood' },  // Bench
      { x: 2, y: 0, z: 0, type: 'grass' },

      { x: -2, y: 1, z: 0, type: 'grass' },
      { x: -1, y: 1, z: 0, type: 'stone' },
      { x: 0, y: 1, z: 0, type: 'stone' },
      { x: 1, y: 1, z: 0, type: 'grass' },
      { x: 2, y: 1, z: 0, type: 'grass' },

      { x: -2, y: 2, z: 0, type: 'grass' },
      { x: -1, y: 2, z: 0, type: 'grass' },
      { x: 0, y: 2, z: 0, type: 'grass' },
      { x: 1, y: 2, z: 0, type: 'grass' },
      { x: 2, y: 2, z: 0, type: 'grass' },

      // Elevated Back Ridge (Z = 1)
      { x: -2, y: -2, z: 1, type: 'grass' },
      { x: -1, y: -2, z: 1, type: 'grass' },
      { x: 0, y: -2, z: 1, type: 'wood' }, // Crafting Table Corner
      { x: -2, y: -1, z: 1, type: 'grass' },

      // High Peak Lookout (Z = 2)
      { x: -2, y: -2, z: 2, type: 'grass' },
    ];

    // Sort blocks back-to-front (Painter's algorithm)
    blocks.sort((a, b) => (a.x + a.y + a.z * 2) - (b.x + b.y + b.z * 2));

    // Draw single isometric block
    const drawBlock = (b: VoxelBlock, originX: number, originY: number) => {
      const sx = (b.x - b.y) * (TILE_W / 2) + originX;
      const sy = (b.x + b.y) * (TILE_H / 2) - b.z * BLOCK_D + originY;
      const p = PALETTE[b.type];

      // 1. Top Diamond Face
      ctx.fillStyle = p.top;
      ctx.beginPath();
      ctx.moveTo(sx, sy - TILE_H / 2);
      ctx.lineTo(sx + TILE_W / 2, sy);
      ctx.lineTo(sx, sy + TILE_H / 2);
      ctx.lineTo(sx - TILE_W / 2, sy);
      ctx.closePath();
      ctx.fill();

      // Top texture noise (2x2 pixel blocks)
      if (b.type === 'grass') {
        ctx.fillStyle = '#6BA33B';
        ctx.fillRect(sx - 4, sy - 2, 4, 2);
        ctx.fillRect(sx + 8, sy - 4, 3, 2);
      } else if (b.type === 'stone') {
        ctx.fillStyle = '#909399';
        ctx.fillRect(sx - 6, sy - 1, 4, 2);
      }

      // 2. Left Shaded Face (Key light 80%)
      ctx.fillStyle = p.left;
      ctx.beginPath();
      ctx.moveTo(sx - TILE_W / 2, sy);
      ctx.lineTo(sx, sy + TILE_H / 2);
      ctx.lineTo(sx, sy + TILE_H / 2 + BLOCK_D);
      ctx.lineTo(sx - TILE_W / 2, sy + BLOCK_D);
      ctx.closePath();
      ctx.fill();

      // Grass hanging fringe on left face
      if (b.type === 'grass' && p.fringe) {
        ctx.fillStyle = p.fringe;
        ctx.fillRect(sx - TILE_W / 2 + 4, sy + 2, 4, 4);
        ctx.fillRect(sx - TILE_W / 2 + 14, sy + 6, 6, 4);
      }

      // 3. Right Shadowed Face (Ambient shadow 60%)
      ctx.fillStyle = p.right;
      ctx.beginPath();
      ctx.moveTo(sx, sy + TILE_H / 2);
      ctx.lineTo(sx + TILE_W / 2, sy);
      ctx.lineTo(sx + TILE_W / 2, sy + BLOCK_D);
      ctx.lineTo(sx, sy + TILE_H / 2 + BLOCK_D);
      ctx.closePath();
      ctx.fill();

      // Grass hanging fringe on right face
      if (b.type === 'grass' && p.fringe) {
        ctx.fillStyle = p.fringe;
        ctx.fillRect(sx + 8, sy + 5, 5, 4);
        ctx.fillRect(sx + 18, sy + 2, 4, 3);
      }
    };

    // Draw Campfire on the Hearth (x: 0, y: 0, z: 0)
    const drawCampfire = (originX: number, originY: number, frame: number) => {
      const cx = (0 - 0) * (TILE_W / 2) + originX + 2;
      const cy = (0 + 0) * (TILE_H / 2) - 0 * BLOCK_D + originY - 6;

      // Campfire Log Base (crossed wood logs)
      ctx.fillStyle = '#4A2E18';
      ctx.fillRect(cx - 10, cy + 2, 20, 4);
      ctx.fillRect(cx - 4, cy - 2, 8, 12);

      // Warm Campfire Amber Hearth Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 38);
      glowGrad.addColorStop(0, 'rgba(243, 156, 18, 0.35)');
      glowGrad.addColorStop(1, 'rgba(243, 156, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fill();

      // Animated 2-frame Fire Pixels
      const flicker = (Math.floor(frame / 12) % 2) === 0;
      ctx.fillStyle = '#E67E22';
      ctx.fillRect(cx - 6, cy - (flicker ? 12 : 10), 12, 10);
      ctx.fillStyle = '#F1C40F';
      ctx.fillRect(cx - 4, cy - (flicker ? 14 : 12), 8, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 2, cy - (flicker ? 10 : 8), 4, 4);

      // Rising Smoke / Ember Particles
      const emberOffset = (frame * 1.2) % 24;
      ctx.fillStyle = 'rgba(241, 196, 15, 0.8)';
      ctx.fillRect(cx - 2 + Math.sin(frame * 0.1) * 4, cy - 16 - emberOffset, 2, 2);
      ctx.fillStyle = 'rgba(189, 195, 199, 0.4)';
      ctx.fillRect(cx + 1 + Math.cos(frame * 0.1) * 6, cy - 24 - emberOffset, 4, 4);
    };

    // Render loop
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Keep pixelated scaling crisp
      ctx.imageSmoothingEnabled = false;

      // Base origin centered in canvas viewport
      const originX = canvas.width / 2;
      const originY = canvas.height / 2 + 10;

      // Draw all terrain blocks
      for (const block of blocks) {
        drawBlock(block, originX, originY);
      }

      // Draw Campfire
      drawCampfire(originX, originY, tick);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCanvasClick = () => {
    setClickCount((c) => c + 1);
    if (onPetClick) {
      onPetClick();
    }
  };

  return (
    <div
      className={`bb-isometric-stage ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '380px',
        background: 'linear-gradient(180deg, #101216 0%, #171A21 60%, #1D212A 100%)',
        border: '2px solid var(--bb-border-subtle)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 4px 0 var(--bb-surface-void)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={handleCanvasClick}
      title="Click anywhere on Base Camp to interact with ByteBuddy!"
    >
      {/* 1. Base 2.5D Isometric HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={380}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />

      {/* 2. ByteBuddy Living Companion (Positioned by the Hearth) */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '52%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleCanvasClick();
        }}
      >
        <ByteBuddySprite mood={mood} size={130} />
      </div>

      {/* 3. Base Camp Stage Overlay Badges */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          display: 'flex',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(16, 18, 22, 0.85)',
            border: '1px solid var(--bb-border-subtle)',
            padding: '4px 8px',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            color: 'var(--bb-color-emerald)',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <PixelIcon name="tent" size={10} color="var(--bb-color-emerald)" />
          <span>BASE CAMP DIORAMA [2.5D]</span>
        </div>
        <div
          style={{
            background: 'rgba(16, 18, 22, 0.85)',
            border: '1px solid var(--bb-border-subtle)',
            padding: '4px 8px',
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            color: 'var(--bb-color-gold)',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <PixelIcon name="flame" size={10} className="bb-anim-fire" />
          <span>HEARTH BURNING</span>
        </div>
      </div>

      {/* 4. Click interaction feedback hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '12px',
          fontFamily: 'var(--bb-font-pixel-display)',
          fontSize: '8px',
          color: 'var(--bb-text-muted)',
          background: 'rgba(13, 14, 17, 0.75)',
          padding: '3px 6px',
          border: '1px solid #232731',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>[TOUCH / CLICK TO PET BYTEBUDDY]</span>
        {clickCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--bb-color-emerald)' }}>
            <PixelIcon name="paw" size={8} color="var(--bb-color-emerald)" />
            <span>{clickCount}</span>
          </span>
        )}
      </div>
    </div>
  );
};
