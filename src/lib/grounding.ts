import { BREATH_CUES, BREATH_LABELS, BREATH_SEQUENCE } from "./breath";

/**
 * The grounding kit — every calm-down exercise in one place, restored as
 * a full set: breath pacers (4-7-8, box, physiological sigh, quick
 * steady) and attention guides (5-4-3-2-1 senses, body scan).
 *
 * One generalized engine drives all of them: every exercise is a loop
 * of timed steps; the orb grows on "in", holds on "hold", drains on
 * "out", and idles mid-size on "settle" (attention steps). Pure logic —
 * the component just feeds it a ticking clock.
 */

export type GroundingKind = "in" | "hold" | "out" | "settle";

export interface GroundingStep {
  kind: GroundingKind;
  /** Seconds this step lasts within one round. */
  seconds: number;
  /** The instruction, short enough to read mid-exercise. */
  label: string;
  /** Coaching line shown under the label. */
  cue: string;
}

export interface GroundingExercise {
  id: string;
  name: string;
  /** One-line promise shown on the tab and under the name. */
  tag: string;
  /** Tailwind background utility for accents. */
  color: string;
  /** Lucide icon key — mapped in the component. */
  icon: "wind" | "box" | "waves" | "eye" | "scan" | "timer";
  /** Why this exists / when to reach for it. */
  intro: string;
  /** Suggested rounds — the kit marks progress against this. */
  rounds: number;
  steps: GroundingStep[];
}

/** One round of 4-7-8, reusing the breath lib's single source of truth. */
const BREATH_STEPS: GroundingStep[] = BREATH_SEQUENCE.map((s) => ({
  kind: s.phase,
  seconds: s.seconds,
  label: BREATH_LABELS[s.phase],
  cue: BREATH_CUES[s.phase],
}));

export const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: "reset-478",
    name: "The Reset (4·7·8)",
    tag: "Slow down and settle",
    color: "bg-mint",
    icon: "wind",
    intro:
      "Try this before a practice take or a difficult conversation. A few slow breaths can help you pause and collect your thoughts.",
    rounds: 3,
    steps: BREATH_STEPS,
  },
  {
    id: "box-breathing",
    name: "Box breathing",
    tag: "A steady breathing rhythm",
    color: "bg-sun",
    icon: "box",
    intro:
      "Breathe in, hold, breathe out, and hold again for four seconds each. Follow the same rhythm for each side.",
    rounds: 4,
    steps: [
      { kind: "in", seconds: 4, label: "Breathe in", cue: "Breathe in gently through your nose." },
      { kind: "hold", seconds: 4, label: "Hold", cue: "Pause without straining." },
      { kind: "out", seconds: 4, label: "Breathe out", cue: "Breathe out slowly and evenly." },
      { kind: "hold", seconds: 4, label: "Hold", cue: "Pause before the next breath." },
    ],
  },
  {
    id: "physiological-sigh",
    name: "Physiological sigh",
    tag: "A short breathing reset",
    color: "bg-coral",
    icon: "waves",
    intro:
      "Take two gentle breaths in, then breathe out slowly. Use this short exercise when you'd like a moment to pause.",
    rounds: 4,
    steps: [
      { kind: "in", seconds: 3, label: "Breathe in", cue: "Breathe in gently through your nose." },
      { kind: "in", seconds: 2, label: "Breathe in again", cue: "Take another small breath in." },
      { kind: "out", seconds: 8, label: "Breathe out slowly", cue: "Let your breath out slowly through your mouth." },
    ],
  },
  {
    id: "quick-steady",
    name: "The 10-second steady",
    tag: "Before you respond",
    color: "bg-paper",
    icon: "timer",
    intro:
      "Take a steady breath in and a longer breath out before you answer. Give yourself a moment to choose how you'd like to respond.",
    rounds: 5,
    steps: [
      { kind: "in", seconds: 4, label: "Breathe in", cue: "Breathe in as the other person finishes." },
      { kind: "out", seconds: 6, label: "Breathe out", cue: "Breathe out slowly, then respond." },
    ],
  },
  {
    id: "senses-54321",
    name: "5·4·3·2·1 senses",
    tag: "Notice what's around you",
    color: "bg-sun",
    icon: "eye",
    intro:
      "Take a moment to notice what's around you. Name a few things you can see, feel, hear, smell, and taste.",
    rounds: 2,
    steps: [
      { kind: "settle", seconds: 20, label: "5 things you can see", cue: "Notice a few details, large or small." },
      { kind: "settle", seconds: 20, label: "4 things you can feel", cue: "Notice the chair, your clothes, the floor, or your hands." },
      { kind: "settle", seconds: 20, label: "3 things you can hear", cue: "Notice sounds nearby and farther away." },
      { kind: "settle", seconds: 10, label: "2 things you can smell", cue: "Notice two things you can smell." },
      { kind: "settle", seconds: 10, label: "1 thing you can taste", cue: "Notice a taste, or take a sip of water." },
    ],
  },
  {
    id: "body-scan",
    name: "Unclench scan",
    tag: "Relax your jaw, shoulders, and hands",
    color: "bg-mint",
    icon: "scan",
    intro:
      "Check in with your jaw, shoulders, hands, stomach, and feet. Relax any areas that feel tense before you continue.",
    rounds: 2,
    steps: [
      { kind: "settle", seconds: 15, label: "Jaw", cue: "Relax your jaw and let your tongue rest." },
      { kind: "settle", seconds: 15, label: "Shoulders", cue: "Let your shoulders drop." },
      { kind: "settle", seconds: 15, label: "Hands", cue: "Open your hands and relax your fingers." },
      { kind: "settle", seconds: 15, label: "Stomach", cue: "Relax your stomach and breathe comfortably." },
      { kind: "settle", seconds: 15, label: "Feet", cue: "Rest your feet on the floor." },
    ],
  },
];

