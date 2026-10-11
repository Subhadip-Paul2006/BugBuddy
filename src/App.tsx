
import React, { useState, useEffect } from 'react';
import { NavigationTab, ByteBuddyMood, PlayerProfile, CanonicalLanguage, ConfessionResult } from './types';
import { MOCK_DAILY_QUESTS, MOCK_SPRINT_TASKS } from './mock/mockData';
import { GameHUD } from './components/hud/GameHUD';
import { DeveloperInventory } from './components/navigation/DeveloperInventory';
import { BaseCampDashboard } from './components/dashboard/BaseCampDashboard';
import { BugConfessionBooth } from './components/confession/BugConfessionBooth';
import { DebugChat } from './components/chat/DebugChat';
import { PetStatusPanel } from './components/pet/PetStatusPanel';
import { PetHabitat } from './components/habitat/PetHabitat';
import { QuestBoard } from './components/quests/QuestBoard';
import { BugGraveyard, DEFAULT_GRAVEYARD_BUGS, GraveyardBugEntry } from './components/graveyard/BugGraveyard';
import { KnowledgeCodex } from './components/codex/KnowledgeCodex';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { PlaceholderScreen } from './components/placeholders/PlaceholderScreen';
import { BossFightModal } from './components/boss/BossFightModal';
import {
  setSfxMuted,
  toggleMusic,
  nextMusicTrack,
  getCurrentTrack,
  playXpGainSound,
  playLevelUpSound,
  playClickSound,
} from './utils/audioSystem';
import {
  loadPlayerProfile,
  savePlayerProfile,
  loadPersistedLanguage,
  savePersistedLanguage,
  loadGraveyardBugs,
  saveGraveyardBugs,
} from './utils/storage';

