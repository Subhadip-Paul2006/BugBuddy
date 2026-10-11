import { PlayerProfile, DailyQuest, SprintTask, RecentBug, ByteBuddyMood } from '../types';

export const INITIAL_PLAYER: PlayerProfile = {
  handle: 'DevCrafter',
  title: 'Console.log Archaeologist',
  level: 3,
  currentXP: 520,
  maxXP: 800,
  streakDays: 4,
};

export const MOCK_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest-1',
    title: 'Confess a C or C++ Pointer Bug',
    description: 'Confront the altar with raw memory dereferencing sins.',
    rewardXP: 50,
    progress: 1,
    maxProgress: 1,
    completed: true,
  },
  {
    id: 'quest-2',
    title: "Request 'More Debugging Tests' in Chat",
    description: 'Ask ByteBuddy for unit test assertions to prevent regressions.',
    rewardXP: 30,
    progress: 0,
    maxProgress: 1,
    completed: false,
  },
  {
    id: 'quest-3',
    title: 'Complete a Sprint Task before deadline',
    description: 'Defeat procrastination without hitting the snooze button.',
    rewardXP: 75,
    progress: 1,
    maxProgress: 2,
    completed: false,
  },
];

export const MOCK_SPRINT_TASKS: SprintTask[] = [
  {
    id: 'task-1',
    title: 'Refactor async token refresh in auth service',
    deadlineMinutes: 24,
    isCompleted: false,
    isSnoozed: false,
  },
  {
    id: 'task-2',
    title: 'Fix TS2322 type mismatch in user profile interface',
    deadlineMinutes: 45,
    isCompleted: false,
    isSnoozed: false,
  },
  {
    id: 'task-3',
    title: 'Fix off-by-one loop index in Python data loader',
    deadlineMinutes: 0,
    isCompleted: true,
    isSnoozed: false,
  },
];

export const MOCK_RECENT_BUGS: RecentBug[] = [
  {
    id: 'bug-104',
    title: 'Segmentation fault: 11 (char *ptr = NULL dereference)',
    language: 'C',
    category: 'Memory Management',
    slayedAt: 'Today, 10:42 AM',
    xpAwarded: 50,
    status: 'RESOLVED',
  },
  {
    id: 'bug-103',
    title: 'ConcurrentModificationException in EventBus listener loop',
    language: 'Java',
    category: 'Concurrency',
    slayedAt: 'Yesterday, 4:15 PM',
    xpAwarded: 75,
    status: 'RESOLVED',
  },
  {
    id: 'bug-102',
    title: 'UnhandledPromiseRejection: Cannot read properties of undefined',
    language: 'TypeScript',
    category: 'Async Flow',
    slayedAt: '2 days ago',
    xpAwarded: 50,
    status: 'RESOLVED',
  },
];

export const MOOD_QUOTES: Record<ByteBuddyMood, string> = {
  ECSTATIC:
    '"Three bugs slayed in a row! Are you secretly a 10x developer in disguise?"',
  HAPPY:
    '"Another syntax error conquered. The base campfire burns warm and peaceful."',
  NEUTRAL:
    '"The code compiles. The tests pass. For now. What disaster are we engineering next?"',
  DISAPPOINTED:
    '"I have watched glaciers melt faster than your pull request review."',
  DRAMATIC_DESPAIR:
    '"I am collapsing into the void. Even TypeScript couldn\'t save us from this null pointer."',
};
