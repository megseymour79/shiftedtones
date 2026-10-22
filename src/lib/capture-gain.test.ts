import { describe, expect, test } from "bun:test";
import { analyzeFrames, type ToneFrame } from "./tone-analyzer";
import {
  calibrateInputGain,
  DEAD_TAKE_MESSAGES,
  deadTakeMessageFor,
  deadTakeReason,
  looksLikeMiclessSpeaker,
  gainedVolume,
  HOPELESS_RAW_FLOOR,
  CALIBRATION_WINDOW,
  initialInputGain,
  isDeadTake,
  isPeak,
  isSpeechLevel,
  MAX_INPUT_GAIN,
  MAX_RECORDED_VOLUME,
  MIN_SPEECH_FRAMES,
  SOFTWARE_GAIN,
  SPEECH_FLOOR,
  smoothMeterLevel,
} from "./capture-gain";

/** Build analyzer frames from raw RMS values through the real gain path. */
function framesFromRaw(raws: number[], inputGain = 1, pitchHz = 160): ToneFrame[] {
  return raws.map((r) => {
    const v = gainedVolume(r, inputGain);
    return {
      pitchHz: isSpeechLevel(v) ? pitchHz : null,
      volume: v,
      timestamp: 0,
    };
  });
}

describe("capture gain staging", () => {
  test("smooths noisy meter updates while reacting faster to speech onset", () => {
    expect(smoothMeterLevel(0, 1)).toBeCloseTo(0.55);
    expect(smoothMeterLevel(1, 0)).toBeCloseTo(0.8);
    expect(smoothMeterLevel(0.5, 2)).toBeLessThanOrEqual(1);
    expect(smoothMeterLevel(0.5, -1)).toBeGreaterThanOrEqual(0);
  });

  test("typical laptop-mic speech lands above the speech floor", () => {
    // Quiet-mic speech: raw RMS 0.02–0.05 (documented quiet-mic band)
    for (const raw of [0.02, 0.03, 0.04, 0.05]) {
      expect(isSpeechLevel(gainedVolume(raw))).toBe(true);
    }
    // Room tone must stay below it
    for (const raw of [0.001, 0.005, 0.01, 0.015]) {
      expect(isSpeechLevel(gainedVolume(raw))).toBe(false);
    }
  });

  test("gain is clamped so loud mics never saturate", () => {
    expect(gainedVolume(0.5)).toBe(MAX_RECORDED_VOLUME);
    expect(gainedVolume(10)).toBe(MAX_RECORDED_VOLUME);
    expect(gainedVolume(0)).toBe(0);
    expect(gainedVolume(0.1)).toBeCloseTo(0.25, 10);
  });

  test("raw speech through the gain path produces healthy voiced ratio", () => {
    // A raw take that pre-fix would have been half noise-gated:
    const raws = Array.from({ length: 100 }, (_, i) =>
      i % 2 === 0 ? 0.03 : 0.008, // alternating syllable / room tone
    );
    const frames = framesFromRaw(raws);
    const voiced = frames.filter((f) => f.pitchHz !== null).length;
    // Syllable frames voiced, room tone not — the gate works
    expect(voiced).toBe(50);
    const a = analyzeFrames(frames, 5_000);
    expect(a.voicedRatio).toBe(0.5);
  });

  test("quiet-mic take scores in a sane range (not the all-silence degenerate)", () => {
    const raws = Array.from({ length: 200 }, () => 0.035);
    const a = analyzeFrames(framesFromRaw(raws), 10_000);
    // Pre-fix, these frames would all sit at 0.035 RMS: pitch-less, and the
    // volume-based scores would read the take as near-silent.
    expect(a.voicedRatio).toBeGreaterThan(0.9);
    expect(a.energyScore).toBeGreaterThan(20);
    expect(a.calmScore).toBeGreaterThan(40);
    for (const s of [a.calmScore, a.energyScore, a.clarityScore, a.stabilityScore]) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  test("dead-mic detection: silence and near-silence are dead takes", () => {
    expect(isDeadTake(0)).toBe(true);
    expect(isDeadTake(MIN_SPEECH_FRAMES - 1)).toBe(true);
    expect(isDeadTake(MIN_SPEECH_FRAMES)).toBe(false);
    expect(isDeadTake(50)).toBe(false);
  });

  test("SPEECH_FLOOR sits above detectPitch's silence floor so gating is meaningful", () => {
    // detectPitch returns null below raw RMS 0.015; after ×2.5 gain that is
    // 0.0375. The speech floor must stay above it — otherwise "gating" would
    // feed noise to the detector anyway.
    expect(SPEECH_FLOOR).toBeGreaterThan(0.015 * SOFTWARE_GAIN);
  });
});

describe("adaptive input gain", () => {
  test("gain doubles while loud speech stays below the floor", () => {
    // Raw 0.012 speech: at gain 1 it lands at 0.03 — under the floor.
    expect(calibrateInputGain(1, 0.012)).toBe(2);
    // At gain 2 it reaches 0.06 — over the floor, so calibration stops.
    expect(calibrateInputGain(2, 0.012)).toBe(2);
    // A quieter voice needs more headroom: 0.007 settles at ×4.
    expect(calibrateInputGain(1, 0.007)).toBe(2);
    expect(calibrateInputGain(2, 0.007)).toBe(4);
    expect(calibrateInputGain(4, 0.007)).toBe(4);
  });

  test("gain never rises once speech is above the floor (no chasing)", () => {
    expect(calibrateInputGain(1, 0.06)).toBe(1);
    expect(calibrateInputGain(8, 0.06)).toBe(8);
  });

  test("hot input relaxes the gain instead of doubling it", () => {
    expect(isPeak(0.2)).toBe(true);
    expect(isPeak(0.1)).toBe(false);
    expect(calibrateInputGain(8, 0.2)).toBe(4);
    // Never relaxes below unity.
    expect(calibrateInputGain(1, 0.2)).toBe(1);
  });

  test("MAX_INPUT_GAIN caps the boost", () => {
    // 0.002 raw never crosses the floor at any legal gain, so calibration
    // keeps asking for more until the cap holds it at ×8.
    let gain = 1;
    for (let i = 0; i < 10; i++) gain = calibrateInputGain(gain, 0.002);
    expect(gain).toBe(MAX_INPUT_GAIN);
  });

  test("a very quiet mic becomes audible and scores sanely at its calibrated gain", () => {
    // Raw 0.012 (the "still says it can't hear me" band): silent at unity…
    expect(isSpeechLevel(gainedVolume(0.012, 1))).toBe(false);
    // …audible at the calibrated ×2.
    expect(isSpeechLevel(gainedVolume(0.012, 2))).toBe(true);
    const a = analyzeFrames(framesFromRaw(Array(200).fill(0.012), 2), 10_000);
    expect(a.voicedRatio).toBeGreaterThan(0.9);
    // A constant-pitch fixture reads low energy by design (monotone), but
    // audible — not the near-silent degenerate, which would score ~0.
    expect(a.energyScore).toBeGreaterThan(15);
  });

  test("initialInputGain converges to the fixed point for a known peak", () => {
    expect(initialInputGain(null)).toBe(1);
    expect(initialInputGain(0.012)).toBe(2);
    expect(initialInputGain(0.007)).toBe(4);
    expect(initialInputGain(0.05)).toBe(1); // already audible
    expect(initialInputGain(0.2)).toBe(1); // hot input relaxes to unity
  });

  test("mid-take recalibration adapts when the speaker leans in", () => {
    // 40 silent-ish frames (gain unchanged), then audible speech: the
    // window-40 calibration doubles the gain partway through the take.
    const raws = [
      ...Array(40).fill(0.006),
      ...Array(20).fill(0.012),
    ];
    let gain = 1;
    let speechFrames = 0;
    let maxRaw = 0;
    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i];
      maxRaw = Math.max(maxRaw, raw);
      if ((i + 1) % CALIBRATION_WINDOW === 0) {
        gain = calibrateInputGain(gain, maxRaw);
      }
      if (isSpeechLevel(gainedVolume(raw, gain))) speechFrames++;
    }
    expect(gain).toBe(2);
    expect(speechFrames).toBe(20);
  });
});

