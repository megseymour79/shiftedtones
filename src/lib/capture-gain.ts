/**
 * Capture gain-staging — the pure decision logic behind the mic fix.
 *
 * autoGainControl stays OFF during recording (browser AGC smears the
 * dynamics the analyzer measures). Instead of a fixed software gain, the
 * pipeline tracks a mutable *input gain*: every raw sample passes through
 * `gainedVolume(raw, gain)`, and `calibrateInputGain` raises the gain when
 * loud speech still lands below the speech floor — so very quiet laptop
 * mics (raw RMS ~0.01) get heard without smearing the dynamics above the
 * floor.
 *
 * Everything here is pure: the hook owns the mutable state and applies
 * these functions per frame.
 */

/** Analysis-only multiplier applied to the raw mic signal, on top of the
 * adaptive input gain. Pitch detection is scale-invariant; only
 * loudness-based scoring sees this. */
export const SOFTWARE_GAIN = 2.5;

/** Loudest recorded volume, so hot mics never saturate the scores. */
export const MAX_RECORDED_VOLUME = 0.8;

/** Gained volume at/above which a frame counts as speech (not room tone). */
export const SPEECH_FLOOR = 0.05;

/** Fewer speech-level frames than this ≈ the mic never heard you. */
export const MIN_SPEECH_FRAMES = 5;

/** Max multiplier the adaptive input gain may reach. */
export const MAX_INPUT_GAIN = 8;

/** Sample size for calibration, and when to recalibrate mid-take. */
export const CALIBRATION_WINDOW = 40;
export const RECALIBRATE_EVERY = 200;

/** Raw mic RMS → recorded volume through the given input gain, clamped. */
export function gainedVolume(rawRms: number, inputGain = 1): number {
  return Math.min(rawRms * SOFTWARE_GAIN * inputGain, MAX_RECORDED_VOLUME);
}

/** Smooth the live meter without hiding sudden speech onset or dropouts. */
export function smoothMeterLevel(current: number, target: number): number {
  const clampedTarget = Math.max(0, Math.min(1, target));
  const rate = clampedTarget > current ? 0.55 : 0.2;
  return current + (clampedTarget - current) * rate;
}

/** Does this gained volume clear the speech floor? */
export function isSpeechLevel(gainedRms: number): boolean {
  return gainedRms >= SPEECH_FLOOR;
}

/**
 * Exponential-minimum tracker for the room's noise floor (raw RMS domain).
 * Drops fast onto quieter signal (that IS the floor), rises very slowly
 * against speech (speech is not the floor), so the gate adapts to fan
 * hum, quiet offices, and loud cafés without ever gating real speech.
 */
export function updateNoiseFloor(currentFloor: number, rawRms: number): number {
  if (!(rawRms > 0)) return currentFloor;
  let next: number;
  if (rawRms < currentFloor) {
    next = currentFloor * 0.7 + rawRms * 0.3; // fast drop onto new floor
  } else {
    next = currentFloor * 1.001 + rawRms * 0.0005; // very slow rise
  }
  return Math.max(0.0001, Math.min(0.05, next));
}

/** Raw signal counts as speech this far above the tracked room floor. */
export const NOISE_FLOOR_SPEECH_RATIO = 3.5;

/**
 * The per-frame voicing gate: the gained signal clears the calibrated
 * speech floor (normal case), OR the raw signal stands well above the
 * room's own tracked floor (a very quiet mic under adaptive gain, or a
 * loud room where the fixed floor would stay too low).
 */
export function isSpeechFrame(
  rawRms: number,
  gainedRms: number,
  noiseFloor: number,
): boolean {
  if (isSpeechLevel(gainedRms)) return true;
  return noiseFloor > 1e-4 && rawRms > noiseFloor * NOISE_FLOOR_SPEECH_RATIO;
}

/** A take whose frames never reached speech level is a dead-mic take. */
export function isDeadTake(speechFrameCount: number): boolean {
  return speechFrameCount < MIN_SPEECH_FRAMES;
}

/** Is this raw sample a loud peak (as opposed to ordinary speech)? */
export function isPeak(rawRms: number): boolean {
  return rawRms > 0.15;
}

/**
 * Next input gain, given the max raw RMS observed since the last pass.
 * * Silent so far → unchanged.
 * * Loud peaks present → input is hot; relax back toward 1.
 * * Speech observed but everything below the floor → raise the gain so
 *   their normal voice crosses it.
 * * Speech already above the floor → unchanged (never chase).
 */
export function calibrateInputGain(currentGain: number, maxRawRms: number): number {
  if (maxRawRms <= 0) return currentGain;
  if (isPeak(maxRawRms)) return Math.max(1, currentGain / 2);
  const loudestGained = gainedVolume(maxRawRms, currentGain);
  if (loudestGained >= SPEECH_FLOOR) return currentGain;
  return Math.min(MAX_INPUT_GAIN, currentGain * 2);
}

