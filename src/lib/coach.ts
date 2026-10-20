/**
 * The V1 reframe coach — pure logic only.
 *
 * The product premise: the coach's value is being ANCHORED TO THE USER'S OWN
 * NUMBERS (their pace, pitch movement, stability), not generic advice. So the
 * prompt puts their real metrics in, the validator keeps the reply short and
 * specific, and if the LLM is unavailable a deterministic fallback still cites
 * their actual numbers. No therapy-speak anywhere — the coach is about
 * *sounding* calibrated, so it must sound calibrated.
 *
 * Everything here is pure and unit-tested; `src/convex/coach.ts` wires it to
 * the LLM and the database.
 */

export interface CoachTakeInput {
  drillName: string;
  /** What the drill was training, e.g. "Firm isn't loud. No apologetic tail." */
  focus: string;
  durationSec: number;
  dominantTone: string;
  overallScore: number;
  calmScore: number;
  energyScore: number;
  clarityScore: number;
  stabilityScore: number;
  avgPitchHz: number;
  pitchRangeHz: number;
  wordsPerMinute: number;
  voicedRatio: number;
  volumeVariability: number;
  /** Web Speech transcript of the take, when the browser supports it. */
  transcript?: string;
  /** The user's own context: what the take was responding to or opening. */
  context?: string;
  /** The user's own stated intention for the take. */
  goal?: string;
  /** Their best overall score on this drill, when they have one. */
  previousBest?: number;
}

export interface CoachReply {
  /** 2–3 sentences of specific, number-anchored feedback. */
  feedback: string;
  /** The single micro-suggestion for the next take (≤ ~12 words). */
  oneThing: string;
}

export const COACH_SYSTEM_PROMPT = `You are the ShiftedTone coach. You receive the measured numbers from one practice take (pace, pitch, scores) and what the person was practicing. Your job: tell them the ONE thing to change next take, anchored to THEIR numbers.

Hard rules:
- 2-3 sentences, under 60 words total. Brevity is the product.
- Cite at least one of their real numbers ("your pace hit 186 wpm", "only 14 Hz of pitch movement").
- If they gave context about the moment (who the take was aimed at, what it was responding to), tie the advice to that moment — the same pace reads as calm in an apology and as curt in a boundary.
- Give exactly one actionable instruction. Never a list.
- Use natural, conversational language. Be warm, clear, and specific without sounding overly casual or dramatic.
- Avoid slang, jargon, and metaphors. "Your pace was quick" is better than "the tempo argued."
- BANNED: praise openers, therapy-speak ("I hear you", "that's valid", "you're doing amazing"), hedging, exclamation marks, emoji.
- If the take is strong, say so in five words or fewer and still give one refinement.

Reply with STRICT JSON only (no markdown fences), shaped exactly:
{"feedback": "2-3 sentences citing their numbers", "oneThing": "the single move for next take, under 12 words"}

Examples of the required voice:

User numbers: pace 188 wpm, tone rushed, voiced 61%, overall 58.
{"feedback": "Your pace was 188 wpm, which may make it harder for listeners to follow. Try slowing the last sentence to about 150 wpm and see how it feels.","oneThing": "Try 150 wpm on the last sentence"}

User numbers: pitch range 14 Hz, tone flat, stability 82, overall 71.
{"feedback": "Your pitch changed by 14 Hz across the take, so your delivery may have sounded quite even. Try letting your voice lift on the one word you want people to remember.","oneThing": "Lift one key word"}`;

/** Compact, number-forward user message for the LLM. */
export function buildCoachUserContent(t: CoachTakeInput): string {
  const lines = [
    `Drill: ${t.drillName} (trains: ${t.focus})`,
    `Take: ${Math.round(t.durationSec)}s, read as "${t.dominantTone}"`,
    `Scores (0-100): overall ${t.overallScore}, calm ${t.calmScore}, energy ${t.energyScore}, clarity ${t.clarityScore}, stability ${t.stabilityScore}`,
    `Numbers: pace ${t.wordsPerMinute} wpm, pitch ${t.avgPitchHz} Hz avg (moved ${t.pitchRangeHz} Hz), voiced ${Math.round(t.voicedRatio * 100)}%, volume variability ${t.volumeVariability}`,
    t.transcript
      ? `What they said: "${t.transcript.slice(0, 600)}"`
      : "No transcript — coach from the numbers only.",
  ];
  if (t.context) {
    lines.push(
      `Their context — what this take was responding to or opening: "${t.context.slice(0, 400)}"`,
    );
  }
  if (t.previousBest !== undefined) {
    lines.push(`Their previous best on this drill: ${t.previousBest}.`);
  }
  if (t.goal) {
    lines.push(`What they were working on: "${t.goal.slice(0, 200)}"`);
  }
  return lines.join("\n");
}

