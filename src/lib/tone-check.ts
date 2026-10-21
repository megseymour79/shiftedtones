/**
 * "Tone check" — a 60-second, three-question self-assessment that maps
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
    prompt: "Someone cuts you off mid-sentence. What do you do?",
    options: [
      { text: "Talk over them so I can finish what I was saying", archetype: "matcher" },
      { text: "Go quiet and let them finish", archetype: "absorber" },
      { text: "Wait for a pause, then explain what I was saying", archetype: "fixer" },
      { text: "Say “anyway” and move on", archetype: "fader" },
    ],
  },
  {
    id: "blindsided",
    prompt: "You get a “we need to talk” text with no context. What's your first reaction?",
    options: [
      { text: "I get tense and start thinking about what I need to defend", archetype: "matcher" },
      { text: "I worry I've done something wrong and think about apologizing", archetype: "absorber" },
      { text: "I try to figure out what the conversation is about", archetype: "fixer" },
      { text: "I feel unsure and start planning what to say", archetype: "fader" },
    ],
  },
  {
    id: "unfair-feedback",
    prompt: "You get feedback that feels unfair. What's your first move?",
    options: [
      { text: "Push back on the spot", archetype: "matcher" },
      { text: "Thank them, even though it keeps bothering me", archetype: "absorber" },
      { text: "Go through the details until we agree", archetype: "fixer" },
      { text: "Nod, but avoid bringing it up again", archetype: "fader" },
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
    read: "You tend to match the other person's energy. That can help you be direct, but it can also add heat to a tense moment.",
    drillId: "unruffled",
    pairing: "Un-Ruffled gives you a chance to pause before replying to a sharp comment.",
    color: "bg-coral",
  },
  absorber: {
    name: "The Absorber",
    read: "You may hold back to keep the peace, even when something's bothering you.",
    drillId: "steady-ground",
    pairing: "Steady Ground helps you explain what happened without making things more tense.",
    color: "bg-sun",
  },
  fixer: {
    name: "The Fixer",
    read: "You may focus on getting the details right, even when a little warmth would help.",
    drillId: "warm-open",
    pairing: "Warm Open helps you bring more warmth into what you say.",
    color: "bg-mint",
  },
  fader: {
    name: "The Fader",
    read: "You may soften your point so much that it's hard for people to know what you need.",
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
