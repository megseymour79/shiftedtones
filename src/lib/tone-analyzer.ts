/**
 * Client-side voice tone analyzer.
 *
 * Captures the microphone with the Web Audio API and derives, in real time:
 *  - pitch (Hz) via time-domain autocorrelation
 *  - volume (RMS)
 *  - voiced/silence ratio, speaking pace estimate
 *
 * From these it computes coaching scores (0..100): calm, energy, clarity,
 * stability, and an overall score, plus a dominant tone label — including
 * how the delivery *lands* socially (irritated, passive-aggressive,
 * holding back, confused, suspicious) based on how pitch and pressure
 * drift across the take.
 */

export interface ToneFrame {
  pitchHz: number | null; // null when unvoiced
  volume: number; // RMS 0..1
  timestamp: number;
  /** Optional spectral flatness (0..1) of this frame — 1 = white noise,
   * near 0 = tonal. Present when the capture hook feeds it (voice activity
   * check); absent in older fixtures, where voicing falls back to pitch. */
  flatness?: number;
}

export interface ToneAnalysis {
  dominantTone: string;
  avgPitchHz: number;
  pitchRangeHz: number;
  avgVolume: number;
  volumeVariability: number;
  /** Relative drift of pitch across the take: (2nd-half mean − 1st-half mean) / 1st-half mean. */
  pitchTrend: number;
  /** Relative drift of volume across the take, same definition. */
  volumeTrend: number;
  wordsPerMinute: number;
  voicedRatio: number;
  calmScore: number;
  energyScore: number;
  clarityScore: number;
  stabilityScore: number;
  overallScore: number;
}

const MIN_PITCH = 60;
const MAX_PITCH = 400;
const WPM_ASSUMED_SYLLABLES_PER_WORD = 1.6;

/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002) on a time-domain
 * buffer. Returns null when the frame isn't a clear periodic signal.
 *
 * Steps: cumulative-mean-normalized difference function → first local
 * minimum under the absolute threshold → parabolic interpolation. Unlike
 * plain autocorrelation with peak-picking, YIN's normalization resists
 * octave jumps (picking the 2nd harmonic's lag) and formant-dominated
 * frames, which is where naive autocorrelation produces garbage pitch on
 * real speech.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;
  if (size < 256) return null;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.015) return null; // silence / noise floor

  const tauMin = Math.max(2, Math.floor(sampleRate / MAX_PITCH));
  const tauMax = Math.min(Math.floor(size / 2) - 1, Math.ceil(sampleRate / MIN_PITCH));
  if (tauMax <= tauMin) return null;
  const W = Math.floor(size / 2); // integration window

  // Difference function d(tau)
  const diff = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalized difference d'(tau)
  const cmnd = new Float32Array(tauMax + 1);
  let running = 0;
  cmnd[0] = 1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    running += diff[tau];
    cmnd[tau] = running === 0 ? 1 : (diff[tau] * (tau - tauMin + 1)) / running;
  }

  // First local minimum below the absolute threshold (octave-safe)
  const THRESHOLD = 0.15;
  let tauEstimate = -1;
  for (let tau = tauMin + 1; tau < tauMax; tau++) {
    if (cmnd[tau] < THRESHOLD) {
      while (tau + 1 < tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  // Fallback: global minimum, but only if it's a genuinely low dip —
  // aperiodic noise bottoms out well above the threshold.
  if (tauEstimate < 0) {
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = tauMin + 1; tau < tauMax; tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        minTau = tau;
      }
    }
    if (minTau > 0 && minVal < 0.5) tauEstimate = minTau;
  }
  if (tauEstimate < 0) return null;

  // Parabolic interpolation for sub-lag accuracy
  const x1 = cmnd[tauEstimate - 1];
  const x2 = cmnd[tauEstimate];
  const x3 = cmnd[tauEstimate + 1] ?? x2;
  const denom = 2 * (2 * x2 - x1 - x3);
  const shift = denom !== 0 ? (x3 - x1) / denom : 0;

  const pitchHz = sampleRate / (tauEstimate + shift);
  if (pitchHz < MIN_PITCH || pitchHz > MAX_PITCH) return null;
  return pitchHz;
}