export const App: React.FC = () => {
  const [player, setPlayer] = useState<PlayerProfile>(loadPlayerProfile);
  const [activeTab, setActiveTab] = useState<NavigationTab>('base-camp');
  const [mood, setMood] = useState<ByteBuddyMood>('HAPPY');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackName, setCurrentTrackName] = useState(getCurrentTrack().name);
  const [persistedLanguage, setPersistedLanguageState] = useState<CanonicalLanguage>(loadPersistedLanguage);
  const [confessionSnippet, setConfessionSnippet] = useState<string>('');
  const [graveyardBugs, setGraveyardBugs] = useState<GraveyardBugEntry[]>(() =>
    loadGraveyardBugs(DEFAULT_GRAVEYARD_BUGS)
  );
  const [isBossFightActive, setIsBossFightActive] = useState(false);

  const setPersistedLanguage = (lang: CanonicalLanguage) => {
    setPersistedLanguageState(lang);
    savePersistedLanguage(lang);
  };

  useEffect(() => {
    savePlayerProfile(player);
  }, [player]);

  useEffect(() => {
    saveGraveyardBugs(graveyardBugs);
  }, [graveyardBugs]);

  // Register global 8-bit sound blip for any button or clickable element across the entire UI
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest('button, [role="button"], .bb-btn, .bb-inventory-slot, .bb-tab, input[type="button"], input[type="submit"]');
      if (clickable) {
        playClickSound();
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  const handleAddXP = (amount: number) => {
    playXpGainSound();
    setPlayer((prev) => {
      const nextXP = prev.currentXP + amount;
      if (nextXP >= prev.maxXP) {
        // Level up celebration!
        playLevelUpSound();
        return {
          ...prev,
          level: prev.level + 1,
          currentXP: nextXP - prev.maxXP,
          maxXP: Math.round(prev.maxXP * 1.3),
        };
      }
      return { ...prev, currentXP: nextXP };
    });
  };

  // Truthful Diagnosis Lifecycle:
  // Diagnosis does NOT resolve the bug or award XP prematurely.
  const handleConfessionDiagnosis = (result: ConfessionResult, code: string) => {
    const newEntry: GraveyardBugEntry = {
      id: `confession-${result.id || Date.now()}`,
      title: result.title || 'Confessed Anomaly',
      language: result.language,
      category: result.category || 'General Bug',
      slayedAt: 'Diagnosed (Verification Pending)',
      xpAwarded: 0,
      status: 'DIAGNOSED',
      isSeededExample: false,
      diagnosis: result.diagnosis || result.rootCause,
      buggyCode: code || result.buggyCode,
      fixedCode: result.fixedCode,
      whyItWorks: result.whyItWorks,
      tests: result.tests,
      sources: result.attributedSources || result.sources,
    };
    setGraveyardBugs((prev) => [newEntry, ...prev.filter((b) => b.id !== newEntry.id)]);
  };

  // Explicit developer verification action: Awards +50 XP and resolves the bug
  const handleConfessionVerifyAndResolve = (result: ConfessionResult) => {
    handleAddXP(50);
    setGraveyardBugs((prev) =>
      prev.map((entry) => {
        if (entry.id === `confession-${result.id || ''}` || entry.title === result.title) {
          return {
            ...entry,
            status: 'RESOLVED',
            xpAwarded: 50,
            slayedAt: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Live Session)`,
          };
        }
        return entry;
      })
    );
  };

  const handleDefeatBoss = (rewardXP: number) => {
    handleAddXP(rewardXP);
    setMood('ECSTATIC');
    const bossEntry: GraveyardBugEntry = {
      id: `boss-defeat-${Date.now()}`,
      title: 'Ender Dragon: Corrupted Void Bug',
      language: 'typescript',
      category: 'Boss Raid',
      slayedAt: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Boss Slay)`,
      xpAwarded: rewardXP,
      status: 'RESOLVED',
      diagnosis: 'The Void Dragon dared to dereference a null pointer in the presence of ByteBuddy. It was obliterated into pixel dust.',
    };
    setGraveyardBugs((prev) => [bossEntry, ...prev]);
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      setSfxMuted(!next);
      return next;
    });
  };

  const handleToggleMusic = () => {
    playClickSound();
    const isPlaying = toggleMusic();
    setIsMusicPlaying(isPlaying);
    setCurrentTrackName(getCurrentTrack().name);
  };

  const handleNextTrack = () => {
    playClickSound();
    const name = nextMusicTrack();
    setCurrentTrackName(name);
  };

  const handleOpenSettings = () => {
    setActiveTab('settings');
  };

  return (
    <div className="bb-app-layout">
      {/* 1. Sticky Top Game HUD */}
      <GameHUD
        player={player}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        onOpenSettings={handleOpenSettings}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={handleToggleMusic}
        currentTrackName={currentTrackName}
        onNextTrack={handleNextTrack}
      />

      {/* 2. Main Three-Column Application Shell */}
      <div className="bb-app-body">
        {/* Left: Collapsible Developer Inventory Hotbar */}
        <DeveloperInventory
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        />

        {/* Center: Main Active Screen */}
        <main
          className="bb-main-content"
          role="main"
          style={{
            flex: 1,
            overflowY: 'auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'base-camp' ? (
            <BaseCampDashboard
              mood={mood}
              onSetMood={setMood}
              onNavigate={setActiveTab}
              onAddXP={handleAddXP}
              onTriggerBossFight={() => setIsBossFightActive(true)}
            />
          ) : activeTab === 'confession' ? (
            <BugConfessionBooth
              initialLanguage={persistedLanguage}
              initialCode={confessionSnippet}
              onLanguageChange={setPersistedLanguage}
              onSetMood={setMood}
              onReturnToBaseCamp={() => setActiveTab('base-camp')}
              onConfessionSuccess={handleConfessionDiagnosis}
              onVerifyAndResolve={handleConfessionVerifyAndResolve}
            />
          ) : activeTab === 'chat' ? (
            <DebugChat
              language={persistedLanguage}
              onSetMood={setMood}
              onAddXP={handleAddXP}
              onReturnToBaseCamp={() => setActiveTab('base-camp')}
              onNavigateToConfession={() => setActiveTab('confession')}
            />
          ) : activeTab === 'habitat' ? (
            <PetHabitat
              mood={mood}
              onSetMood={setMood}
              onNavigateToBaseCamp={() => setActiveTab('base-camp')}
              onNavigateToConfession={() => setActiveTab('confession')}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          ) : activeTab === 'quests' ? (
            <QuestBoard
              onAddXP={handleAddXP}
              onSetMood={setMood}
              onNavigate={setActiveTab}
            />
          ) : activeTab === 'graveyard' ? (
            <BugGraveyard
              initialBugs={graveyardBugs}
              onNavigate={setActiveTab}
              onSelectLanguageForConfession={setPersistedLanguage}
            />
          ) : activeTab === 'codex' ? (
            <KnowledgeCodex
              onNavigate={setActiveTab}
              onSelectSnippetForConfession={(code, lang) => {
                setPersistedLanguage(lang);
                setConfessionSnippet(code);
                setActiveTab('confession');
              }}
            />
          ) : activeTab === 'settings' ? (
            <SettingsScreen
              onNavigate={setActiveTab}
              isAudioEnabled={isAudioEnabled}
              onToggleAudio={handleToggleAudio}
              onSetMood={setMood}
            />
          ) : (
            <PlaceholderScreen
              tab={activeTab}
              onReturnToBaseCamp={() => setActiveTab('base-camp')}
            />
          )}
        </main>

        {/* Right: Companion Status & Active Quest Drawer */}
        <PetStatusPanel
          mood={mood}
          onSetMood={setMood}
          activeQuest={MOCK_DAILY_QUESTS[0]}
          activeTask={MOCK_SPRINT_TASKS[0]}
          onNavigateToQuests={() => setActiveTab('quests')}
          onNavigateToConfession={() => setActiveTab('confession')}
        />
      </div>

      {/* Ender Dragon Boss Fight Raid Modal */}
      <BossFightModal
        isOpen={isBossFightActive}
        onClose={() => setIsBossFightActive(false)}
        onDefeatBoss={handleDefeatBoss}
      />
    </div>
  );
};

export default App;
