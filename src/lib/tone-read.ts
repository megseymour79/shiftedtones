/**
 * Text tone reader. Marks up a draft with evidence-bearing signals instead
 * of scoring it. Pure and synchronous; runs entirely in the browser.
 */

export type SignalKind = "heat" | "demand" | "volume" | "absolute" | "hedge" | "warmth" | "play";

export interface Edit {
  /** Replacement for the signal's span ("" deletes it). */
  replacement: string;
}

export interface Signal {
  kind: SignalKind;
  start: number;
  end: number;
  /** Exact matched span — never a paraphrase. */
  text: string;
  /** 0..1 */
  weight: number;
  note: string;
  fix?: Edit;
}

export type Evidence = "clear" | "leaning" | "mixed" | "not-enough";
export type Band = "low" | "some" | "strong";

export interface Read {
  signals: Signal[];
  /** Sorted by weight, capped at MAX_SHOWN. */
  shown: Signal[];
  hiddenCount: number;
  reading: string;
  because: string[];
  wouldLandBetter: string;
  evidence: Evidence;
  warmthHeat: Band;
  directness: Band;
  /** Internal only, for instrumentation. */
  internalScore: number;
}

interface Pattern {
  id: string;
  kind: SignalKind;
  re: RegExp;
  base: number;
  note: string;
  fix?: Edit;
}

export const MAX_SHOWN = 4;

