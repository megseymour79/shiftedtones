/** The drill catalog for tone practice. */

export interface Drill {
  id: string;
  name: string;
  tag: string;
  color: string; // tailwind bg class
  prompt: string; // what to actually say
  focus: string;
  tips: string[];
  seconds: number; // suggested take length
}

export const DRILLS: Drill[] = [
  {
    id: "steady-ground",
    name: "Steady Ground",
    tag: "STAYING CALM",
    color: "bg-sun",
    prompt:
      "Describe what happened this morning — factually, without complaint. Then say: \"I'd like to fix one thing about it.\"",
    focus: "Keep your volume even and give each sentence time to land.",
    tips: [
      "Speak as you breathe out.",
      "Pause before \"I'd like to fix one thing.\"",
      "If you speed up, pause and try the sentence again.",
    ],
    seconds: 45,
  },
  {
    id: "warm-open",
    name: "Warm Open",
    tag: "WARMTH AND PRESENCE",
    color: "bg-mint",
    prompt:
      "Greet someone you haven't seen in months. Tell them one thing you genuinely appreciate about them.",
    focus: "Let your pitch rise and fall naturally. Slow down when you say their name.",
    tips: [
      "Let your pitch rise a little when you sound genuinely warm.",
      "Say their name slowly.",
      "Let your statements end clearly.",
    ],
    seconds: 40,
  },
  {
    id: "nice-no",
    name: "The Kind No",
    tag: "SAYING NO CLEARLY",
    color: "bg-sun",
    prompt:
      "A friend asks you to help them move on your only day off. Say no, offer something small you can actually do, and don't apologize more than once.",
    focus: "Keep your voice steady and your ending clear. Let the pause after your no stand.",
    tips: [
      "You can say no warmly and clearly.",
      "Apologize once, then move to your offer.",
      "Keep your explanation brief.",
    ],
    seconds: 40,
  },
  {
    id: "unruffled",
    name: "Un-Ruffled",
    tag: "STAYING STEADY",
    color: "bg-mint",
    prompt:
      "Someone makes a light jab at you in front of others. Respond without matching their tone — acknowledge it, then return to the conversation.",
    focus: "Notice when you feel the urge to react. Slow down instead of raising your voice.",
    tips: [
      "Slow down when you feel the urge to rush.",
      "A relaxed expression can soften your tone.",
      "Keep your volume a little lower than theirs.",
    ],
    seconds: 30,
  },
  {
    id: "firm-clear",
    name: "Firm & Clear",
    tag: "CLEAR BOUNDARIES",
    color: "bg-coral",
    prompt:
      "Say: \"That doesn't work for me. Here's what I can do instead.\" Then hold a pause for two seconds without filling it.",
    focus: "You can be firm without raising your voice. Keep your volume steady and finish clearly.",
    tips: [
      "Finish the sentence without trailing off.",
      "Let the pause stand instead of filling it.",
      "Keep your voice steady, even when you feel pressure to push.",
    ],
    seconds: 35,
  },
  {
    id: "de-escalate",
    name: "Bring It Down",
    tag: "LOWERING THE TENSION",
    color: "bg-mint",
    prompt:
      "Someone is talking over you, louder and faster. Without matching their volume, say: \"I want to hear this — and I can only hear it one voice at a time.\" Then slow your next sentence to half speed.",
    focus:
      "Lower your volume and slow your pace. Give the other person room to respond.",
    tips: [
      "Keep your volume a little lower than theirs.",
      "Try speaking as you breathe out.",
      "If they speed up, keep your pace steady.",
    ],
    seconds: 40,
  },
  {
    id: "praise-clear",
    name: "Name the Good",
    tag: "GIVING SPECIFIC PRAISE",
    color: "bg-sun",
    prompt:
      "Tell someone about one specific thing they did well this week — what they did, and what it made possible. Let the last sentence land before you stop.",
    focus:
      "Speak clearly and take your time. Let your voice lift a little when you name what they did well.",
    tips: [
      "Name the specific thing they did.",
      "Let your pitch lift a little as you describe it.",
      "Finish the last word clearly.",
    ],
    seconds: 35,
  },
  {
    id: "recovery",
    name: "The Clean Recovery",
    tag: "AFTER A MISSTEP",
    color: "bg-coral",
    prompt:
      "You just snapped at someone and you know it. Say: \"That came out sharper than I meant. Let me try that again.\" Then repeat your point, slower, at the tone you wanted the first time.",
    focus:
      "Acknowledge what happened briefly, then try again in the tone you intended.",
    tips: [
      "Acknowledge it briefly, then move on.",
      "Try again with a slower pace and a clear ending.",
      "Keep the apology simple and sincere.",
    ],
    seconds: 40,
  },
];

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

/** Scenario prompts for the trigger-reframe practice. */
export const REFRAME_SCENARIOS = [
  "Your boss emails \"we need to talk\" with no context.",
  "A friend cancels plans last minute for the third time.",
  "Someone takes credit for your idea in a meeting.",
  "Your partner sighs and says \"fine, whatever.\"",
  "A stranger cuts in line in front of you.",
  "You get critical feedback on something you worked hard on.",
];
