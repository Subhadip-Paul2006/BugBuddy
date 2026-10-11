/**
 * BugBuddy — Versioned Client-Side Persistence Engine
 * Specification: Prompt 12 Phase 5 & docs/UI_UX.md
 * 
 * Provides safe, versioned local storage persistence for:
 * - Developer profile (XP, level, streak)
 * - Language selection preferences
 * - Quest progress and sprint task state
 * - Opt-in Bug Graveyard history (default off to protect sensitive user code)
 * 
 * Guarantees:
 * - Versioned schema keys to prevent stale or corrupt storage crashes.
 * - Graceful fallback to initial mock state when localStorage is disabled or throws QuotaExceededError.
 * - Sensitive source code and submissions are kept in session memory by default.
 * - User-facing reset actions for clearing all local data.
 */

import { PlayerProfile, DailyQuest, SprintTask, CanonicalLanguage } from '../types';
import { INITIAL_PLAYER, MOCK_DAILY_QUESTS, MOCK_SPRINT_TASKS } from '../mock/mockData';
import type { GraveyardBugEntry } from '../components/graveyard/BugGraveyard';

const STORAGE_PREFIX = 'bugbuddy_v1_';
const KEYS = {
  PLAYER: `${STORAGE_PREFIX}player_profile`,
  DAILY_QUESTS: `${STORAGE_PREFIX}daily_quests`,
  SPRINT_TASKS: `${STORAGE_PREFIX}sprint_tasks`,
  AWARDED_XP_IDS: `${STORAGE_PREFIX}awarded_xp_ids`,
  LANGUAGE: `${STORAGE_PREFIX}persisted_language`,
  GRAVEYARD_OPT_IN: `${STORAGE_PREFIX}graveyard_opt_in`,
  GRAVEYARD_BUGS: `${STORAGE_PREFIX}graveyard_bugs`,
};

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }
  try {
    const testKey = `${STORAGE_PREFIX}probe`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads persisted player profile or defaults to INITIAL_PLAYER.
 */
export function loadPlayerProfile(): PlayerProfile {
  if (!isStorageAvailable()) return INITIAL_PLAYER;
  try {
    const raw = window.localStorage.getItem(KEYS.PLAYER);
    if (!raw) return INITIAL_PLAYER;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.level === 'number' && typeof parsed?.currentXP === 'number') {
      return {
        ...INITIAL_PLAYER,
        ...parsed,
      };
    }
    return INITIAL_PLAYER;
  } catch {
    return INITIAL_PLAYER;
  }
}

/**
 * Saves player profile to versioned local storage.
 */
export function savePlayerProfile(profile: PlayerProfile): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.PLAYER, JSON.stringify(profile));
  } catch {
    // Quota exceeded or private browsing restriction; fail silently
  }
}

/**
 * Loads persisted daily quests or defaults to MOCK_DAILY_QUESTS.
 */
export function loadDailyQuests(): DailyQuest[] {
  if (!isStorageAvailable()) return MOCK_DAILY_QUESTS;
  try {
    const raw = window.localStorage.getItem(KEYS.DAILY_QUESTS);
    if (!raw) return MOCK_DAILY_QUESTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_DAILY_QUESTS;
  } catch {
    return MOCK_DAILY_QUESTS;
  }
}

/**
 * Saves daily quests.
 */
export function saveDailyQuests(quests: DailyQuest[]): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.DAILY_QUESTS, JSON.stringify(quests));
  } catch {}
}

/**
 * Loads sprint tasks or defaults to MOCK_SPRINT_TASKS.
 */
export function loadSprintTasks(): SprintTask[] {
  if (!isStorageAvailable()) return MOCK_SPRINT_TASKS;
  try {
    const raw = window.localStorage.getItem(KEYS.SPRINT_TASKS);
    if (!raw) return MOCK_SPRINT_TASKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_SPRINT_TASKS;
  } catch {
    return MOCK_SPRINT_TASKS;
  }
}

/**
 * Saves sprint tasks.
 */
export function saveSprintTasks(tasks: SprintTask[]): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.SPRINT_TASKS, JSON.stringify(tasks));
  } catch {}
}

/**
 * Loads set of IDs for quests/tasks that have already awarded XP.
 */
export function loadAwardedXPIds(): Set<string> {
  const defaultSet = new Set<string>();
  MOCK_DAILY_QUESTS.filter((q) => q.completed).forEach((q) => defaultSet.add(q.id));
  MOCK_SPRINT_TASKS.filter((t) => t.isCompleted).forEach((t) => defaultSet.add(t.id));

  if (!isStorageAvailable()) return defaultSet;
  try {
    const raw = window.localStorage.getItem(KEYS.AWARDED_XP_IDS);
    if (!raw) return defaultSet;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((id) => defaultSet.add(id));
    }
    return defaultSet;
  } catch {
    return defaultSet;
  }
}

/**
 * Saves awarded XP IDs to prevent duplicate XP awards across reloads.
 */
export function saveAwardedXPIds(ids: Set<string>): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.AWARDED_XP_IDS, JSON.stringify(Array.from(ids)));
  } catch {}
}

/**
 * Loads preferred language or defaults to 'python'.
 */
export function loadPersistedLanguage(): CanonicalLanguage {
  if (!isStorageAvailable()) return 'python';
  try {
    const raw = window.localStorage.getItem(KEYS.LANGUAGE);
    if (raw && ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'].includes(raw)) {
      return raw as CanonicalLanguage;
    }
    return 'python';
  } catch {
    return 'python';
  }
}

/**
 * Saves preferred language.
 */
export function savePersistedLanguage(lang: CanonicalLanguage): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.LANGUAGE, lang);
  } catch {}
}

/**
 * Check whether developer opted into persistent Bug Graveyard history.
 * Default is FALSE to protect sensitive user code from lingering in browser storage.
 */
export function getGraveyardOptIn(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    return window.localStorage.getItem(KEYS.GRAVEYARD_OPT_IN) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets opt-in preference for persistent Graveyard history.
 */
export function setGraveyardOptIn(optIn: boolean): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(KEYS.GRAVEYARD_OPT_IN, optIn ? 'true' : 'false');
    if (!optIn) {
      // If user disables persistence, immediately purge stored graveyard entries
      window.localStorage.removeItem(KEYS.GRAVEYARD_BUGS);
    }
  } catch {}
}

/**
 * Loads persisted graveyard bugs if opt-in is enabled.
 */
export function loadGraveyardBugs(fallback: GraveyardBugEntry[]): GraveyardBugEntry[] {
  if (!isStorageAvailable() || !getGraveyardOptIn()) return fallback;
  try {
    const raw = window.localStorage.getItem(KEYS.GRAVEYARD_BUGS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Saves graveyard bugs if opt-in is enabled.
 */
export function saveGraveyardBugs(bugs: GraveyardBugEntry[]): void {
  if (!isStorageAvailable() || !getGraveyardOptIn()) return;
  try {
    window.localStorage.setItem(KEYS.GRAVEYARD_BUGS, JSON.stringify(bugs));
  } catch {}
}

/**
 * Completely purges all BugBuddy local storage keys and resets to initial factory state.
 */
export function resetAllUserData(): void {
  if (!isStorageAvailable()) return;
  try {
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.removeItem('bugbuddy_user_preferences');
  } catch {}
}