const PATTERNS: Pattern[] = [
  { id: "waste", kind: "heat", re: /\bwasting (?:everyone's|everyones|my|our|your) time\b/gi, base: 0.9, note: "Aims the frustration at a person's worth rather than the issue." },
  { id: "stupid", kind: "heat", re: /\b(?:stupid|idiotic|ridiculous|pathetic|useless)\b/gi, base: 0.9, note: "Name-calling hides the point you are making." },
  { id: "obviously", kind: "heat", re: /\b(?:obviously|clearly|as i (?:already )?said)\b/gi, base: 0.5, note: "Implies the reader should already know — it reads as condescension.", fix: { replacement: "" } },
  { id: "sick", kind: "heat", re: /\b(?:sick of|fed up|tired of)\b/gi, base: 0.6, note: "Names exhaustion with the person rather than the problem." },
  { id: "youneed", kind: "demand", re: /\byou (?:need|have|must|should) (?:to )?/gi, base: 0.6, note: "Frames the ask as an order.", fix: { replacement: "could you " } },
  { id: "asap", kind: "demand", re: /\b(?:asap|right now|immediately|right away)\b/gi, base: 0.5, note: "Urgency without a reason feels like pressure.", fix: { replacement: "by end of day" } },
  { id: "bangs", kind: "volume", re: /!{2,}|\?{2,}|\?!+|!+\?/g, base: 0.5, note: "Stacked punctuation reads as shouting.", fix: { replacement: "." } },
  { id: "caps", kind: "volume", re: /\b[A-Z]{3,}\b/g, base: 0.5, note: "All-caps reads as shouting.", fix: undefined },
  { id: "always", kind: "absolute", re: /\b(?:always|never|every time|nobody|no one)\b/gi, base: 0.5, note: "Absolutes invite an argument about the exception.", fix: { replacement: "often" } },
  { id: "hedge", kind: "hedge", re: /\b(?:maybe|perhaps|i think|i guess|sort of|kind of|just wondering|if that's ok(?:ay)?)\b/gi, base: 0.3, note: "Softens the ask — fine, unless the point gets lost." },
  { id: "thanks", kind: "warmth", re: /\b(?:thanks|thank you|appreciate|grateful)\b/gi, base: 0.5, note: "Acknowledges the other person." },
  { id: "please", kind: "warmth", re: /\b(?:please|would you mind|could you|when you have a moment)\b/gi, base: 0.4, note: "Frames the ask as a request." },
  { id: "play", kind: "play", re: /\b(?:haha|lol|ha ha)\b|:\)|😂|🙂/gi, base: 0.3, note: "Signals play; can lighten the tone or hide an edge." },
];

/** Repetition counts sub-linearly: 1 - 0.5^n. */
export function repetitionWeight(base: number, n: number): number {
  if (n <= 0) return 0;
  return Math.min(1, base * 2 * (1 - Math.pow(0.5, n)));
}

function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}']+/gu) ?? []).length;
}

function band(v: number): Band {
  return v < 0.25 ? "low" : v < 0.6 ? "some" : "strong";
}

export function detectSignals(text: string): Signal[] {
  const out: Signal[] = [];
  const taken: Array<[number, number]> = [];
  for (const p of PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags.includes("g") ? p.re.flags : p.re.flags + "g");
    const found: Array<{ start: number; end: number; text: string }> = [];
    for (const m of text.matchAll(re)) {
      if (!m[0]) continue;
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue; // first pattern wins an overlapping span
      found.push({ start, end, text: m[0] });
    }
    if (!found.length) continue;
    for (const f of found) taken.push([f.start, f.end]);
    const weight = repetitionWeight(p.base, found.length);
    // One note per pattern; the heaviest span carries it, repeats are folded in.
    for (const f of found) {
      out.push({
        kind: p.kind,
        start: f.start,
        end: f.end,
        text: f.text,
        weight,
        note: p.note,
        fix: p.fix,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Dedupe to one finding per pattern note, sorted by weight. */
function findings(signals: Signal[]): Signal[] {
  const byNote = new Map<string, Signal>();
  for (const s of signals) if (!byNote.has(s.note)) byNote.set(s.note, s);
  return [...byNote.values()].sort((a, b) => b.weight - a.weight || a.start - b.start);
}

export function readDraft(text: string): Read {
  const signals = detectSignals(text);
  const all = findings(signals);
  const shown = all.slice(0, MAX_SHOWN);
  const hiddenCount = all.length - shown.length;
  const words = wordCount(text);

  const sum = (kinds: SignalKind[]) =>
    all.filter((s) => kinds.includes(s.kind)).reduce((n, s) => n + s.weight, 0);
  const heat = sum(["heat", "volume", "absolute"]) + sum(["demand"]) * 0.5;
  const warmth = sum(["warmth", "play"]);
  const direct = sum(["demand", "absolute"]) - sum(["hedge"]) * 0.5;

  const conflict = heat >= 0.5 && warmth >= 0.5;
  let evidence: Evidence;
  if (words < 4 || all.length === 0) evidence = "not-enough";
  else if (conflict) evidence = "mixed";
  else {
    const top = all[0].weight;
    const second = all[1]?.weight ?? 0;
    evidence = all.length >= 3 && top - second >= 0.05 ? "clear" : "leaning";
  }

  let reading = "Not enough to read yet";
  let wouldLandBetter = "Add a sentence or two so there is something to read.";
  if (evidence !== "not-enough") {
    if (evidence === "mixed") {
      reading = "Mixed — warmth and heat in the same message";
      wouldLandBetter = "the warm lines were not undercut by the sharp ones";
    } else if (heat > warmth && heat >= 0.5) {
      const personal = all.some((s) => s.kind === "heat");
      reading = personal ? "Rude, with heat aimed at a person" : "Pushy, with pressure in the phrasing";
      wouldLandBetter = "the ask were separated from the frustration";
    } else if (warmth > heat) {
      reading = "Warm";
      wouldLandBetter = "it already reads well — check the ask is explicit";
    } else {
      reading = "Neutral, with a little edge";
      wouldLandBetter = "the flagged words were softened or cut";
    }
  }

  return {
    signals,
    shown,
    hiddenCount,
    reading,
    because: shown.map((s) => `“${s.text.trim()}” (${s.kind})`),
    wouldLandBetter,
    evidence,
    warmthHeat: band(Math.max(heat, warmth)),
    directness: band(Math.max(0, direct)),
    internalScore: Math.round((heat - warmth) * 100) / 100,
  };
}

/** Apply a signal's surgical fix; returns the new text, or null when none exists. */
export function applyFix(text: string, signal: Signal): string | null {
  if (!signal.fix) return null;
  return text.slice(0, signal.start) + signal.fix.replacement + text.slice(signal.end);
}

/** State machine: idle → typing → reading → read; editing a read returns to typing. */
export type LabState = "idle" | "typing" | "reading" | "read";

export interface Snapshot {
  text: string;
  version: number;
  read: Read;
}

export function isStale(snapshot: Snapshot | null, text: string, version: number): boolean {
  return !!snapshot && (snapshot.version !== version || snapshot.text !== text);
}
