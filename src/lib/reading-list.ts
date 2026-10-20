/**
 * A short list of free resources on communication, tone, and responding
 * thoughtfully. Each link opens the original source.
 */

export interface ReadingResource {
  title: string;
  /** Who made it — shown as the authority line. */
  source: string;
  blurb: string;
  url: string;
  /** Tailwind bg utility for the accent bar. */
  color: string;
  kind: "article" | "research" | "tool";
}

export const READING_LIST: ReadingResource[] = [
  {
    title: "Active Listening",
    source: "Greater Good in Action · UC Berkeley",
    blurb:
      "A practical guide to active listening, including paraphrasing, asking questions, and paying attention to body language.",
    url: "https://ggia.berkeley.edu/practice/active_listening",
    color: "bg-sun",
    kind: "research",
  },
  {
    title: "Body Language & Nonverbal Communication",
    source: "Science of People · Vanessa Van Edwards",
    blurb:
      "An introduction to the nonverbal signals that shape communication, including facial expressions, gestures, and vocal cues.",
    url: "https://www.scienceofpeople.com/body-language/",
    color: "bg-mint",
    kind: "article",
  },
  {
    title: "What is NVC?",
    source: "Center for Nonviolent Communication",
    blurb:
      "An introduction to separating observations from judgments and recognizing the feelings and needs behind what people say.",
    url: "https://www.cnvc.org/learn/what-is-nvc",
    color: "bg-coral",
    kind: "article",
  },
  {
    title: "How to Speak So That People Want to Listen",
    source: "Julian Treasure · TED · 9:44",
    blurb:
      "Julian Treasure shares common speaking habits to avoid and four principles for communicating well.",
    url: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",
    color: "bg-paper",
    kind: "article",
  },
  {
    title: "The “R is for Repair” Research",
    source: "The Gottman Institute",
    blurb:
      "Learn how repair attempts can help couples move through conflict and keep a conversation from escalating.",
    url: "https://www.gottman.com/blog/r-is-for-repair/",
    color: "bg-sun",
    kind: "research",
  },
  {
    title: "Communication Skills Guides",
    source: "HelpGuide · nonprofit, Harvard-reviewed",
    blurb:
      "Practical guides to listening, managing conflict, and communicating clearly.",
    url: "https://www.helpguide.org/",
    color: "bg-mint",
    kind: "article",
  },
  {
    title: "Visual essays on how we connect",
    source: "The Pudding",
    blurb:
      "Interactive visual essays explore human behavior, including voice, language, and connection.",
    url: "https://pudding.cool/",
    color: "bg-coral",
    kind: "tool",
  },
];
