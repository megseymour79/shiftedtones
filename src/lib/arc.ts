/**
 * The 21-day practice plan: week one focuses on calm, week two on warmth
 * and firmness, and week three on applying those skills to real sentences.
 * Pure data + helpers; the Dashboard shows the user's current day and stage.
 */

export interface ArcStage {
  id: string;
  name: string;
  /** Days covered, 1-indexed inclusive. */
  from: number;
  to: number;
  /** The theme, in the app's voice. */
  promise: string;
  /** The daily move for this stage. */
  move: string;
  /** Why this order — the through-line. */
  why: string;
}

export const ARC_STAGES: ArcStage[] = [
  {
    id: "floor",
    name: "The Floor",
    from: 1,
    to: 7,
    promise: "Build a steady foundation",
    move: "Try Steady Ground once a day, then take a moment to reset.",
    why: "Start by practicing a steady tone so it's easier to find when a conversation feels difficult.",
  },
  {
    id: "range",
    name: "The Range",
    from: 8,
    to: 14,
    promise: "Practice warmth and clarity",
    move: "Alternate Warm Open and Firm & Clear, and keep up your daily reset.",
    why: "Practice expressing warmth and setting a clear boundary in different situations.",
  },
  {
    id: "translate",
    name: "The Translation",
    from: 15,
    to: 21,
    promise: "Match your tone to your words",
    move: "Try one Translation Drill a day, plus another drill if you'd like.",
    why: "Use the final week to practice saying everyday things in the way you intend.",
  },
];

export const ARC_LENGTH = 21;

/** The stage for a given day (clamps to the last stage past day 21). */
export function arcStageFor(day: number): ArcStage {
  const d = Math.max(1, Math.min(ARC_LENGTH, day));
  return ARC_STAGES.find((s) => d >= s.from && d <= s.to) ?? ARC_STAGES[ARC_STAGES.length - 1];
}

/** Days remaining in the arc (0 once finished). */
export function arcDaysLeft(day: number): number {
  return Math.max(0, ARC_LENGTH - Math.max(0, day));
}