/** Strip model dressing: markdown, fences, smart-quote wraps, extra whitespace. */
export function sanitizeCoachText(raw: string, maxLen = 480): string {
  const cleaned = raw
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, "");
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen - 1).trimEnd() + "…" : cleaned;
}

/**
 * Parse + validate a raw LLM completion into a CoachReply.
 * Returns null when the reply isn't usable (caller falls back).
 */
export function validateCoachReply(raw: string): CoachReply | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: { feedback?: unknown; oneThing?: unknown };
  try {
    parsed = JSON.parse(match[0]) as typeof parsed;
  } catch {
    return null;
  }
  if (typeof parsed.feedback !== "string") return null;
  const feedback = sanitizeCoachText(parsed.feedback);
  if (feedback.length < 20) return null;
  const oneThing =
    typeof parsed.oneThing === "string" ? sanitizeCoachText(parsed.oneThing, 120) : "";
  return { feedback, oneThing };
}

export type WeakestSignal =
  | "pace"
  | "pitch range"
  | "stability"
  | "clarity"
  | "calm"
  | "energy";

/** Deterministic pick of the most coachable signal in the take. */
export function pickWeakestSignal(t: CoachTakeInput): WeakestSignal {
  if (t.wordsPerMinute > 175) return "pace";
  if (t.pitchRangeHz < 25) return "pitch range";
  const scores: [WeakestSignal, number][] = [
    ["stability", t.stabilityScore],
    ["clarity", t.clarityScore],
    ["calm", t.calmScore],
    ["energy", t.energyScore],
  ];
  scores.sort((a, b) => a[1] - b[1]);
  return scores[0][0];
}

/**
 * Offline coach: anchored to their numbers, same voice as the LLM prompt.
 * Used when the LLM call fails or returns garbage — a free take never dies
 * on an API error.
 */
export function fallbackCoachNote(t: CoachTakeInput): CoachReply {
  const signal = pickWeakestSignal(t);
  const voiced = Math.round(t.voicedRatio * 100);
  let feedback: string;
  let oneThing: string;
  switch (signal) {
    case "pace":
      feedback = `Your pace was ${t.wordsPerMinute} wpm, which may make it harder for listeners to follow. Try slowing the last sentence to about ${Math.max(Math.round(t.wordsPerMinute * 0.8), 110)} wpm.`;
      oneThing = "Slow down for the last sentence";
      break;
    case "pitch range":
      feedback = `Your pitch changed by ${t.pitchRangeHz} Hz across the take, so your delivery may have sounded quite even. Try letting your voice lift on the word you most want people to remember.`;
      oneThing = "Lift one key word";
      break;
    case "stability":
      feedback = `Your stability score was ${t.stabilityScore}/100, and your pitch shifted between points. Decide how you'd like your last word to sound, then finish it clearly.`;
      oneThing = "Finish the last word clearly";
      break;
    case "clarity":
      feedback = `Your clarity score was ${t.clarityScore}/100, and your volume varied by ${t.volumeVariability}. Try keeping your volume steady through the last few words.`;
      oneThing = "Keep your volume steady to the end";
      break;
    case "calm":
      feedback = `Your calm score was ${t.calmScore}/100, and your voice was active for ${voiced}% of the take. Take a breath before you start, then slow down as you speak.`;
      oneThing = "Pause for a breath before you start";
      break;
    case "energy":
      feedback = `Your energy score was ${t.energyScore}/100, and your delivery stayed fairly consistent. Try bringing a little more energy to one word that matters to you.`;
      oneThing = "Emphasize one important word";
      break;
  }
  return { feedback, oneThing };
}
