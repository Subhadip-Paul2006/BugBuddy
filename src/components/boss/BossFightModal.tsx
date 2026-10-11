import React, { useState, useEffect, useRef } from 'react';
import { PixelIcon } from '../common/PixelIcon';
import {
  playBossRoarSound,
  playDragonBreathSound,
  playSwordSlashSound,
  playBossVictoryFanfare,
  playErrorSound,
  playLevelUpSound,
} from '../../utils/audioSystem';

export interface BossFightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefeatBoss: (rewardXP: number) => void;
}

type BossAttackType = 'MEMORY_LEAK' | 'CONCURRENCY_CLAWS' | 'VOID_BREATH';

interface CombatLogEntry {
  id: string;
  sender: 'player' | 'boss' | 'system';
  message: string;
}

export const BossFightModal: React.FC<BossFightModalProps> = ({
  isOpen,
  onClose,
  onDefeatBoss,
}) => {
  // Boss stats
  const [bossHp, setBossHp] = useState(100);
  const maxBossHp = 100;

  // Player stats
  const [playerHp, setPlayerHp] = useState(20);
  const maxPlayerHp = 20;
  const [potions, setPotions] = useState(3);
  const [shieldActive, setShieldActive] = useState(false);
  const [knowledgeSpellUsed, setKnowledgeSpellUsed] = useState(false);

  // Turn state & animations
  const [turn, setTurn] = useState<'player' | 'boss' | 'victory' | 'defeat'>('player');
  const [bossAnim, setBossAnim] = useState<'hover' | 'hit' | 'attack'>('hover');
  const [screenShake, setScreenShake] = useState(false);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([
    {
      id: 'init-1',
      sender: 'system',
      message: '⚔️ You stepped through the End Portal into the Obsidian Wastes...',
    },
    {
      id: 'init-2',
      sender: 'boss',
      message: '🐲 CORRUPTED VOID DRAGON materializes with an ear-splitting roar!',
    },
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Play roar when modal opens
  useEffect(() => {
    if (isOpen) {
      setBossHp(100);
      setPlayerHp(20);
      setPotions(3);
      setShieldActive(false);
      setKnowledgeSpellUsed(false);
      setTurn('player');
      setBossAnim('hover');
      playBossRoarSound();
      setCombatLogs([
        {
          id: `log-${Date.now()}-1`,
          sender: 'system',
          message: '⚔️ You entered the End Realm! Slay the Corrupted Void Bug!',
        },
        {
          id: `log-${Date.now()}-2`,
          sender: 'boss',
          message: '🐲 VOID DRAGON roars! Its health bar stretches across the sky!',
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll combat log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  if (!isOpen) return null;

  const addLog = (sender: 'player' | 'boss' | 'system', message: string) => {
    setCombatLogs((prev) => [...prev, { id: `log-${Date.now()}-${Math.random()}`, sender, message }]);
  };

  // Boss AI Attack phase
  const triggerBossTurn = (currentBossHp: number) => {
    if (currentBossHp <= 0) {
      handleVictory();
      return;
    }

    setTurn('boss');
    setBossAnim('attack');
    playDragonBreathSound();
    setScreenShake(true);

    setTimeout(() => {
      setScreenShake(false);
      setBossAnim('hover');

      // Random Boss Attack selection
      const attacks: { type: BossAttackType; name: string; damage: number }[] = [
        { type: 'MEMORY_LEAK', name: 'Memory Leak Fireball', damage: Math.floor(Math.random() * 4) + 4 },
        { type: 'CONCURRENCY_CLAWS', name: 'Concurrency Claws', damage: Math.floor(Math.random() * 5) + 5 },
        { type: 'VOID_BREATH', name: 'Infinite Loop Void Breath', damage: Math.floor(Math.random() * 6) + 7 },
      ];

      const chosenAttack = attacks[Math.floor(Math.random() * attacks.length)];
      let incomingDamage = chosenAttack.damage;

      if (shieldActive) {
        incomingDamage = Math.max(1, Math.floor(incomingDamage * 0.25));
        addLog('player', `🛡️ TypeGuard Shield absorbed 75% damage! (Only took ${incomingDamage} DMG)`);
        setShieldActive(false);
      } else {
        addLog('boss', `🐲 Void Dragon casts [${chosenAttack.name}]! Dealt ${incomingDamage} damage!`);
        playErrorSound();
      }

      setPlayerHp((prevHp) => {
        const nextHp = Math.max(0, prevHp - incomingDamage);
        if (nextHp <= 0) {
          setTimeout(() => {
            setTurn('defeat');
            addLog('system', '💀 You were defeated by the Void Bug! Respawn at Base Camp.');
          }, 400);
        } else {
          setTurn('player');
        }
        return nextHp;
      });
    }, 1100);
  };

  // Player Action: Slay Blade Attack
  const handleSwordAttack = () => {
    if (turn !== 'player') return;

    playSwordSlashSound();
    const damage = Math.floor(Math.random() * 11) + 22; // 22 - 32 DMG
    const nextBossHp = Math.max(0, bossHp - damage);
    setBossHp(nextBossHp);

    setBossAnim('hit');
    setTimeout(() => setBossAnim('hover'), 500);

    addLog('player', `🗡️ You strike with Slay Blade for ${damage} critical damage!`);

    if (nextBossHp <= 0) {
      handleVictory();
    } else {
      setTimeout(() => triggerBossTurn(nextBossHp), 700);
    }
  };

  // Player Action: TypeGuard Shield
  const handleDefend = () => {
    if (turn !== 'player') return;

    setShieldActive(true);
    addLog('player', '🛡️ You activated TypeGuard Shield! Next incoming attack damage reduced by 75%!');
    setTimeout(() => triggerBossTurn(bossHp), 600);
  };

  // Player Action: Coffee Potion
  const handleUsePotion = () => {
    if (turn !== 'player' || potions <= 0 || playerHp >= maxPlayerHp) return;

    setPotions((p) => p - 1);
    const healAmount = 10;
    const nextHp = Math.min(maxPlayerHp, playerHp + healAmount);
    setPlayerHp(nextHp);
    playLevelUpSound();

    addLog('player', `☕ You drank Java Espresso Potion! Restored ${healAmount} HP (${nextHp}/${maxPlayerHp} HP).`);
    setTimeout(() => triggerBossTurn(bossHp), 600);
  };

  // Player Action: Knowledge Spell
  const handleKnowledgeSpell = () => {
    if (turn !== 'player' || knowledgeSpellUsed) return;

    setKnowledgeSpellUsed(true);
    playSwordSlashSound();
    const damage = Math.floor(Math.random() * 11) + 38; // 38 - 48 DMG
    const nextBossHp = Math.max(0, bossHp - damage);
    setBossHp(nextBossHp);

    setBossAnim('hit');
    setTimeout(() => setBossAnim('hover'), 600);

    addLog('player', `📜 KNOWLEDGE CODEX SPELL! Grounded citation beam strikes for ${damage} pure damage!`);

    if (nextBossHp <= 0) {
      handleVictory();
    } else {
      setTimeout(() => triggerBossTurn(nextBossHp), 800);
    }
  };

  // Victory Handler
  const handleVictory = () => {
    setTurn('victory');
    setBossAnim('hover');
    playBossVictoryFanfare();
    addLog('system', '🏆 VICTORY! THE CORRUPTED VOID DRAGON COLLAPSED! +150 XP AWARDED!');
  };

  // Claim reward and exit
  const handleClaimVictory = () => {
    onDefeatBoss(150);
    onClose();
  };

  // Retry fight
  const handleRetry = () => {
    setBossHp(100);
    setPlayerHp(20);
    setPotions(3);
    setShieldActive(false);
    setKnowledgeSpellUsed(false);
    setTurn('player');
    setBossAnim('hover');
    playBossRoarSound();
    setCombatLogs([
      {
        id: `log-retry-${Date.now()}`,
        sender: 'system',
        message: '🔄 Regrouped! You confront the Corrupted Void Dragon again!',
      },
    ]);
  };

  return (
    <div
      className="bb-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.92)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ender Dragon Boss Raid Modal"
    >
      <div
        className={`bb-panel-slab ${screenShake ? 'boss-screen-shake' : ''}`}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F0D15',
          border: '3px solid #8E44AD',
          boxShadow: '0 0 30px rgba(142, 68, 173, 0.5), inset 0 0 16px rgba(155, 89, 182, 0.2)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header & Minecraft-style Ender Dragon Boss Bar */}
        <div
          style={{
            backgroundColor: '#170E28',
            borderBottom: '2px solid #8E44AD',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PixelIcon name="skull" size={16} color="#E056FD" />
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '12px',
                  color: '#E056FD',
                  letterSpacing: '1px',
                }}
              >
                ENDER RAID — CORRUPTED VOID BUG
              </span>
            </div>

            <button
              onClick={onClose}
              className="bb-btn bb-btn-stone"
              style={{
                padding: '4px 8px',
                fontSize: '9px',
                fontFamily: 'var(--bb-font-pixel-display)',
              }}
              title="Tactical retreat to Base Camp"
            >
              RETREAT
            </button>
          </div>

          {/* Minecraft Purple Boss Health Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: '#D2B4DE',
              }}
            >
              <span>HEISENBUG OF THE VOID</span>
              <span style={{ color: '#E056FD', fontWeight: 'bold' }}>
                {bossHp} / {maxBossHp} HP
              </span>
            </div>

            <div
              style={{
                height: '14px',
                backgroundColor: '#1A0E2A',
                border: '2px solid #8E44AD',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(155, 89, 182, 0.4)',
              }}
            >
              {/* Health fill */}
              <div
                style={{
                  height: '100%',
                  width: `${(bossHp / maxBossHp) * 100}%`,
                  backgroundColor: '#9B59B6',
                  backgroundImage: 'linear-gradient(90deg, #8E44AD, #E056FD)',
                  transition: 'width 300ms ease-out',
                }}
              />
              {/* 10 Boss Bar Segmentation Notches */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  pointerEvents: 'none',
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      borderRight: '1px solid #1A0E2A',
                      height: '100%',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Boss Arena Stage */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#0A0710',
            backgroundImage:
              'radial-gradient(circle at 50% 40%, rgba(142, 68, 173, 0.25) 0%, rgba(10, 7, 16, 0.95) 70%)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            borderBottom: '2px solid #3A1F5D',
            overflow: 'hidden',
          }}
        >
          {/* Ender Dragon Pixel Art SVG */}
          <div
            style={{
              animation:
                bossAnim === 'hit'
                  ? 'boss-dragon-hit 0.5s ease-out'
                  : bossAnim === 'attack'
                  ? 'boss-dragon-attack 0.6s ease-out'
                  : 'boss-dragon-hover 2.5s ease-in-out infinite',
              transition: 'transform 0.2s ease',
            }}
          >
            <svg
              width="140"
              height="100"
              viewBox="0 0 80 60"
              style={{
                imageRendering: 'pixelated',
                shapeRendering: 'crispEdges',
              }}
              role="img"
              aria-label="Pixel Ender Dragon Boss"
            >
              {/* Wings (Left & Right flapping obsidian wings) */}
              <polygon points="12,18 2,6 20,10 32,22" fill="#2C233D" />
              <polygon points="68,18 78,6 60,10 48,22" fill="#2C233D" />
              <polygon points="16,22 8,12 22,14 30,26" fill="#1C1528" />
              <polygon points="64,22 72,12 58,14 50,26" fill="#1C1528" />

              {/* Main Body */}
              <rect x="28" y="22" width="24" height="22" fill="#191322" />
              <rect x="30" y="24" width="20" height="18" fill="#271F35" />

              {/* Neck & Head */}
              <rect x="34" y="12" width="12" height="12" fill="#1F172B" />
              <rect x="32" y="6" width="16" height="10" fill="#291F38" />

              {/* Dragon Horns */}
              <rect x="30" y="2" width="4" height="6" fill="#4A235A" />
              <rect x="46" y="2" width="4" height="6" fill="#4A235A" />

              {/* Glowing Purple Ender Eyes */}
              <rect x="35" y="9" width="3" height="3" fill="#E056FD" />
              <rect x="36" y="10" width="1" height="1" fill="#FFFFFF" />
              <rect x="42" y="9" width="3" height="3" fill="#E056FD" />
              <rect x="43" y="10" width="1" height="1" fill="#FFFFFF" />

              {/* Snout & Teeth */}
              <rect x="36" y="14" width="8" height="4" fill="#150E20" />
              <rect x="37" y="16" width="2" height="2" fill="#EAECEE" />
              <rect x="41" y="16" width="2" height="2" fill="#EAECEE" />

              {/* Purple Spine Ridge */}
              <rect x="38" y="22" width="4" height="4" fill="#8E44AD" />
              <rect x="38" y="28" width="4" height="4" fill="#9B59B6" />
              <rect x="38" y="34" width="4" height="4" fill="#8E44AD" />

              {/* Tail */}
              <rect x="37" y="44" width="6" height="8" fill="#191322" />
              <rect x="38" y="52" width="4" height="6" fill="#120D1B" />
            </svg>
          </div>

          {/* Turn Indicator Banner */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '9px',
              color: turn === 'player' ? '#2ECC71' : turn === 'boss' ? '#E74C3C' : '#F1C40F',
              backgroundColor: 'rgba(15, 10, 25, 0.85)',
              padding: '4px 12px',
              border: '1px solid #5B2C6F',
            }}
          >
            {turn === 'player' && '👉 YOUR TURN: SELECT ACTION'}
            {turn === 'boss' && '⚠️ BOSS ATTACKING!'}
            {turn === 'victory' && '🎉 BOSS VANQUISHED!'}
            {turn === 'defeat' && '💀 CODE BASE CORRUPTED!'}
          </div>
        </div>

        {/* Player Status HUD & Actions Bar */}
        <div
          style={{
            backgroundColor: '#140F22',
            padding: '12px 16px',
            borderBottom: '2px solid #3A1F5D',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Player Stats (Hearts & Potions) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {/* 10 Pixel Hearts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '9px',
                  color: '#BDC3C7',
                  marginRight: '4px',
                }}
              >
                HP:
              </span>
              {Array.from({ length: 10 }).map((_, index) => {
                const heartValue = (index + 1) * 2;
                const isFull = playerHp >= heartValue;
                const isHalf = !isFull && playerHp >= heartValue - 1;
                return (
                  <PixelIcon
                    key={index}
                    name="heart"
                    size={12}
                    color={isFull ? '#E74C3C' : isHalf ? '#E67E22' : '#4A5260'}
                  />
                );
              })}
              <span
                style={{
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '10px',
                  color: '#ECF0F1',
                  marginLeft: '4px',
                }}
              >
                ({playerHp}/{maxPlayerHp})
              </span>
            </div>

            {/* Coffee Potions & Shield Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {shieldActive && (
                <span
                  style={{
                    backgroundColor: 'rgba(52, 152, 219, 0.25)',
                    border: '1px solid #3498DB',
                    color: '#5DADE2',
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '8px',
                    padding: '2px 6px',
                  }}
                >
                  🛡️ SHIELD READY (-75%)
                </span>
              )}
              <span
                style={{
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '11px',
                  color: '#F39C12',
                }}
              >
                ☕ POTIONS: {potions}/3
              </span>
            </div>
          </div>

          {/* Action Buttons (Disabled if not player turn or game over) */}
          {turn === 'player' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              <button
                type="button"
                className="bb-btn bb-btn-emerald"
                onClick={handleSwordAttack}
                style={{
                  fontSize: '9px',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <PixelIcon name="swords" size={10} /> SLAY BLADE
              </button>

              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={handleDefend}
                style={{
                  fontSize: '9px',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <PixelIcon name="shield" size={10} /> TYPEGUARD
              </button>

              <button
                type="button"
                className="bb-btn bb-btn-gold"
                onClick={handleUsePotion}
                disabled={potions <= 0 || playerHp >= maxPlayerHp}
                style={{
                  fontSize: '9px',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: potions <= 0 || playerHp >= maxPlayerHp ? 0.5 : 1,
                }}
              >
                <PixelIcon name="star" size={10} /> JAVA HEAL (+10)
              </button>

              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={handleKnowledgeSpell}
                disabled={knowledgeSpellUsed}
                style={{
                  fontSize: '9px',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  borderColor: knowledgeSpellUsed ? '#34495E' : '#9B59B6',
                  color: knowledgeSpellUsed ? '#7F8C8D' : '#D2B4DE',
                  opacity: knowledgeSpellUsed ? 0.5 : 1,
                }}
              >
                <PixelIcon name="book" size={10} /> CODEX SPELL
              </button>
            </div>
          )}

          {/* Victory Action Screen */}
          {turn === 'victory' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '12px',
                  color: 'var(--bb-color-gold)',
                }}
              >
                🎉 +150 XP & VOID SLAYER TROPHY UNLOCKED!
              </div>
              <button
                type="button"
                className="bb-btn bb-btn-gold"
                onClick={handleClaimVictory}
                style={{
                  padding: '10px 24px',
                  fontSize: '11px',
                  fontFamily: 'var(--bb-font-pixel-display)',
                }}
              >
                CLAIM 150 XP & ARCHIVE TO GRAVEYARD
              </button>
            </div>
          )}

          {/* Defeat Action Screen */}
          {turn === 'defeat' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                padding: '8px',
              }}
            >
              <button
                type="button"
                className="bb-btn bb-btn-emerald"
                onClick={handleRetry}
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  padding: '8px 16px',
                }}
              >
                TRY AGAIN
              </button>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={onClose}
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  padding: '8px 16px',
                }}
              >
                RESPAWN AT BASE CAMP
              </button>
            </div>
          )}
        </div>

        {/* Retro Combat Battle Log */}
        <div
          style={{
            backgroundColor: '#09070D',
            padding: '10px 14px',
            maxHeight: '130px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontFamily: 'var(--bb-font-code)',
            fontSize: '11px',
            lineHeight: 1.35,
          }}
          aria-label="Combat Event Log"
        >
          {combatLogs.map((log) => {
            const color =
              log.sender === 'player'
                ? '#58D68D'
                : log.sender === 'boss'
                ? '#EC7063'
                : '#F4D03F';
            return (
              <div key={log.id} style={{ color }}>
                {log.message}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
