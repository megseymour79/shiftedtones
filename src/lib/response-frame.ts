/**
 * The Response Frame — how to think before you speak.
 *
 * Four questions that turn a reaction into a response. Pure data, no
 * React: the questions, why each matters, and the self-check that
 * confirms you've actually answered it. Consumed by the ResponsePlanner
 * component (Translate between passes, Reframe before writing).
 */

export interface FrameStep {
  id: string;
  /** The question, as you'd ask yourself in the moment. */
  question: string;
  /** Why this question can help. */
  why: string;
  /** A way to think through the answer. */
  how: string;
  /** A quick check-in to help clarify the answer. */
  check: string;
  /** Accent color (tailwind bg utility). */
  color: string;
}

export const FRAME_STEPS: FrameStep[] = [
  {
    id: "their-move",
    question: "What might the other person be feeling or asking for?",
    why: "Considering what may be behind someone's words can help you choose a response instead of reacting right away.",
    how: "Ask yourself what the other person might want you to understand or do. If you're not sure, you can ask them.",
    check: "Can you describe what they might be feeling without assuming you know for certain?",
    color: "bg-coral",
  },
  {
    id: "underneath",
    question: "What might they be trying to tell me?",
    why: "Sometimes a complaint or short reply points to a concern that hasn't been said directly.",
    how: "Think about what they may need or be worried about. If you're unsure, ask a calm, open question.",
    check: "Can you describe their concern in one sentence without judging it?",
    color: "bg-sun",
  },
  {
    id: "aftertaste",
    question: "How do I want them to feel after hearing it?",
    why: "You can't control how someone responds, but you can decide what you'd like them to understand.",
    how: "Choose a simple goal, such as being clear, showing care, or setting a limit. Think about whether your words and tone support it.",
    check: "Can you describe what you'd like the other person to understand after hearing you?",
    color: "bg-mint",
  },
  {
    id: "ask",
    question: "What kind of message is this — and what's the ask?",
    why: "Different conversations call for different responses. Knowing what you want from the conversation can help you be clear.",
    how: "Decide whether you want to reach an agreement, acknowledge their feelings, set a boundary, repair a misunderstanding, or share information.",
    check: "Would the other person understand what you're asking for?",
    color: "bg-paper",
  },
];

/**
 * Message archetypes for step four: one-line "you'll know it's this
 * when" cues and what a good version sounds like.
 */
export interface MessageKind {
  id: string;
  label: string;
  /** How you recognize this kind of message. */
  cue: string;
  /** The shape of a response that works. */
  shape: string;
  /** What the ending sounds like. */
  ending: string;
  color: string;
}

export const MESSAGE_KINDS: MessageKind[] = [
  {
    id: "agree",
    label: "Come to an agreement",
    cue: "You need to make a decision together about plans, schedules, money, or responsibilities.",
    shape: "Start with what you agree on, share your view, and ask what they think. Stay focused on one issue at a time.",
    ending: "\"Does that work for you, or what would you change?\"",
    color: "bg-mint",
  },
  {
    id: "acknowledge",
    label: "Acknowledge / validate",
    cue: "The other person is sharing a feeling and may want you to listen before offering advice.",
    shape: "Acknowledge what they said and why it matters. Ask before offering a solution.",
    ending: "\"That makes sense. I'm glad you told me.\"",
    color: "bg-sun",
  },
  {
    id: "boundary",
    label: "Set a boundary",
    cue: "You want to be clear about what you can or can't do.",
    shape: "Be brief and kind. State the limit and, if helpful, explain what you'll do instead.",
    ending: "\"I'm not discussing this again tonight — I'll pick this up tomorrow.\"",
    color: "bg-coral",
  },
  {
    id: "repair",
    label: "Repair after a miss",
    cue: "You said or did something that you'd like to repair.",
    shape: "Acknowledge what happened, say what you'll try to do differently, and give the other person room to respond.",
    ending: "\"That came out sharper than I meant. Here's what I'll do differently.\"",
    color: "bg-paper",
  },
  {
    id: "inform",
    label: "Deliver information",
    cue: "You need to share an update, decision, or piece of news.",
    shape: "Start with the main point, then explain why it matters and what happens next. Keep your tone steady.",
    ending: "\"I wanted you to hear it from me first. What questions do you have?\"",
    color: "bg-secondary",
  },
  {
    id: "de-escalate",
    label: "Bring the temperature down",
    cue: "The conversation is getting tense or people are talking over each other.",
    shape: "Slow down, lower your voice, and suggest taking turns. Focus on how you can continue the conversation calmly.",
    ending: "\"I want to hear this — and I can only hear it one voice at a time.\"",
    color: "bg-sun",
  },
];

/** Suggested goal-line copy for Reframe's "your goal" field, per kind. */
export const KIND_GOAL_HINTS: Record<string, string> = {
  agree: "find a solution we can both accept",
  acknowledge: "show them I've heard what they're saying",
  boundary: "state my limit clearly and calmly",
  repair: "acknowledge my part and say what I'll do differently",
  inform: "share the update clearly and calmly",
  "de-escalate": "slow the conversation down without matching their tone",
};
