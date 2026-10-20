/**
 * The 4-7-8 breathing reset — the pre-take ritual. Pure phase/round logic
 * so the component stays dumb and the timing is testable.
 */

export type BreathPhase = "in" | "hold" | "out";

export const BREATH_SEQUENCE: { phase: BreathPhase; seconds: number }[] = [
  { phase: "in", seconds: 4 },
  { phase: "hold", seconds: 7 },
  { phase: "out", seconds: 8 },
];

export const BREATH_LABELS: Record<BreathPhase, string> = {
  in: "Breathe in",
  hold: "Pause",
  out: "Breathe out",
};

/** Coaching line per phase — short enough to read mid-breath. */
export const BREATH_CUES: Record<BreathPhase, string> = {
  in: "Breathe in gently through your nose.",
  hold: "Pause and stay comfortable.",
  out: "Breathe out slowly through your mouth.",
};

export const BREATH_TOTAL_MS =
  BREATH_SEQUENCE.reduce((n, s) => n + s.seconds, 0) * 1000; // 19s

/** Cumulative ms offset where each phase starts within one round. */
export function phaseOffsets(): { phase: BreathPhase; startMs: number; endMs: number }[] {
  let acc = 0;
  return BREATH_SEQUENCE.map((s) => {
    const entry = { phase: s.phase, startMs: acc, endMs: acc + s.seconds * 1000 };
    acc += s.seconds * 1000;
    return entry;
  });
}

/**
 * Given elapsed ms and the round that just finished, return the current
 * phase and how far (0–1) through it we are. Pure — the component just
 * feeds it a ticking clock.
 */
export function breathStateAt(
  elapsedMs: number,
): {
  phase: BreathPhase;
  round: number; // 1-indexed
  progress: number;
  msLeftInPhase: number;
} {
  const offsets = phaseOffsets();
  const roundMs = BREATH_TOTAL_MS;
  const round = Math.floor(elapsedMs / roundMs) + 1;
  const within = elapsedMs % roundMs;
  const current =
    offsets.find((o) => within >= o.startMs && within < o.endMs) ??
    offsets[offsets.length - 1];
  const span = current.endMs - current.startMs;
  const into = within - current.startMs;
  return {
    phase: current.phase,
    round,
    progress: Math.min(1, Math.max(0, into / span)),
    msLeftInPhase: span - into,
  };
}

/** The visual size of the orb per phase: in = fill, hold = full, out = drain. */
export function orbScaleFor(phase: BreathPhase, progress: number): number {
  if (phase === "in") return 0.55 + 0.45 * progress;
  if (phase === "hold") return 1;
  return 1 - 0.45 * progress; // out
}