/**
 * Spectral flatness (geometric mean / arithmetic mean of the spectrum):
 * 1 ≈ white noise, ≈0 ≈ pure tone. Computed on the hook side from an FFT
 * magnitude array and attached to frames as `flatness`. Zero bins are
 * floored to an epsilon so a single-dominant-bin spectrum reads as tonal
 * (near 0) rather than degenerating to 1.
 */
export function spectralFlatness(magnitudes: ArrayLike<number>): number {
  const EPS = 1e-10;
  const n = magnitudes.length;
  if (n === 0) return 1;
  let logSum = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const m = Math.max(magnitudes[i], EPS);
    logSum += Math.log(m);
    sum += m;
  }
  if (sum <= 0) return 1;
  return Math.min(1, Math.max(0, Math.exp(logSum / n) / (sum / n)));
}

/**
 * Median-filter the voiced-pitch sequence (window 5) to kill single-frame
 * octave jumps before any statistic consumes it. Real pitch glides
 * survive a 5-tap median; a lone doubled-halved outlier does not.
 */
function medianFilterPitches(pitches: number[]): number[] {
  if (pitches.length < 5) return pitches;
  const out: number[] = [];
  for (let i = 0; i < pitches.length; i++) {
    const lo = Math.max(0, i - 2);
    const hi = Math.min(pitches.length, i + 3);
    const win = pitches.slice(lo, hi).sort((a, b) => a - b);
    out.push(win[Math.floor(win.length / 2)]);
  }
  return out;
}

/** Mean absolute pitch delta between consecutive voiced frames, in semitones — pitch jitter. */
function jitterSemitones(pitches: number[]): number {
  if (pitches.length < 3) return 0;
  let sum = 0;
  for (let i = 1; i < pitches.length; i++) {
    sum += Math.abs(12 * Math.log2(pitches[i] / pitches[i - 1]));
  }
  return sum / (pitches.length - 1);
}

/** Mean absolute loudness delta between consecutive voiced frames, in dB — shimmer. */
function shimmerDb(volumes: number[]): number {
  if (volumes.length < 3) return 0;
  let sum = 0;
  for (let i = 1; i < volumes.length; i++) {
    const a = Math.max(volumes[i - 1], 1e-5);
    const b = Math.max(volumes[i], 1e-5);
    sum += Math.abs(20 * Math.log10(b / a));
  }
  return sum / (volumes.length - 1);
}

export interface AnalyzeOptions {
  /** Spoken-word estimate; when provided, WPM uses it instead of the syllable heuristic. */
  wordCount?: number;
}