/** Raw amplitude below this, nothing will bring it to speech level. */
export const HOPELESS_RAW_FLOOR = SPEECH_FLOOR / (SOFTWARE_GAIN * MAX_INPUT_GAIN);

/** Why a take failed to produce speech-level frames. */
export type DeadTakeReason =
  | "muted" // absolutely nothing came in
  | "too-quiet" // audio arrived but stayed far below the floor
  | "soft" // nearly there — closer to the mic should do it
  | "no-speech"; // audio present, floor crossed, but too few frames

/** Pick the honest reason a take had too few speech frames. */
export function deadTakeReason(
  frameCount: number,
  maxRawRms: number,
): DeadTakeReason {
  if (maxRawRms < 0.0005) return "muted";
  if (maxRawRms < HOPELESS_RAW_FLOOR) return "too-quiet";
  const loudestGained = gainedVolume(maxRawRms);
  if (loudestGained >= SPEECH_FLOOR * 0.5) return "soft";
  return "no-speech";
}

/** The user-facing message for each dead-take verdict. */
export const DEAD_TAKE_MESSAGES: Record<DeadTakeReason, string> = {
  muted:
    "We didn't pick up any sound. Check that the right microphone is selected and isn't muted, then try again.",
  "too-quiet":
    "We could barely hear you. Move closer to your microphone or raise its input volume, then try again.",
  soft:
    "Your voice came through quietly. Move closer to your microphone and try again.",
  "no-speech":
    "There wasn't enough speech to score this take. Try speaking for a few full sentences.",
};

/**
 * Heuristic: does this device label look like a Bluetooth speaker without
 * a usable microphone? Phones expose speakers as the audio route even
 * though they can't record (JBL Flip/Charge, Bose SoundLink, Sony SRS…),
 * so a take "opens fine" and delivers pure silence. A false positive
 * costs one extra sentence in a warning; a false negative costs another
 * silently wasted take.
 */
const SPEAKER_HINT_RE =
  /\b(jbl|flip ?\d?|charge ?\d?|soundlink|soundcore|flare ?\d?|sonos|roam|move|megaboom|wonderboom|boom ?\d?|xtreme ?\d?|partybox|srs-?\w*|speakers?|lautsprecher|altavoz)\b/;

export function looksLikeMiclessSpeaker(label: string): boolean {
  return SPEAKER_HINT_RE.test(label.toLowerCase());
}

/** The message for a take recorded from an input that looks like a speaker. */
function speakerTakeMessage(trackLabel: string): string {
  return (
    `This take used “${trackLabel},” a speaker with no usable microphone, so we didn't receive any audio. ` +
    "Turn off or disconnect the speaker. On iPhone, open Control Center and switch the audio route to iPhone, then try again."
  );
}

/**
 * The final dead-take message, enriched with what the stream itself
 * reported. Pure so the enrichment rules are unit-testable:
 * * a track that says it's muted points at the OS privacy layer or
 *   another app holding the mic — the generic "check settings" text
 *   would mislead;
 * * a device label that looks like a Bluetooth speaker gets the specific
 *   "speakers can't record" fix — the top silent-take cause on phones;
 * * a known device label names the input that heard nothing — a virtual
 *   cable or "Stereo Mix" is the top wrong-device culprit on desktop;
 * * anything else keeps the base verdict unchanged.
 */
export function deadTakeMessageFor(
  reason: DeadTakeReason,
  trackMuted: boolean,
  trackLabel: string,
): string {
  if (reason !== "muted") return DEAD_TAKE_MESSAGES[reason];
  if (trackMuted) {
    return "Your microphone stayed muted during the take. Check your device's microphone privacy settings and close other apps that may be using it, then try again.";
  }
  if (trackLabel && looksLikeMiclessSpeaker(trackLabel)) {
    return speakerTakeMessage(trackLabel);
  }
  if (trackLabel) {
    return (
      DEAD_TAKE_MESSAGES.muted +
      ` Active input: “${trackLabel}.” If that's not the microphone you want to use, choose another input below and try again.`
    );
  }
  return DEAD_TAKE_MESSAGES.muted;
}

/**
 * The adaptive input gain a take should start with, given the peak raw
 * level the last take reached. Deterministic so tests are stable.
 */
export function initialInputGain(lastTakeMaxRawRms: number | null): number {
  if (lastTakeMaxRawRms === null) return 1;
  let gain = 1;
  let prev = -1;
  while (gain !== prev) {
    prev = gain;
    gain = calibrateInputGain(gain, lastTakeMaxRawRms);
  }
  return gain;
}
