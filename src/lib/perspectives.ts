/**
 * Perspective lenses for the Reframe Lab. Each one offers a different way
 * to look at the same situation without dismissing what happened.
 */

export interface Lens {
  id: string;
  name: string;
  /** The lens in one line. */
  idea: string;
  /** The question you ask while looking through it. */
  question: string;
  /** A nudge for what tends to surface through this lens. */
  seed: string;
  /** Tailwind bg utility for the card accent. */
  color: string;
}

export const LENSES: Lens[] = [
  {
    id: "author",
    name: "The Facts",
    idea: "It's easy to fill in details when you're trying to make sense of a moment.",
    question: "What do I know for sure, and what am I assuming?",
    seed: "Describe only what someone else could have seen or heard.",
    color: "bg-sun",
  },
  {
    id: "their-day",
    name: "Their perspective",
    idea: "The other person's response may have been shaped by something beyond this moment.",
    question: "What else might be affecting how they responded?",
    seed: "Consider a few other things they might be dealing with. That doesn't excuse their behavior, but it may offer context.",
    color: "bg-mint",
  },
  {
    id: "next-year",
    name: "Some distance",
    idea: "A little distance can make it easier to see what matters most.",
    question: "How might I view this situation a year from now?",
    seed: "Imagine describing this moment to a friend next year. What would you say?",
    color: "bg-coral",
  },
  {
    id: "ally",
    name: "A friend",
    idea: "A trusted friend might see your intentions more generously than you do.",
    question: "What might someone who cares about me say about this?",
    seed: "Try finishing the sentence: “I was trying to…”",
    color: "bg-paper",
  },
  {
    id: "stake",
    name: "What matters",
    idea: "Look beyond the immediate disagreement to what you'd like to happen next.",
    question: "What would I like to be different after this conversation?",
    seed: "Name what matters to you, then think about how to ask for it clearly.",
    color: "bg-sun",
  },
];

/** Deterministic per-day lens rotation for the "lens of the day" chip. */
export function lensOfTheDay(day: number): Lens {
  return LENSES[day % LENSES.length];
}
