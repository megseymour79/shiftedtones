/**
 * "Catch the Leak" — ear training for the other side of tone: hearing what
 * a line's delivery broadcasts before you answer it. Each scenario shows a
 * text-message-like line plus how it was delivered; the user names the
 * leak — the thing the words don't say but the voice does.
 */

export interface LeakOption {
  text: string;
  /** Shown after answering: why this is (or isn't) the leak. */
  note: string;
}

export interface LeakScenario {
  id: string;
  /** Who sent it, for flavor. */
  from: string;
  /** The literal words. */
  words: string;
  /** How it was delivered — the acoustic context the user "hears". */
  delivered: string;
  options: LeakOption[];
  /** Index of the option that names the actual leak. */
  answer: number;
}

export const LEAKS: LeakScenario[] = [
  {
    id: "fine",
    from: "Your partner",
    words: "“Fine. Whatever works for you.”",
    delivered: "Fast, pitch rises at the end, volume drops away on “you.”",
    options: [
      { text: "They're comfortable with either option", note: "That could be true, but the quick pace and falling volume may suggest some frustration." },
      { text: "They may be frustrated or unsure about the decision", note: "The rising pitch and fading volume could suggest that their words don't tell the whole story. You could ask what they prefer." },
      { text: "They didn't read the message properly", note: "The delivery alone doesn't tell us whether they read it. A quick follow-up could clarify." },
    ],
    answer: 1,
  },
  {
    id: "sure-thing",
    from: "A coworker you asked for help",
    words: "“Yeah, sure, I can take a look at it.”",
    delivered: "Long pause before “yeah,” flat pitch throughout, sigh at the end.",
    options: [
      { text: "They may be willing, but have some reservations", note: "They said yes, though the pause and sigh may suggest hesitation. You could ask if they have time to help." },
      { text: "They may be hesitant about helping", note: "The pause and sigh could signal hesitation, even though they said yes. Ask if they really have time to take a look." },
      { text: "Their microphone cut in and out", note: "The sound is clear in this example, so a technical issue seems less likely." },
    ],
    answer: 1,
  },
  {
    id: "nice-of-you",
    from: "Your brother, about a favor you asked",
    words: "“Wow. Nice of you to finally call.”",
    delivered: "Light and quick, but there's a hard little stop after “Wow.”",
    options: [
      { text: "He's teasing you and isn't upset", note: "It may be a joke, but the pause after “Wow” could suggest that he has mixed feelings." },
      { text: "He may be hurt that you didn't call sooner", note: "The pause may suggest that there's some frustration behind the joke. You could acknowledge it and ask how he's doing." },
      { text: "He's rehearsing a complaint for later", note: "The line may point to something he's feeling now, rather than a plan to bring it up later." },
    ],
    answer: 1,
  },
  {
    id: "no-rush",
    from: "Your client",
    words: "“No rush at all whenever you get to it!”",
    delivered: "The words end cheerful but the pace slows down on “whenever you get to it.”",
    options: [
      { text: "It may not be urgent", note: "That could be true, though the slowdown at the end may suggest there's a preferred timeline." },
      { text: "They may want it sooner than the words suggest", note: "The slower ending may point to some urgency. Ask what date would work for them." },
      { text: "They forgot they sent it", note: "The delivery doesn't tell us whether they remember sending it. You could ask for a deadline." },
    ],
    answer: 1,
  },
  {
    id: "take-care",
    from: "HR, ending a call",
    words: "“Okay. Well — take care.”",
    delivered: "Volume drops through the sentence; the last word almost disappears.",
    options: [
      { text: "A routine sign-off", note: "It could be a routine sign-off, but the dropping volume may suggest the conversation is ending abruptly." },
      { text: "They may have something else they want to discuss", note: "The fading volume could signal hesitation or a desire to end the call. If you're unsure, follow up and ask." },
      { text: "They had somewhere to be", note: "That is possible, though the delivery doesn't tell us why the call is ending." },
    ],
    answer: 1,
  },
  {
    id: "sounds-good",
    from: "Your manager, on your proposal",
    words: "“Mm. Sounds good.”",
    delivered: "Two seconds of silence before it; the “good” is flat and low.",
    options: [
      { text: "They approve of the proposal", note: "That may be true, but the pause and flat delivery could also mean they have questions." },
      { text: "They may have reservations or questions", note: "The pause and flat delivery may suggest hesitation. Ask what they think or whether anything should change." },
      { text: "They're multitasking", note: "That could be the case, though the delivery alone doesn't tell us." },
    ],
    answer: 1,
  },
];

/** Pick today's leak scenario (stable per local day). */
export function getDailyLeak(day: number): LeakScenario {
  return LEAKS[day % LEAKS.length];
}
