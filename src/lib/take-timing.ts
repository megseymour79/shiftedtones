/**
 * Take-session timing helpers — pure decision logic for the Practice
 * recorder UI. The capture hook owns the clock; these helpers turn
 * elapsed time into what the UI should show and say, so the pacing
 * guidance stays unit-testable alongside the rest of the scoring logic.
 */

<<<<<<< HEAD
=======
/** Seconds counted down before recording actually starts. */
export const COUNTDOWN_SECONDS = 3;

/** Clamp a recording clock to its configured target when one exists. */
export function capElapsedMs(elapsedMs: number, maximumMs?: number): number {
  if (!(maximumMs && maximumMs > 0)) return Math.max(0, elapsedMs);
  return Math.max(0, Math.min(elapsedMs, maximumMs));
}

/** The countdown beats, last → first: [3, 2, 1]. */
export function countdownBeats(): number[] {
  return Array.from({ length: COUNTDOWN_SECONDS }, (_, i) => COUNTDOWN_SECONDS - i);
}

>>>>>>> origin/main
/** Where a take stands against the drill's suggested length. */
export type PaceStatus = "warming-up" | "on-pace" | "good-length" | "overtime";

/**
 * The take's pacing verdict against the drill's target length:
 * - warming-up: under a third of the target — still settling in
 * - on-pace: inside the target window — the productive zone
 * - good-length: target reached — a natural point to land the last word
 * - overtime: well past target — wrapping up beats rambling
 */
export function paceStatus(elapsedMs: number, targetMs: number): PaceStatus {
  if (!(targetMs > 0)) return "on-pace";
  if (elapsedMs < targetMs / 3) return "warming-up";
  if (elapsedMs < targetMs) return "on-pace";
  if (elapsedMs < targetMs * 1.5) return "good-length";
  return "overtime";
}

/** 0..100 fill of the target pacing meter, capped so overtime can't invert. */
export function pacePct(elapsedMs: number, targetMs: number): number {
  if (!(targetMs > 0)) return 0;
  return Math.min(100, Math.round((elapsedMs / targetMs) * 100));
}

/** Keep recorder time within its target while preserving uncapped timers. */
export function capElapsedMs(elapsedMs: number, maxDurationMs?: number): number {
  const elapsed = Math.max(0, elapsedMs);
  return maxDurationMs && maxDurationMs > 0
    ? Math.min(elapsed, maxDurationMs)
    : elapsed;
}

/** The user-facing cue for each pacing status. */
export const PACE_HINTS: Record<PaceStatus, string> = {
  "warming-up": "Settle in — find your first sentence",
  "on-pace": "Good pace — make your point",
  "good-length": "Target reached — a strong place to land it",
  overtime: "Past the target — wrap the last sentence",
};

/** Meter color for each pacing status (matches the app's signal colors). */
export const PACE_BAR_CLASS: Record<PaceStatus, string> = {
  "warming-up": "bg-ink/60",
  "on-pace": "bg-mint",
  "good-length": "bg-sun",
  overtime: "bg-coral",
};