/** Aggregate captured frames into a full analysis. */
export function analyzeFrames(
  frames: ToneFrame[],
  durationMs: number,
  options: AnalyzeOptions = {},
): ToneAnalysis {
  const rawPitches = frames
    .map((f) => f.pitchHz)
    .filter((p): p is number => p !== null);
  // Octave-jump outliers corrupt every downstream stat — median-filter first.
  const pitches = medianFilterPitches(rawPitches);
  const volumes = frames.map((f) => f.volume);
  const voicedFrames = frames.filter((f) => f.pitchHz !== null).length;
  const voicedRatio = frames.length > 0 ? voicedFrames / frames.length : 0;
  // Mean spectral flatness over frames that carried the measurement —
  // near 1 means the "voice" was mostly broadband hiss.
  const flatFrames = frames.filter((f) => typeof f.flatness === "number");
  const spectralFlat =
    flatFrames.length > 0
      ? flatFrames.reduce((acc, f) => acc + (f.flatness ?? 1), 0) /
        flatFrames.length
      : null;
  const jitter = jitterSemitones(pitches);
  shimmerDb(frames.filter((f) => f.pitchHz !== null).map((f) => f.volume));

  const avgPitchHz =
    pitches.length > 0
      ? pitches.reduce((a, b) => a + b, 0) / pitches.length
      : 0;
  const pitchRangeHz =
    pitches.length > 1
      ? Math.max(...pitches) - Math.min(...pitches)
      : 0;

  const avgVolume =
    volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 0;
  const volumeVariability =
    volumes.length > 1
      ? Math.sqrt(
          volumes.reduce(
            (acc, v) => acc + (v - avgVolume) * (v - avgVolume),
            0,
          ) / volumes.length,
        )
      : 0;

  // Relative pitch spread: tension and flatness both narrow it
  let pitchVariability = 0;
  if (pitches.length > 1) {
    const mean = avgPitchHz;
    pitchVariability =
      Math.sqrt(
        pitches.reduce((acc, p) => acc + (p - mean) * (p - mean), 0) /
          pitches.length,
      ) / mean;
  }

  // Delivery drift: how pitch and volume move from the first half of the
  // take to the second. Escalation, trailing off, and the quiet-with-rising-
  // pitch pattern all live here, not in the averages.
  const pitchTrend = splitHalfTrend(pitches);
  const volumeTrend = splitHalfTrend(volumes);

  // Speaking pace
  const durationSec = Math.max(durationMs / 1000, 1);
  let wordsPerMinute: number;
  if (options.wordCount && options.wordCount > 0) {
    wordsPerMinute = Math.round((options.wordCount / durationSec) * 60);
  } else {
    // Syllable-nucleus estimate: vowel centers show up as local energy peaks
    const estimatedSyllables = countSyllableNuclei(frames);
    wordsPerMinute = Math.round(
      (estimatedSyllables / WPM_ASSUMED_SYLLABLES_PER_WORD / durationSec) * 60,
    );
  }

  // ---- Scores (0..100) ----

  // Calm: moderate pace, not too loud, healthy voiced ratio
  const paceIdeal = 130; // wpm
  const pacePenalty = Math.min(Math.abs(wordsPerMinute - paceIdeal) / 90, 1);
  const volumePenalty = Math.min(Math.max(avgVolume - 0.25, 0) / 0.2, 1);
  const calmScore = Math.round(
    100 * (1 - 0.5 * pacePenalty - 0.3 * volumePenalty - 0.2 * (1 - voicedRatio)),
  );

  // Energy: pitch movement + volume presence (monotone reads low-energy)
  const rangeScore = Math.min(pitchRangeHz / 90, 1);
  const presenceScore = Math.min(avgVolume / 0.15, 1);
  const energyScore = Math.round(100 * (0.55 * rangeScore + 0.45 * presenceScore));

  // Clarity: steadiness of volume, adequate voicing, sane pace, and a
  // spectral signature that is tonal rather than hiss. When the capture
  // hook supplies flatness, a noise-dominated take can't score as clear.
  const steadyVolume = Math.min(volumeVariability / 0.09, 1); // lower = steadier
  const paceClarity = wordsPerMinute > 190 || wordsPerMinute < 70 ? 0.4 : 1;
  const tonalScore =
    spectralFlat === null ? 1 : 1 - Math.min(Math.max((spectralFlat - 0.45) / 0.35, 0), 1);
  const clarityScore = Math.round(
    100 *
      (0.35 * (1 - Math.abs(steadyVolume - 0.35)) +
        0.3 * Math.min(voicedRatio / 0.6, 1) +
        0.2 * paceClarity +
        0.15 * tonalScore),
  );

  // Stability: how consistently pitch holds — relative spread plus frame-to-
  // frame jitter (semitone deltas). Jitter catches the shakiness that a
  // wide-but-smooth range would otherwise hide.
  const spreadPenalty = Math.min(pitchVariability / 0.35, 1);
  const jitterPenalty = Math.min(jitter / 2.2, 1); // 2.2 st/frame ≈ severe wobble
  const stabilityRaw = 1 - (0.55 * spreadPenalty + 0.3 * jitterPenalty + 0.15 * (1 - Math.min(voicedRatio / 0.5, 1)));
  const stabilityScore = Math.round(
    100 * (voicedRatio > 0.15 ? stabilityRaw : 0.2),
  );

  // Tone label
  const dominantTone = labelTone({
    avgVolume,
    pitchVariability,
    wordsPerMinute,
    pitchRangeHz,
    voicedRatio,
    pitchTrend,
    volumeTrend,
  });

  const overallScore = Math.round(
    0.3 * calmScore +
      0.2 * energyScore +
      0.25 * clarityScore +
      0.25 * stabilityScore,
  );

  return {
    dominantTone,
    avgPitchHz: Math.round(avgPitchHz),
    pitchRangeHz: Math.round(pitchRangeHz),
    avgVolume: round2(avgVolume),
    volumeVariability: round2(volumeVariability),
    pitchTrend: round2(pitchTrend),
    volumeTrend: round2(volumeTrend),
    wordsPerMinute,
    voicedRatio: round2(voicedRatio),
    calmScore: clampScore(calmScore),
    energyScore: clampScore(energyScore),
    clarityScore: clampScore(clarityScore),
    stabilityScore: clampScore(stabilityScore),
    overallScore: clampScore(overallScore),
  };
}

