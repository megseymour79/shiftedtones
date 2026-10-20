/**
 * "The Translation Drill" — practice saying the same sentence with a tone
 * that better matches what you mean. The mic scores both takes so you can
 * compare how your delivery changes.
 */

export interface TranslationLine {
  id: string;
  /** The sentence, exactly as it tends to come out under pressure. */
  text: string;
  /** How it usually lands when said reflexively. */
  usually: string;
  /** What the intended version sounds like — the user's target. */
  intended: string;
  /** The tone the retake should chase (drives the target-tone hint). */
  targetHint: string;
  /** What the listener stops doing once it's said right. */
  payoff: string;
}

export const TRANSLATION_LINES: TranslationLine[] = [
  {
    id: "no",
    text: "No, I can't take that on right now.",
    usually: "It may come out apologetic, as if you're leaving room to change your mind.",
    intended: "Warm and direct, with a clear ending.",
    targetHint: "Finish the sentence without trailing off.",
    payoff: "The other person can hear that your answer is no.",
  },
  {
    id: "late",
    text: "I'm running about fifteen minutes behind.",
    usually: "It may come out rushed, with more apology than information.",
    intended: "Calm and specific. Share the update without putting yourself down.",
    targetHint: "Slow down for the first few words.",
    payoff: "The other person gets a clear update and time estimate.",
  },
  {
    id: "disagree",
    text: "I see it differently.",
    usually: "It may sound like a challenge or come out so quietly that your point is hard to hear.",
    intended: "Steady and direct, without turning a difference of opinion into an argument.",
    targetHint: "Keep your volume even and end the sentence clearly.",
    payoff: "The other person can hear your point without feeling attacked.",
  },
  {
    id: "hurt",
    text: "That comment stung a little.",
    usually: "It may come out as a joke or accusation instead of a straightforward statement.",
    intended: "Quiet and direct. Say what happened without blaming the other person.",
    targetHint: "Slow your pace and say it once.",
    payoff: "The other person has a chance to understand and respond.",
  },
  {
    id: "reminder",
    text: "Hey — this is the second time the report's been late.",
    usually: "It may sound irritated or be softened so much that the concern is unclear.",
    intended: "Factual and firm, without sounding contemptuous.",
    targetHint: "Keep your delivery even, especially on the word “second.”",
    payoff: "The other person can hear the issue without feeling attacked.",
  },
  {
    id: "ask",
    text: "Can you get this to me by Thursday?",
    usually: "It may sound so tentative that the deadline is easy to miss.",
    intended: "Clear and direct, with a specific deadline.",
    targetHint: "Let your voice fall slightly on “Thursday.”",
    payoff: "The other person knows when you need it.",
  },
  {
    id: "praise",
    text: "You handled that really well.",
    usually: "It may come out rushed or so quietly that the praise is easy to miss.",
    intended: "Take your time and say what you appreciated directly.",
    targetHint: "Speak clearly on “really well,” then pause.",
    payoff: "The other person can hear that you mean it.",
  },
  {
    id: "boundary",
    text: "I'd rather not talk about work tonight.",
    usually: "It may come with more explanation than the situation needs.",
    intended: "Warm and clear about what you'd prefer.",
    targetHint: "Start warmly, then keep the boundary clear.",
    payoff: "The other person understands your boundary.",
  },
  {
    id: "interrupted",
    text: "Hold on — I wasn't finished.",
    usually: "It may come out sharply or turn into an apology that gives up your turn.",
    intended: "Steady and calm, while making it clear that you weren't finished.",
    targetHint: "Keep your volume even on “hold on,” then finish your thought.",
    payoff: "The other person knows you still have something to say.",
  },
  {
    id: "thanks",
    text: "Thank you — that genuinely helped.",
    usually: "It may come out so quickly that the other person doesn't hear how much it helped.",
    intended: "Warm, specific, and unhurried.",
    targetHint: "Slow down for the last few words.",
    payoff: "The other person knows you appreciated their help.",
  },
  {
    id: "raise",
    text: "I'd like to talk about my compensation.",
    usually: "It may sound overly tentative or more forceful than you intend.",
    intended: "Plain, steady, and direct.",
    targetHint: "Keep your pitch even through the end of the sentence.",
    payoff: "The other person hears a clear request.",
  },
  {
    id: "overloaded",
    text: "I'm at capacity — here's what I can take on.",
    usually: "It may come out as a yes, even when you don't have room to take on more.",
    intended: "Calm and constructive. State what you can take on.",
    targetHint: "Keep your voice steady on “at capacity.”",
    payoff: "The other person can plan around what you have time for.",
  },
];

/** Pick today's translation line (stable per local day). */
export function getDailyTranslation(day: number): TranslationLine {
  return TRANSLATION_LINES[day % TRANSLATION_LINES.length];
}

/** Which of the two passes comes first — alternates so order never confounds. */
export function passOrder(day: number): ("reflex" | "intended")[] {
  return day % 2 === 0 ? ["reflex", "intended"] : ["intended", "reflex"];
}
