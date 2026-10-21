/**
 * The progression engine — XP, levels, achievements, and the daily checklist.
 * Pure logic: no React, no Convex. The server computes the same numbers with
 * these same constants, so the UI can never drift from the backend.
 */

export type DailyActionId = "take" | "quiz" | "reframe" | "reset" | "translate";

export interface DailyActionDef {
  id: DailyActionId;
  label: string;
  detail: string;
  xp: number;
}

/** XP for each action. Mirrored in convex/dailyLog.ts — keep in sync. */
export const XP = {
  take: 30,
  quiz: 15,
  reframe: 20,
  reset: 10,
  translate: 20,
  personalBest: 25,
  dailySweep: 40,
} as const;

export const DAILY_ACTIONS: DailyActionDef[] = [
  { id: "take", label: "Try a drill", detail: "Pick one and speak into your mic", xp: XP.take },
  { id: "quiz", label: "Read the Room", detail: "Choose how you'd respond", xp: XP.quiz },
  { id: "reframe", label: "Try another response", detail: "Write what you'd rather say", xp: XP.reframe },
  { id: "reset", label: "Take a breather", detail: "Try one 4-7-8 breathing session", xp: XP.reset },
];

/**
 * The daily checklist is intentionally the four core habits — `translate`
 * awards its own XP but does not count toward the sweep, so the checklist
 * stays a fixed 4-slot contract (the server sweep math depends on it).
 */
export const CHECKLIST_ACTIONS: DailyActionId[] = DAILY_ACTIONS.map((a) => a.id);

/** Percentage of the daily checklist completed (0..100). */
export function dailyProgressPct(completed: DailyActionId[]): number {
  const done = new Set(completed.filter((c): c is DailyActionId => CHECKLIST_ACTIONS.includes(c as DailyActionId)));
  return Math.round((done.size / CHECKLIST_ACTIONS.length) * 100);
}

// ---- Levels ----

const LEVELS = [
  { label: "Warm-Up", min: 0 },
  { label: "Steady Hand", min: 150 },
  { label: "Clear Signal", min: 400 },
  { label: "Cool Head", min: 800 },
  { label: "Calibrated", min: 1400 },
  { label: "Room Reader", min: 2200 },
  { label: "Signature Tone", min: 3200 },
  { label: "Gravitas", min: 4600 },
] as const;

export interface LevelInfo {
  level: number;
  label: string;
  /** XP earned inside the current level band. */
  into: number;
  /** Width of the current band (0 at max level). */
  needed: number;
  progressPct: number;
  xpToNext: number;
  nextLabel?: string;
  maxed: boolean;
}

export function levelInfo(totalXp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].min) idx = i;
  }
  const next = LEVELS[idx + 1];
  const current = LEVELS[idx].min;
  const needed = next ? next.min - current : 0;
  const into = totalXp - current;
  return {
    level: idx + 1,
    label: LEVELS[idx].label,
    into,
    needed,
    progressPct: next ? Math.min(100, Math.round((into / needed) * 100)) : 100,
    xpToNext: next ? Math.max(0, next.min - totalXp) : 0,
    nextLabel: next?.label,
    maxed: !next,
  };
}

// ---- Achievements ----

export interface AchievementStats {
  totalSessions: number;
  totalMinutes: number;
  bestOverall: number;
  totalQuiz: number;
  totalReframes: number;
  totalResets: number;
  streakDays: number;
  /** Distinct drills attempted. */
  drillsTried: number;
  /** Total drills in the catalog. */
  drills: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  detail: string;
  tier: "bronze" | "silver" | "gold";
  test: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-word",
    name: "First Word",
    detail: "Record your first practice take",
    tier: "bronze",
    test: (s) => s.totalSessions >= 1,
  },
  {
    id: "full-circuit",
    name: "Full Circuit",
    detail: "Give every drill a try",
    tier: "gold",
    test: (s) => s.drills > 0 && s.drillsTried >= s.drills,
  },
  {
    id: "week-streak",
    name: "A week of practice",
    detail: "Practice seven days in a row",
    tier: "silver",
    test: (s) => s.streakDays >= 7,
  },
  {
    id: "high-score",
    name: "Personal Record",
    detail: "Score 85+ on any drill",
    tier: "silver",
    test: (s) => s.bestOverall >= 85,
  },
  {
    id: "room-reader",
    name: "Room Reader",
    detail: "Work through 10 Read-the-Room scenarios",
    tier: "bronze",
    test: (s) => s.totalQuiz >= 10,
  },
  {
    id: "reframer",
    name: "A different approach",
    detail: "Reframe five moments in the lab",
    tier: "silver",
    test: (s) => s.totalReframes >= 5,
  },
  {
    id: "deep-breaths",
    name: "Take a breather",
    detail: "Complete ten breathing sessions",
    tier: "bronze",
    test: (s) => s.totalResets >= 10,
  },
  {
    id: "ten-takes",
    name: "Ten takes",
    detail: "Complete 10 practice takes",
    tier: "bronze",
    test: (s) => s.totalSessions >= 10,
  },
  {
    id: "sixty-minutes",
    name: "An hour of practice",
    detail: "Sixty total minutes of practice",
    tier: "gold",
    test: (s) => s.totalMinutes >= 60,
  },
];

/** Ids of every achievement the stats satisfy. */
export function earnedAchievements(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id);
}