/** Cumulative ms offsets where each step starts within one round. */
export function groundingOffsets(ex: GroundingExercise): {
  step: GroundingStep;
  startMs: number;
  endMs: number;
}[] {
  let acc = 0;
  return ex.steps.map((step) => {
    const entry = { step, startMs: acc, endMs: acc + step.seconds * 1000 };
    acc += step.seconds * 1000;
    return entry;
  });
}

/** Length of one full round, in ms. */
export function groundingRoundMs(ex: GroundingExercise): number {
  return ex.steps.reduce((n, s) => n + s.seconds, 0) * 1000;
}

/** The whole suggested session, in ms. */
export function groundingTotalMs(ex: GroundingExercise): number {
  return groundingRoundMs(ex) * ex.rounds;
}

/**
 * Given elapsed ms, return the current step and how far through it (and
 * the round) we are. Pure — the component just feeds it a ticking clock.
 */
export function groundingStateAt(
  ex: GroundingExercise,
  elapsedMs: number,
): {
  stepIndex: number;
  step: GroundingStep;
  round: number; // 1-indexed
  progress: number;
  msLeftInStep: number;
} {
  const offsets = groundingOffsets(ex);
  const roundMs = groundingRoundMs(ex);
  const round = Math.floor(elapsedMs / roundMs) + 1;
  const within = elapsedMs % roundMs;
  const idx = Math.max(
    0,
    offsets.findIndex((o) => within >= o.startMs && within < o.endMs),
  );
  const current = offsets[idx] ?? offsets[offsets.length - 1];
  const span = current.endMs - current.startMs;
  const into = within - current.startMs;
  return {
    stepIndex: idx,
    step: current.step,
    round,
    progress: Math.min(1, Math.max(0, into / span)),
    msLeftInStep: span - into,
  };
}

/** Orb size per step kind: in = fill, hold = full, out = drain, settle = calm mid. */
export function orbScaleForStep(kind: GroundingKind, progress: number): number {
  if (kind === "in") return 0.55 + 0.45 * progress;
  if (kind === "hold") return 1;
  if (kind === "out") return 1 - 0.45 * progress;
  return 0.72; // settle — steady, gently present
}
