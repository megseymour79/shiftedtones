/**
 * "Tone check" — a 60-second, six-question self-assessment that maps
 * the visitor's default-under-pressure to one of four archetypes, each
 * paired with the drill that trains its exact weakness. Interactive on
 * the landing page; no mic, no account needed.
 */

export type ToneArchetype = "matcher" | "absorber" | "fixer" | "fader";

export interface ToneCheckOption {
  text: string;
  archetype: ToneArchetype;
}

export interface ToneCheckQuestion {
  id: string;
  prompt: string;
  options: ToneCheckOption[];
}

export const TONE_CHECK: ToneCheckQuestion[] = [
  {
    id: "interrupted",
    prompt: "Someone cuts you off mid-sentence. You…",
    options: [
      { text: "Talk over them so I can finish my point", archetype: "matcher" },
      { text: "Go quiet and let them continue", archetype: "absorber" },
      { text: "Wait for a pause, then clarify what I meant", archetype: "fixer" },
      { text: "Say “anyway” and leave out the rest", archetype: "fader" },
    ],
  },
  {
    id: "blindsided",
    prompt: "“We need to talk.” No context. Your body immediately…",
    options: [
      { text: "I get tense and start preparing to defend myself", archetype: "matcher" },
      { text: "I worry I did something wrong and start planning an apology", archetype: "absorber" },
      { text: "I try to work out what the conversation is about", archetype: "fixer" },
      { text: "I feel uncertain and start thinking of what to say", archetype: "fader" },
    ],
  },
  {
    id: "unfair-feedback",
    prompt: "Feedback that feels unfair lands in your lap. First move?",
    options: [
      { text: "Push back on the spot", archetype: "matcher" },
      { text: "Thank them, then stay bothered about it", archetype: "absorber" },
      { text: "Go through the details until we agree", archetype: "fixer" },
      { text: "Nod, but avoid bringing it up again", archetype: "fader" },
    ],
  },
  {
    id: "changing-priorities",
    prompt: "A teammate changes the plan right before you start. You…",
    options: [
      { text: "Point out that they keep changing things at the last minute", archetype: "matcher" },
      { text: "Accept the change, even though it throws off your day", archetype: "absorber" },
      { text: "Ask what changed and which part matters most now", archetype: "fixer" },
      { text: "Say you will handle it, then leave out your concerns", archetype: "fader" },
    ],
  },
  {
    id: "misread-message",
    prompt: "A short text from a friend feels colder than usual. Your first move?",
    options: [
      { text: "Reply just as briefly so they know you noticed", archetype: "matcher" },
      { text: "Assume they're upset with you and apologize", archetype: "absorber" },
      { text: "Ask if they meant the message the way it sounded to you", archetype: "fixer" },
      { text: "Wait and hope the awkward feeling passes", archetype: "fader" },
    ],
  },
  {
    id: "last-minute-request",
    prompt: "Someone asks you to take on extra work when your day is full. You…",
    options: [
      { text: "Tell them it's unfair to ask you at the last minute", archetype: "matcher" },
      { text: "Say yes, then try to fit it in somehow", archetype: "absorber" },
      { text: "Ask which current task should move to make room", archetype: "fixer" },
      { text: "Say maybe, even though you know you cannot do it", archetype: "fader" },
    ],
  },
];

export interface ToneArchetypeInfo {
  name: string;
  /** The one-line diagnosis, written to feel seen — not judged. */
  read: string;
  /** The drill id that trains this archetype's exact weakness. */
  drillId: string;
  /** Why this drill, in one breath. */
  pairing: string;
  color: string;
}

export const ARCHETYPES: Record<ToneArchetype, ToneArchetypeInfo> = {
  matcher: {
    name: "The Matcher",
    read: "You tend to match the other person's energy. That can help you be direct, but it may make a tense moment harder.",
    drillId: "unruffled",
    pairing: "Un-Ruffled gives you a chance to pause before responding to a sharp comment.",
    color: "bg-coral",
  },
  absorber: {
    name: "The Absorber",
    read: "You may hold back to keep the peace, even when something is bothering you.",
    drillId: "steady-ground",
    pairing: "Steady Ground helps you state what happened clearly, without escalating the conversation.",
    color: "bg-sun",
  },
  fixer: {
    name: "The Fixer",
    read: "You may focus on getting the facts right, even when the conversation could use a warmer approach.",
    drillId: "warm-open",
    pairing: "Warm Open helps you bring more warmth into what you say.",
    color: "bg-mint",
  },
  fader: {
    name: "The Fader",
    read: "You may soften your point so much that it's hard for others to understand what you need.",
    drillId: "firm-clear",
    pairing: "Firm & Clear helps you express your needs directly while keeping your tone steady.",
    color: "bg-paper",
  },
};

/** Tally answers → winning archetype (ties break toward the earlier pick). */
export function scoreToneCheck(answers: ToneArchetype[]): ToneArchetype {
  const tally: Record<ToneArchetype, number> = {
    matcher: 0,
    absorber: 0,
    fixer: 0,
    fader: 0,
  };
  for (const a of answers) tally[a]++;
  let best: ToneArchetype = "matcher";
  let bestN = -1;
  (Object.keys(tally) as ToneArchetype[]).forEach((k) => {
    if (tally[k] > bestN) {
      best = k;
      bestN = tally[k];
    }
  });
  return best;
}