/**
 * Relative drift of a per-frame value across the take: how much the second
 * half's mean differs from the first half's, as a fraction of the first.
 * Returns 0 for short captures where a trend would be noise.
 */
function splitHalfTrend(values: number[]): number {
  if (values.length < 8) return 0;
  const mid = Math.floor(values.length / 2);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const first = mean(values.slice(0, mid));
  const second = mean(values.slice(mid));
  const base = Math.max(Math.abs(first), 1e-6);
  return (second - first) / base;
}

function labelTone(m: {
  avgVolume: number;
  pitchVariability: number;
  wordsPerMinute: number;
  pitchRangeHz: number;
  voicedRatio: number;
  pitchTrend: number;
  volumeTrend: number;
}): string {
  if (m.voicedRatio < 0.12) return "quiet";
  const tense = m.pitchVariability > 0.22 && m.avgVolume > 0.12;
  const rushed = m.wordsPerMinute > 175;
  if (tense) return "tense";
  if (rushed) return "rushed";

  // How the delivery *lands* — the story the trends tell across the take.
  // Irritated: pitch and pressure climbing together as the take goes on.
  if (m.pitchTrend > 0.05 && m.volumeTrend > 0.15) return "irritated";
  // Passive-aggressive: pitch rising while volume fades — "fine, whatever."
  if (m.pitchTrend > 0.05 && m.volumeTrend < -0.05) return "passive-aggressive";
  // Holding back: the take audibly trails off — the end of the thought swallowed.
  if (m.volumeTrend < -0.2) return "holding-back";
  // Confused: quiet, searching pitch that wanders and drifts upward.
  if (m.pitchVariability > 0.18 && m.pitchTrend > 0.05 && m.avgVolume < 0.12) {
    return "confused";
  }
  // Suspicious: slow, measured, with pitch sinking — guarded delivery.
  if (m.wordsPerMinute < 110 && m.pitchTrend < -0.05 && m.pitchRangeHz < 60) {
    return "suspicious";
  }

  const flat = m.pitchRangeHz < 25 && m.pitchVariability < 0.08;
  if (flat) return "flat";
  if (m.wordsPerMinute >= 110 && m.pitchVariability >= 0.08) return "engaged";
  if (m.avgVolume > 0.02 && m.pitchVariability < 0.14) return "calm";
  return "mixed";
}

/**
 * Rough syllable count: vowel nuclei appear as local peaks in the volume
 * envelope. A ~200ms refractory window keeps one nucleus from counting twice.
 */
