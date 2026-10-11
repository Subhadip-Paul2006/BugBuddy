/**
 * BugBuddy — Boss Raid Encounter & Advanced Pet Customization Test Suite
 * Specification: Phase 4 Gamified Boss Fights & Interactive Companions
 */

import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { BossFightModal } from '../src/components/boss/BossFightModal';
import { ByteBuddySprite } from '../src/components/pet/ByteBuddySprite';
import { PetHabitat } from '../src/components/habitat/PetHabitat';
import { BaseCampDashboard } from '../src/components/dashboard/BaseCampDashboard';
import {
  playBossRoarSound,
  playDragonBreathSound,
  playSwordSlashSound,
  playBossVictoryFanfare,
  playPetChirpSound,
  setSfxMuted,
} from '../src/utils/audioSystem';

describe('Phase 4 — Ender Dragon Boss Fight & Combat System', () => {
  it('1. should render BossFightModal with Ender Dragon boss bar, 100 HP, and combat actions when open', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BossFightModal, {
        isOpen: true,
        onClose: () => {},
        onDefeatBoss: () => {},
      })
    );

    assert.ok(html.includes('ENDER RAID'), 'Modal should display Ender Raid title');
    assert.ok(html.includes('HEISENBUG OF THE VOID'), 'Modal should display boss subtitle');
    assert.ok(html.includes('100 / 100 HP') || html.includes('100 HP'), 'Modal should show 100 HP boss bar');
    assert.ok(html.includes('SLAY BLADE'), 'Should contain Slay Blade action button');
    assert.ok(html.includes('TYPEGUARD'), 'Should contain TypeGuard Shield action button');
    assert.ok(html.includes('JAVA HEAL'), 'Should contain Java Heal potion button');
    assert.ok(html.includes('CODEX SPELL'), 'Should contain Codex Spell button');
    assert.ok(html.includes('RETREAT'), 'Should provide tactical retreat button');
  });

  it('2. should not render any markup when BossFightModal isOpen is false', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BossFightModal, {
        isOpen: false,
        onClose: () => {},
        onDefeatBoss: () => {},
      })
    );

    assert.equal(html, '', 'Modal should render nothing when isOpen is false');
  });

  it('3. should render 10 player heart icons and potions counter in BossFightModal', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BossFightModal, {
        isOpen: true,
        onClose: () => {},
        onDefeatBoss: () => {},
      })
    );

    assert.ok(html.includes('20/20') || html.includes('HP:'), 'Should render player HP counter');
    assert.ok(html.includes('POTIONS: 3/3'), 'Should display initial 3 potions');
  });

  it('4. should render Boss Raid summon button on BaseCampDashboard when onTriggerBossFight is provided', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BaseCampDashboard, {
        mood: 'HAPPY',
        onSetMood: () => {},
        onNavigate: () => {},
        onAddXP: () => {},
        onTriggerBossFight: () => {},
      })
    );

    assert.ok(html.includes('SUMMON BOSS RAID'), 'BaseCampDashboard should render Boss Raid summon button');
  });
});

describe('Phase 4 — Advanced Pet Customization & Animation States', () => {
  it('5. should render Minecraft Diamond Helmet accessory on ByteBuddySprite', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'HAPPY',
        accessory: 'DIAMOND_HELMET',
      })
    );

    assert.ok(html.includes('wearing DIAMOND_HELMET'), 'Aria label should indicate Diamond Helmet');
    assert.ok(html.includes('#00E5FF') || html.includes('#00B4D8'), 'Should render diamond cyan pixels');
  });

  it('6. should render Wizard Hat and Night Cap accessories on ByteBuddySprite', () => {
    const wizardHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'NEUTRAL',
        accessory: 'WIZARD_HAT',
      })
    );
    assert.ok(wizardHtml.includes('wearing WIZARD_HAT'), 'Should indicate Wizard Hat');
    assert.ok(wizardHtml.includes('#8E44AD') || wizardHtml.includes('#7D3C98'), 'Should render wizard purple');

    const nightCapHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'DISAPPOINTED',
        accessory: 'NIGHT_CAP',
      })
    );
    assert.ok(nightCapHtml.includes('wearing NIGHT_CAP'), 'Should indicate Night Cap');
    assert.ok(nightCapHtml.includes('#2980B9') || nightCapHtml.includes('#ECF0F1'), 'Should render night cap pixels');
  });

  it('7. should support interactive click-to-poke mode with button semantics', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'HAPPY',
        interactive: true,
        onClick: () => {},
      })
    );

    assert.ok(html.includes('bytebuddy-interactive'), 'Should have interactive class');
    assert.ok(html.includes('role="button"'), 'Should expose button accessibility role');
  });

  it('8. should render DANCE, SPIN, and POKE animation keyframes on ByteBuddySprite', () => {
    const danceHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'HAPPY',
        animation: 'DANCE',
      })
    );
    assert.ok(danceHtml.includes('bytebuddy-dance'), 'Should apply bytebuddy-dance animation');

    const spinHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'HAPPY',
        animation: 'SPIN',
      })
    );
    assert.ok(spinHtml.includes('bytebuddy-spin'), 'Should apply bytebuddy-spin animation');

    const pokeHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ByteBuddySprite, {
        mood: 'HAPPY',
        animation: 'POKE',
      })
    );
    assert.ok(pokeHtml.includes('bytebuddy-poke'), 'Should apply bytebuddy-poke animation');
  });

  it('9. should render PetHabitat wardrobe selector and dance party controls', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PetHabitat, {
        mood: 'HAPPY',
        onSetMood: () => {},
        onNavigateToBaseCamp: () => {},
        onNavigateToConfession: () => {},
        onNavigateToChat: () => {},
      })
    );

    assert.ok(html.includes('COMPANION WARDROBE &amp; HATS') || html.includes('COMPANION WARDROBE & HATS'), 'Should render wardrobe header');
    assert.ok(html.includes('👑 Crown'), 'Should contain Crown wardrobe button');
    assert.ok(html.includes('🪖 Diamond'), 'Should contain Diamond Helmet wardrobe button');
    assert.ok(html.includes('🧙 Wizard'), 'Should contain Wizard Hat wardrobe button');
    assert.ok(html.includes('💤 Cap'), 'Should contain Night Cap wardrobe button');
    assert.ok(html.includes('DANCE PARTY'), 'Should contain Dance Party action button');
    assert.ok(html.includes('SPIN TRICK'), 'Should contain Spin Trick action button');
    assert.ok(html.includes('Click to poke!'), 'Should provide poke interaction hint');
  });
});

describe('Phase 4 — Web Audio API Boss and Pet Sound Synthesizers', () => {
  it('10. should safely invoke new audio synthesizer functions without throwing errors', () => {
    setSfxMuted(true); // muted mode in node test environment
    assert.doesNotThrow(() => playBossRoarSound(), 'Boss roar should not throw');
    assert.doesNotThrow(() => playDragonBreathSound(), 'Dragon breath should not throw');
    assert.doesNotThrow(() => playSwordSlashSound(), 'Sword slash should not throw');
    assert.doesNotThrow(() => playBossVictoryFanfare(), 'Boss victory fanfare should not throw');
    assert.doesNotThrow(() => playPetChirpSound(), 'Pet chirp should not throw');
  });
});
