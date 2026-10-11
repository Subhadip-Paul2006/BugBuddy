export type ByteBuddyMood = 
  | 'ECSTATIC'
  | 'HAPPY'
  | 'NEUTRAL'
  | 'DISAPPOINTED'
  | 'DRAMATIC_DESPAIR';

export type NavigationTab = 
  | 'base-camp'
  | 'confession'
  | 'chat'
  | 'quests'
  | 'habitat'
  | 'graveyard'
  | 'codex'
  | 'settings';

export interface PlayerProfile {
  handle: string;
  title: string;
  level: number;
  currentXP: number;
  maxXP: number;
  streakDays: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

export interface SprintTask {
  id: string;
  title: string;
  deadlineMinutes: number;
  isCompleted: boolean;
  isSnoozed: boolean;
}

export interface RecentBug {
  id: string;
  title: string;
  language: 'C' | 'C++' | 'Java' | 'Python' | 'JavaScript' | 'TypeScript';
  category: string;
  slayedAt: string;
  xpAwarded: number;
  status: 'RESOLVED' | 'DIAGNOSED';
}

export interface CodexCitation {
  id: string;
  title: string;
  category: 'standard' | 'security' | 'compiler_spec' | 'manual';
  language: string;
  excerpt: string;
  sourceUrl: string;
  confidenceScore: number;
}

/* ==========================================================================
   Bug Confession Booth Types (Prompt 03)
   ========================================================================== */

export type CanonicalLanguage =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'typescript';

export interface ConfessionSubmission {
  code: string;
  language: CanonicalLanguage;
  errorTrace?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface SecretDetection {
  type: 'api_key' | 'jwt' | 'bearer_token' | 'password' | 'private_key' | 'generic_secret';
  label: string;
  line: number;
  matchPattern: string;
}

export interface SecretScanResult {
  hasSecrets: boolean;
  detections: SecretDetection[];
  redactedCode: string;
  warningMessage: string;
}

export interface ConfessionSource {
  title?: string;
  url: string;
  recordId?: string;
  recordTitle?: string;
  language?: CanonicalLanguage;
  category?: string;
  isPrimary?: boolean;
}

export interface ConfessionResult {
  id: string;
  title: string;
  language: CanonicalLanguage;
  category: string;
  difficulty?: string;
  roast: string;
  diagnosis: string;
  symptoms: string;
  debuggingSteps: string[];
  buggyCode: string;
  fixedCode: string;
  whyItWorks: string;
  tests: string;
  sources: ConfessionSource[];
  isDemo: boolean;
  demoDisclaimer?: string;
  timestamp: string;
  responseMode?: 'DIRECT_MATCH' | 'RELATED_GUIDANCE' | 'AMBIGUOUS_EVIDENCE' | 'NO_MATCH';
  matchedKnowledgeIds?: string[];
  attributedSources?: ConfessionSource[];
  limitations?: string[];
  rootCause?: string;
  suggestedFixExplanation?: string;
  isGrounded?: boolean;
  providerId?: string;
  modelId?: string;
  executionTimeMs?: number;
  usedFallback?: boolean;
  minimalDiff?: string;
}

export type ConfessionStatus =
  | 'IDLE'
  | 'VALIDATING'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'NO_MATCH'
  | 'ERROR';

/* ==========================================================================
   Debugging Chat Workbench Types (Screen C / Phase 3)
   ========================================================================== */

export type FollowUpActionType =
  | 'simpler'
  | 'deeper'
  | 'minimal_diff'
  | 'worked_example'
  | 'more_tests'
  | 'explain_line'
  | 'roast_again';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  diagnosisResult?: ConfessionResult;
  suggestedActionChips?: FollowUpActionType[];
  codeSnippet?: string;
  codeLanguage?: CanonicalLanguage;
  isActionResponse?: boolean;
  isDemo?: boolean;
  demoDisclaimer?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  language: CanonicalLanguage;
  status: 'Diagnosed' | 'Debugging' | 'Resolved';
  messages: ChatMessage[];
  createdAt: string;
}