function countSyllableNuclei(frames: ToneFrame[]): number {
  const SYL_FLOOR = 0.04; // above silence, below voiced average
  const SYL_REFRACTORY = 2; // frames (~100ms) — allows fast speech up to ~6.7 syl/s
  let count = 0;
  let lastPeakAt = -Infinity;
  for (let i = 1; i < frames.length - 1; i++) {
    const v = frames[i].volume;
    if (v < SYL_FLOOR) continue;
    const isLocalMax = v >= frames[i - 1].volume && v > frames[i + 1].volume;
    if (isLocalMax && i - lastPeakAt > SYL_REFRACTORY) {
      count++;
      lastPeakAt = i;
    }
  }
  return Math.max(count, 1);
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Personalized feedback: per-factor status, your own numbers, and one concrete
// drill. This is the layer between the raw scores and the UI — every sentence
// is derived from this take's measurements, so two different takes never
// produce the same paragraph.
// ---------------------------------------------------------------------------

export type FactorKey = "calm" | "energy" | "clarity" | "stability";

export interface FactorFeedback {
  key: FactorKey;
  /** "strong" | "decent" | "wobbly" | "rough" — drives the UI color. */
  status: "strong" | "decent" | "wobbly" | "rough";
  /** How this factor's rating actually came across in THIS take. */
  read: string;
  /** The numbers behind the read, formatted for display. */
  yourNumbers: string;
  /** One concrete thing to do next time — specific to the weakest component. */
  tip: string;
}

function paceVerdict(wpm: number): string {
  if (wpm > 190) return `A very fast pace (${wpm} wpm)`;
  if (wpm > 165) return `A quick pace (${wpm} wpm)`;
  if (wpm >= 100) return `A conversational pace (${wpm} wpm)`;
  if (wpm >= 70) return `A slower pace (${wpm} wpm)`;
  return `A slow pace (${wpm} wpm)`;
}

function statusFor(score: number): FactorFeedback["status"] {
  if (score >= 80) return "strong";
  if (score >= 65) return "decent";
  if (score >= 45) return "wobbly";
  return "rough";
}

/**
 * Build per-factor personalized feedback from one analysis. Pure and
 * deterministic — every string traces back to a measured value.
 */
export function buildFactorFeedback(a: ToneAnalysis): Record<FactorKey, FactorFeedback> {
  const trending =
    Math.abs(a.volumeTrend) >= 0.2
      ? a.volumeTrend < 0
        ? " and your volume got quieter as you went"
        : " and your volume got louder as you went"
      : "";

  const calm: FactorFeedback = {
    key: "calm",
    status: statusFor(a.calmScore),
    read:
      `${paceVerdict(a.wordsPerMinute)}` +
      (a.avgVolume > 0.28
        ? ", and your volume was high"
        : a.avgVolume > 0
          ? ", at a comfortable volume"
          : "") +
      trending +
      ".",
    yourNumbers: `${a.wordsPerMinute} wpm · avg level ${Math.round(a.avgVolume * 100)}% · ${Math.round(a.voicedRatio * 100)}% voiced`,
    tip:
      a.wordsPerMinute > 165
        ? `You spoke quickly (${a.wordsPerMinute} wpm). Try pausing briefly between sentences.`
        : a.wordsPerMinute < 90
          ? `Your pace was ${a.wordsPerMinute} wpm, with longer pauses between thoughts. Try saying the sentence once out loud before recording.`
          : a.avgVolume > 0.28
            ? "Your volume was high. Try lowering it slightly while keeping your voice clear."
            : trending
              ? "Your volume changed during the take. Try keeping it steady for the first two sentences."
              : "Your pace and volume were steady. Keep this approach and pause when you want to emphasize a point.",
  };

  const energy: FactorFeedback = {
    key: "energy",
    status: statusFor(a.energyScore),
    read:
      a.pitchRangeHz < 25
        ? `Your pitch changed by ${a.pitchRangeHz} Hz, so your delivery may have sounded quite even.`
        : a.pitchRangeHz > 120
          ? `Your pitch varied by ${a.pitchRangeHz} Hz, adding expression to your delivery.`
          : `Your pitch varied by ${a.pitchRangeHz} Hz during the take.` + trending,
    yourNumbers: `${a.pitchRangeHz} Hz range · avg ${a.avgPitchHz} Hz · level ${Math.round(a.avgVolume * 100)}%`,
    tip:
      a.pitchRangeHz < 25
        ? "Try letting your pitch rise on one or two important words."
        : a.avgVolume < 0.08
          ? "Move a little closer to the microphone so your voice comes through clearly."
          : a.pitchRangeHz < 60
            ? "Choose one important word in each sentence and give it a little emphasis."
            : "Your pitch varied throughout the take. Keep that natural movement on the words that matter.",
  };

  const clarity: FactorFeedback = {
    key: "clarity",
    status: statusFor(a.clarityScore),
    read:
      a.volumeVariability > 0.09
        ? `Your volume changed by about ${Math.round(a.volumeVariability * 100)}% during the take, so some words may have sounded louder than others.`
        : `Your volume stayed fairly steady (within ${Math.round(a.volumeVariability * 100)}%).` +
          (a.voicedRatio < 0.5
            ? ` We detected speech during ${Math.round(a.voicedRatio * 100)}% of the take; the rest may have been too quiet.`
            : ""),
    yourNumbers: `volume change ±${Math.round(a.volumeVariability * 100)}% · ${Math.round(a.voicedRatio * 100)}% speech detected`,
    tip:
      a.volumeVariability > 0.09
        ? "Try reading the same sentence three times, keeping your volume steady."
        : a.voicedRatio < 0.5
          ? "Finish each word clearly before pausing."
          : a.wordsPerMinute > 190 || a.wordsPerMinute < 70
            ? `Your pace was ${a.wordsPerMinute} wpm. Try speaking at a more conversational pace, around 120–140 wpm.`
            : "Your volume was steady. Keep it even while letting your pitch move naturally.",
  };

  const stability: FactorFeedback = {
    key: "stability",
    status: statusFor(a.stabilityScore),
    read:
      a.pitchTrend > 0.05
        ? `Your pitch rose by ${Math.round(a.pitchTrend * 100)}% over the take. Try keeping your pitch steady if that's the tone you want.`
        : a.pitchTrend < -0.05
          ? `Your pitch dropped by ${Math.round(-a.pitchTrend * 100)}% over the take. Try finishing your statements at a steady pitch.`
          : `Your pitch stayed near ${Math.round(a.avgPitchHz)} Hz on average, with ${Math.round(a.pitchRangeHz)} Hz of movement.` +
            (a.voicedRatio < 0.15 ? " This score may be less reliable because we detected little speech." : ""),
    yourNumbers: `drift ${a.pitchTrend > 0 ? "+" : ""}${Math.round(a.pitchTrend * 100)}% · center ${a.avgPitchHz} Hz`,
    tip:
      a.pitchTrend > 0.05
        ? "Pause before you start, then try to keep your pitch steady."
        : a.pitchTrend < -0.05
          ? "Practice the final sentence separately and finish it clearly."
          : a.pitchRangeHz < 25
            ? "Your pitch stayed steady. Try adding a little movement to important words."
            : "Your pitch stayed consistent. Practice keeping it steady when you pause or restart.",
  };

  return { calm, energy, clarity, stability };
}

/**
 * The single highest-leverage next action: the weakest factor's tip.
 * Deliberately ONE item — a list of four gets ignored; one gets done.
 */
export function biggestLever(a: ToneAnalysis): { factor: FactorKey; tip: string } {
  const fb = buildFactorFeedback(a);
  const weakest = (Object.values(fb) as FactorFeedback[]).reduce((min, f) =>
    scoreOf(f.key, a) < scoreOf(min.key, a) ? f : min,
  );
  return { factor: weakest.key, tip: weakest.tip };
}

function scoreOf(key: FactorKey, a: ToneAnalysis): number {
  return key === "calm"
    ? a.calmScore
    : key === "energy"
      ? a.energyScore
      : key === "clarity"
        ? a.clarityScore
        : a.stabilityScore;
}

/**
 * Per-factor explanations for the results UI: how each score is computed
 * (honest, matching the formulas above) and what good delivery sounds
 * like. Kept beside the scoring code so the two can't drift apart.
 */
export const TONE_FACTORS: Record<
  "calm" | "energy" | "clarity" | "stability",
  { label: string; how: string; goal: string; color: string }
> = {
  calm: {
    label: "Calm",
    color: "bg-mint text-ink",
    how: "Rates your pace against a conversational average of about 130 wpm, your average volume, and how much of the take contains speech (voiced time). Faster speech, high volume, or long gaps can lower the score.",
    goal: "Aim for a conversational pace, comfortable volume, and steady speech without long gaps.",
  },
  energy: {
    label: "Energy",
    color: "bg-sun text-ink",
    how: "Looks at how much your pitch changed during the take and how loud your voice was. More pitch movement can add expression; very little movement or low volume can make a take sound less expressive.",
    goal: "Let your pitch move naturally on important words, and keep your voice clear from start to finish.",
  },
  clarity: {
    label: "Clarity",
    color: "bg-paper text-ink",
    how: "Uses volume consistency, voiced ratio, speaking pace, and spectral flatness (how tonal rather than hissy the audio sounds) to estimate how clearly speech comes through.",
    goal: "Keep your volume steady, finish your words clearly, and leave enough time for listeners to follow.",
  },
  stability: {
    label: "Stability",
    color: "bg-secondary text-ink",
    how: "Measures how much your pitch changes during the take, including small frame-to-frame shifts called jitter. If there isn't enough voiced speech, the score is lower rather than estimated from background noise.",
    goal: "Aim for a steady pitch and finish your sentences clearly.",
  },
};

/** Tone label + friendly description for display. */
export const TONE_LABELS: Record<
  string,
  { label: string; note: string; color: string }
> = {
  calm: {
    label: "CALM",
    note: "Your pace and volume stayed steady. Try building on that in your next take.",
    color: "bg-mint text-ink",
  },
  engaged: {
    label: "ENGAGED",
    note: "Your pitch moved and your voice had presence. This can help keep listeners engaged.",
    color: "bg-sun text-ink",
  },
  tense: {
    label: "TENSE",
    note: "Your volume was high and your pitch varied. Pause and take a breath before your next take.",
    color: "bg-coral text-ink",
  },
  rushed: {
    label: "RUSHED",
    note: "You spoke quickly. Try slowing down to give listeners more time to follow.",
    color: "bg-coral text-ink",
  },
  irritated: {
    label: "IRRITATED",
    note: "Your pitch and volume increased during the take. Pause, then try speaking more slowly and evenly.",
    color: "bg-coral text-ink",
  },
  "passive-aggressive": {
    label: "PASSIVE-AGGRESSIVE",
    note: "Your pitch rose as your volume dropped. Try saying the sentence with an even volume.",
    color: "bg-sun text-ink",
  },
  "holding-back": {
    label: "HOLDING BACK",
    note: "Your volume faded toward the end. Try finishing at the same volume you started.",
    color: "bg-paper text-ink",
  },
  confused: {
    label: "CONFUSED",
    note: "Your voice was quiet and your pitch shifted upward. Try ending the sentence clearly.",
    color: "bg-secondary text-ink",
  },
  suspicious: {
    label: "SUSPICIOUS",
    note: "Your pace was slow and your pitch dropped. If you want to sound curious, let the final phrase lift a little.",
    color: "bg-secondary text-ink",
  },
  flat: {
    label: "FLAT",
    note: "Your pitch stayed in a narrow range. Try letting it move on important words.",
    color: "bg-paper text-ink",
  },
  quiet: {
    label: "QUIET",
    note: "We could barely hear your voice. Move closer to the microphone or raise its input volume.",
    color: "bg-paper text-ink",
  },
  mixed: {
    label: "MIXED",
    note: "Your delivery changed during the take. Choose one intention and practice speaking to it.",
    color: "bg-secondary text-ink",
  },
};