describe("dead-take verdicts", () => {
  test("each failure mode gets its own honest reason", () => {
    expect(deadTakeReason(0, 0.0002)).toBe("muted"); // nothing at all
    expect(deadTakeReason(0, 0.001)).toBe("too-quiet"); // below rescue
    expect(deadTakeReason(0, 0.006)).toBe("no-speech"); // audio, never gated in
    expect(deadTakeReason(0, 0.013)).toBe("soft"); // nearly there
  });

  test("the hopeless floor is exactly where rescue becomes impossible", () => {
    expect(HOPELESS_RAW_FLOOR).toBeCloseTo(0.0025, 10);
    expect(deadTakeReason(0, HOPELESS_RAW_FLOOR - 0.0001)).toBe("too-quiet");
    expect(deadTakeReason(0, HOPELESS_RAW_FLOOR + 0.0001)).toBe("no-speech");
  });

  test("every verdict has a user-facing message, and none is generic", () => {
    for (const reason of ["muted", "too-quiet", "soft", "no-speech"] as const) {
      const msg = DEAD_TAKE_MESSAGES[reason];
      expect(msg.length).toBeGreaterThan(20);
      expect(msg).toMatch(/mic|hear|speak|take/);
    }
  });

  test("deadTakeMessageFor enriches muted by what the stream reported", () => {
    // Track says it's muted → OS privacy / other-app message, not the
    // generic "check your settings" one.
    const mutedMsg = deadTakeMessageFor("muted", true, "MacBook Pro Mic");
    expect(mutedMsg).not.toBe(DEAD_TAKE_MESSAGES.muted);
    expect(mutedMsg).toMatch(/privacy|holding the mic/i);
    // Known device → names the input so a wrong pick is obvious.
    const namedMsg = deadTakeMessageFor("muted", false, "Stereo Mix");
    expect(namedMsg).toContain("Stereo Mix");
    expect(namedMsg.startsWith(DEAD_TAKE_MESSAGES.muted)).toBe(true);
    // Unknown device, not muted → base message unchanged.
    expect(deadTakeMessageFor("muted", false, "")).toBe(
      DEAD_TAKE_MESSAGES.muted,
    );
    // Non-muted reasons never get enrichment.
    for (const reason of ["too-quiet", "soft", "no-speech"] as const) {
      expect(deadTakeMessageFor(reason, true, "Whatever Mic")).toBe(
        DEAD_TAKE_MESSAGES[reason],
      );
    }
  });

  describe("looksLikeMiclessSpeaker", () => {
    test("common Bluetooth speaker names are detected", () => {
      expect(looksLikeMiclessSpeaker("JBL Flip 5")).toBe(true);
      expect(looksLikeMiclessSpeaker("JBL Charge 4")).toBe(true);
      expect(looksLikeMiclessSpeaker("Bose SoundLink Flex")).toBe(true);
      expect(looksLikeMiclessSpeaker("Anker Soundcore 2")).toBe(true);
      expect(looksLikeMiclessSpeaker("Sony SRS-XB23")).toBe(true);
      expect(looksLikeMiclessSpeaker("UE MEGABOOM 3")).toBe(true);
      expect(looksLikeMiclessSpeaker("Sonos Roam")).toBe(true);
    });

    test("normal microphones are not flagged", () => {
      expect(looksLikeMiclessSpeaker("iPhone Microphone")).toBe(false);
      expect(looksLikeMiclessSpeaker("AirPods Pro")).toBe(false);
      expect(looksLikeMiclessSpeaker("MacBook Pro Microphone")).toBe(false);
      expect(looksLikeMiclessSpeaker("Built-in Microphone")).toBe(false);
      expect(looksLikeMiclessSpeaker("Stereo Mix")).toBe(false);
      expect(looksLikeMiclessSpeaker("")).toBe(false);
    });
  });

  test("a dead take from a speaker explains why, with the route fix", () => {
    const msg = deadTakeMessageFor("muted", false, "JBL Flip 5");
    // Names the device and the root cause…
    expect(msg).toContain("JBL Flip 5");
    expect(msg).toMatch(/no usable microphone/i);
    // …and gives the phone-specific fix, not the in-app-picker one.
    expect(msg).toMatch(/audio[- ]route|unpair/i);
    expect(msg).not.toContain("switch it below");
  });
});
