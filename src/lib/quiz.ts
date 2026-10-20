/**
 * "Read the Room" — scenario quizzes that train the judgment behind tone:
 * what a situation calls for, and what your options actually sound like.
 * Mic-free, mobile-friendly, and quick enough to do over coffee.
 */

export interface QuizOption {
  text: string;
  /** How this response might come across. */
  note: string;
}

export interface QuizQuestion {
  id: string;
  /** The situation for the user to respond to. */
  scene: string;
  /** Who is speaking in the scenario. */
  from: string;
  options: QuizOption[];
  /** Index of the option that best balances honesty and warmth. */
  best: number;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "boss-minute",
    from: "Your boss, 4:58pm",
    scene: "“Got a minute? Need to ask you something before you head out.”",
    options: [
      {
        text: "“Sure — one minute!” (cheerful, quick)",
        note: "It's friendly, but the quick yes may promise more time than you have.",
      },
      {
        text: "“I can talk in ten minutes.” (calm, unhurried)",
        note: "This is warm and clear about when you'll be available.",
      },
      {
        text: "“Can this wait till tomorrow?” (flat)",
        note: "This sets a boundary, but a warmer tone can make it clear you're not dismissing the question.",
      },
    ],
    best: 1,
  },
  {
    id: "snippy-text",
    from: "Your sister",
    scene: "“Fine. Do whatever you want.”",
    options: [
      {
        text: "“I'm not doing whatever you want!” (matching her tone)",
        note: "Matching her tone could turn this into an argument.",
      },
      {
        text: "(no reply)",
        note: "No reply can leave the other person unsure how you feel.",
      },
      {
        text: "“I don't think I said that well. Can we talk tonight?” (calm, warm)",
        note: "This acknowledges the misunderstanding and suggests a way to talk it through.",
      },
    ],
    best: 2,
  },
  {
    id: "credit-steal",
    from: "A coworker, in the meeting",
    scene: "“Yeah, I put together the proposal last week, and I think it's strong.”",
    options: [
      {
        text: "“I wrote most of that proposal.” (corrective, loud)",
        note: "It clarifies your contribution, but a raised voice may distract from your point.",
      },
      {
        text: "“I'm glad the proposal is useful. The data I pulled shows…” (warm, firm)",
        note: "This adds your contribution clearly and keeps the conversation moving.",
      },
      {
        text: "(say nothing, but feel frustrated)",
        note: "Staying quiet may feel easier now, but it leaves your contribution unrecognized.",
      },
    ],
    best: 1,
  },
  {
    id: "running-late",
    from: "A friend, waiting at the restaurant",
    scene: "“Where are you?? I've been sitting here 20 minutes.”",
    options: [
      {
        text: "“I'm so sorry! I'll be there in five!” (rushed)",
        note: "The apology is clear, but a specific and realistic arrival time matters most.",
      },
      {
        text: "“Traffic's bad. Order without me.” (clipped)",
        note: "This shares what happened, but may sound abrupt when your friend has been waiting.",
      },
      {
        text: "“I'm sorry I'm late. I'll be there in six minutes. Go ahead and order.” (clear, warm)",
        note: "This takes responsibility, gives a time estimate, and lets your friend know what to do.",
      },
    ],
    best: 2,
  },
  {
    id: "boundary-push",
    from: "Your neighbor, at the door",
    scene: "“You don't mind watching Ringo this weekend again, right? You're so good with him.”",
    options: [
      {
        text: "“I guess I can, but this is getting hard to manage.” (reluctant)",
        note: "This hints that you don't want to say yes, but leaves the answer unclear.",
      },
      {
        text: "“I can't watch Ringo this weekend.” (warm, direct)",
        note: "This gives a clear answer without overexplaining.",
      },
      {
        text: "“I'm so sorry, we're really busy. Maybe next month?” (over-apologetic)",
        note: "This leaves the door open even if you don't want to commit to next month.",
      },
    ],
    best: 1,
  },
  {
    id: "unwanted-advice",
    from: "Your uncle, at dinner",
    scene: "“You know, in my day people your age had houses by 30. Just saying.”",
    options: [
      {
        text: "“It's complicated, and I don't want to discuss it.” (sharp)",
        note: "This sets a boundary, but the sharp tone may make dinner more tense.",
      },
      {
        text: "“And people your age didn't give financial advice at dinner.” (playful jab)",
        note: "This may get a laugh, but it also turns the comment into a back-and-forth.",
      },
      {
        text: "“Homes cost a lot more compared with salaries now.” (calm, factual)",
        note: "This responds to the comparison without making it personal.",
      },
    ],
    best: 2,
  },
];

/** One question per day, cycling — the quiz is a daily ritual, not a batch. */
export function getDailyQuestion(day: number): QuizQuestion {
  return QUIZ[day % QUIZ.length];
}
