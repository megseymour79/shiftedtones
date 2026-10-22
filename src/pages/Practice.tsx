import { NBBadge, NBButton, NBPanel, NBMeter } from "@/components/nb";
import { MicError } from "@/components/MicError";
import { MicPicker, getSavedMicDeviceId } from "@/components/MicPicker";
import { CoachNote } from "@/components/CoachNote";
import { getDrill, type Drill } from "@/lib/drills";
import { UNLOCKABLE_DRILLS, isUnlocked, unlockGoalLine } from "@/lib/unlocks";
import { getAccessibleDailyChallenge } from "@/lib/daily";
import {
  PACE_BAR_CLASS,
  PACE_HINTS,
  pacePct,
  paceStatus,
} from "@/lib/take-timing";
import {
  biggestLever,
  buildFactorFeedback,
  TONE_FACTORS,
  TONE_LABELS,
  type FactorKey,
  type FactorFeedback,
  type ToneAnalysis,
} from "@/lib/tone-analyzer";
import { useToneCapture } from "@/hooks/use-tone-capture";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Check,
  Lock,
  Mic,
  MessageSquareText,
  Play,
  Square,
  Target,
  Volume2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { CONTEXT_PROMPTS } from "@/lib/context-prompts";
import { levelInfo } from "@/lib/gamify";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function buildScoreBreakdown(analysis: ToneAnalysis, transcript: string) {
  const fillerCount =
    transcript.match(/\b(?:um+|uh+|erm+|ah+|you know|i mean)\b/gi)?.length ?? 0;
  const paceScore = Math.max(
    0,
    Math.round(100 - Math.min(Math.abs(analysis.wordsPerMinute - 130) * 0.7, 100)),
  );

  return [
    {
      label: "Pace",
      score: paceScore,
      detail: `${analysis.wordsPerMinute} words per minute; the guide is around 130.`,
    },
    {
      label: "Pitch & tone",
      score: analysis.energyScore,
      detail: `${analysis.pitchRangeHz} Hz of pitch movement; more movement can add expression.`,
    },
    {
      label: "Volume & clarity",
      score: analysis.clarityScore,
      detail: `Average input ${Math.round(analysis.avgVolume * 100)}%; volume variation ±${Math.round(analysis.volumeVariability * 100)}%.`,
    },
    {
      label: "Pauses & fillers",
      score: transcript.trim() ? Math.max(0, 100 - fillerCount * 12) : null,
      detail: transcript.trim()
        ? `${fillerCount} common filler${fillerCount === 1 ? "" : "s"} found in the optional transcript. Pauses are not scored.`
        : "Not scored because speech-to-text was unavailable. Intentional pauses are useful.",
    },
    {
      label: "Confidence & consistency",
      score: analysis.stabilityScore,
      detail: "Pitch stability is a delivery consistency signal, not a measure of how confident you felt.",
    },
  ] as const;
}

function feedbackSummary(analysis: ToneAnalysis): string {
  const scores: Record<FactorKey, number> = {
    calm: analysis.calmScore,
    energy: analysis.energyScore,
    clarity: analysis.clarityScore,
    stability: analysis.stabilityScore,
  };
  const strongest = (Object.keys(scores) as FactorKey[]).reduce((best, key) =>
    scores[key] > scores[best] ? key : best,
  );
  const next = biggestLever(analysis);
  return `What went well: ${TONE_FACTORS[strongest].label} (${scores[strongest]}/100). ${buildFactorFeedback(analysis)[strongest].read} Improve next: ${TONE_FACTORS[next.factor].label} (${scores[next.factor]}/100). Next action: ${next.tip}`;
}

export default function Practice() {
  const { drillId } = useParams();
  const drill = drillId ? getDrill(drillId) : undefined;
  const progression = useQuery(api.dailyLog.progression);
  const stats = {
    takes: progression?.totalSessions ?? 0,
    level: levelInfo(progression?.totalXp ?? 0).level,
    drillsTried: progression?.drillsTried ?? 0,
    bestScore: progression?.bestOverall ?? 0,
    streak: progression?.streakDays ?? 0,
  };
  const gate = UNLOCKABLE_DRILLS.find((u) => u.id === drillId);
  // Enforce the lock only once the stats have loaded: with progression
  // still undefined, zeros would falsely lock veterans mid-navigation.
  const lockKnown = progression !== undefined;
  const locked = lockKnown && !!gate && !isUnlocked(gate, stats);

  if (!drill) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <NBPanel className="p-8 text-center">
            <p className="font-display text-xl">We couldn't find that scenario.</p>
            <Link to="/gym" className="mt-4 inline-block">
              <NBButton variant="paper">Back to practice</NBButton>
            </Link>
          </NBPanel>
        </div>
      </AppShell>
    );
  }

  if (lockKnown === false && drill) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <NBPanel className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Loading your practice…</p>
          </NBPanel>
        </div>
      </AppShell>
    );
  }

  if (locked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <NBPanel className="p-8 text-center">
            <Lock className="mx-auto size-8" />
            <p className="mt-3 font-display text-xl">{drill.name} isn't available yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {gate?.blurb}               Your next step: {gate ? unlockGoalLine(gate, stats) : "keep practicing"}.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/gym">
                <NBButton variant="paper">Back to practice</NBButton>
              </Link>
              <Link to="/practice/steady-ground">
                <NBButton variant="coral">Try another scenario</NBButton>
              </Link>
            </div>
          </NBPanel>
        </div>
      </AppShell>
    );
  }

  // Keyed by drillId: switching drills remounts the runner, which resets
  // capture and saved state cleanly instead of via setState-in-effect.
  const isDaily = getAccessibleDailyChallenge((id) => {
    const g = UNLOCKABLE_DRILLS.find((u) => u.id === id);
    return !g || isUnlocked(g, stats);
  }).drill.id === drillId;
  return <PracticeRunner key={drillId} drill={drill} isDaily={isDaily} />;
}

function PracticeRunner({ drill, isDaily }: { drill: Drill; isDaily: boolean }) {
  const capture = useToneCapture();
  const [saved, setSaved] = useState(false);
  // The user's own context: what this take is responding to or opening.
  const [context, setContext] = useState("");
  const [expandedFactor, setExpandedFactor] = useState<
    "calm" | "energy" | "clarity" | "stability" | null
  >(null);
  const drillStats = useQuery(api.sessions.drillStats);
  const bestByDrill = new Map((drillStats ?? []).map((s) => [s.drill, s]));
  const priorBestScore = useRef<number | null>(null);

  // Pre-roll countdown: hit Start, breathe for three beats, then the
  // recorder actually opens. State lives here (UI choreography), the
  // capture hook stays a pure clock. The hook object is unstable across
  // renders, so the effect reads it through a ref — a mid-countdown
  // re-render must never reset the ticking timer.
  const targetMs = drill.seconds * 1000;
  const captureRef = useRef(capture);
  useEffect(() => {
    captureRef.current = capture;
  }, [capture]);
  const startTake = () => {
    const current = captureRef.current;
    priorBestScore.current = bestByDrill.get(drill.id)?.bestScore ?? null;
    void current.start(current.lastPeakRawRms, getSavedMicDeviceId(), targetMs);
  };

  // Space toggles record/stop — the desktop flow never leaves the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(el.tagName)) return;
      e.preventDefault();
      const c = captureRef.current;
      if (c.state === "idle") {
        priorBestScore.current = bestByDrill.get(drill.id)?.bestScore ?? null;
        void c.start(c.lastPeakRawRms, getSavedMicDeviceId(), targetMs);
      }
      else if (c.state === "recording") c.stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bestByDrill, drill.id, targetMs]);

  // Landing on the results: the reveal draws the eye to the verdict.
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const prevAnalysis = useRef(capture.analysis);
  useEffect(() => {
    if (capture.analysis && capture.analysis !== prevAnalysis.current) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevAnalysis.current = capture.analysis;
  }, [capture.analysis]);

  // Pacing guidance against the drill's suggested length.
  const pace = paceStatus(capture.elapsedMs, targetMs);
  const pct = pacePct(capture.elapsedMs, targetMs);

  const {
    state,
    error,
    level,
    livePitchHz,
    elapsedMs,
    analysis,
    transcript,
    activeDeviceLabel,
    micMuted,
    audioUrl,
    reset,
  } = capture;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-10 pt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/gym">
            <NBButton variant="paper" className="px-3 py-2">
              <ArrowLeft className="size-4" /> Practice
            </NBButton>
          </Link>
          <div className="flex items-center gap-2">
            {isDaily && <NBBadge className="bg-coral">A suggestion for today</NBBadge>}
            <NBBadge className="bg-sun">{drill.tag}</NBBadge>
          </div>
        </div>

        {/* Drill header */}
        <NBPanel className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl">{drill.name}</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {drill.focus}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="size-5" />
              <span className="font-display text-lg">{fmtTime(elapsedMs)}</span>
              <span className="text-xs font-bold text-muted-foreground">
                / {fmtTime(drill.seconds * 1000)}
              </span>
            </div>
          </div>
          <div className="mt-4 nb bg-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Your prompt
            </p>
            <p className="mt-1 font-medium leading-relaxed">{drill.prompt}</p>
          </div>
        </NBPanel>

        {/* Recorder */}
        <NBPanel className="p-6">
          <div className="flex flex-col items-center gap-5">
            {/* Live visualizer */}
            {state !== "requesting" && (
              <div
                className="flex h-24 w-full items-end justify-center gap-1"
                aria-hidden
              >
                {Array.from({ length: 28 }).map((_, i) => {
                  const wave =
                    state === "recording"
                      ? Math.max(
                          level *
                            (0.4 +
                              0.6 *
                                Math.abs(
                                  Math.sin(i * 0.9 + elapsedMs / 180),
                                )),
                          0.06,
                        )
                      : 0.06;
                  const heightPct = Math.min(wave * 100, 100);
                  return (
                    <div
                      key={i}
                      className={
                        i >= 8 && i <= 19 ? "w-2.5 bg-coral" : "w-2.5 bg-ink/70"
                      }
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                  );
                })}
              </div>
            )}

            {/* Target pacing meter — where you are against the drill's length */}
            {state === "recording" && (
              <div className="w-full">
                <div className="h-3 w-full nb bg-card overflow-hidden">
                  <div
                    className={cn("h-full transition-[width] duration-300", PACE_BAR_CLASS[pace])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Target className="size-3.5" /> {PACE_HINTS[pace]}
                  </span>
                  <span>
                    {fmtTime(elapsedMs)} / {fmtTime(targetMs)}
                  </span>
                </div>
              </div>
            )}

            {state === "recording" && (
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live pitch · {livePitchHz ? `${Math.round(livePitchHz)} Hz` : "listening for you…"}
                {level < 0.2 && elapsedMs > 3000 && " · we can barely hear you — move closer"}
              </p>
            )}
            {state === "requesting" && (
              <p className="text-sm text-muted-foreground" role="status">
                Waiting for microphone access…
              </p>
            )}

            {error && <MicError message={error} />}

            {state === "recording" && micMuted && (
              <p className="nb bg-sun px-3 py-2 text-sm font-medium">
                The mic reports itself muted — check your system's mic privacy
                setting or close the app holding it; this take will come back
                empty otherwise.
              </p>
            )}

            <MicPicker activeLabel={activeDeviceLabel} showSelector={false} />

            {/* Controls */}
            <div
              className={cn(
                "flex items-center gap-3",
                state === "recording" &&
                  "fixed inset-x-0 z-50 mx-auto w-fit bg-paper/95 p-3 shadow-lg backdrop-blur md:static md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none",
              )}
              style={
                state === "recording"
                  ? { bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }
                  : undefined
              }
            >
              {state === "idle" && (
                <NBButton
                  onClick={startTake}
                  variant="coral"
                >
                  <Mic className="size-4" /> Start my take
                </NBButton>
              )}
              {state === "requesting" && (
                <NBButton onClick={reset} variant="paper">
                  Cancel microphone request
                </NBButton>
              )}
              {state === "recording" && (
                <NBButton onClick={stop} variant="ink">
                  <Square className="size-4" /> Done — score it
                </NBButton>
              )}
              {state === "analyzing" && (
                <NBButton disabled variant="ink">
                  Analyzing…
                </NBButton>
              )}
              {state === "done" && (
                <NBButton onClick={reset} variant="paper">
                  Go again
                </NBButton>
              )}
            </div>
            <p className="hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:block">
              Tip: press Space to start / stop
            </p>
          </div>
        </NBPanel>

        {/* The user's context — what this take is responding to or opening. */}
        <NBPanel className="bg-secondary p-6">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-5" />
            <p className="font-display text-xl">Add context</p>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Add a quick note about this take (who it is for or what happened).
            It helps your saved feedback stay relevant.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTEXT_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setContext(context === p ? "" : p)}
                aria-pressed={context === p}
                className={cn(
                  "nb nb-press px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                  context === p
                    ? "bg-sun text-ink"
                    : "bg-card text-muted-foreground hover:text-ink",
                )}
              >
                {p}
                {context === p && <span aria-hidden className="ml-1.5">×</span>}
              </button>
            ))}
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. my manager messaged “we need to talk” and I'm rehearsing my reply"
            rows={3}
            className="nb mt-4 w-full bg-card p-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Optional.
          </p>
        </NBPanel>

        {/* Results */}
        {state === "done" && analysis && (
          <div ref={resultsRef}>
            <NBPanel className="p-6">
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {(() => {
                  const scores: Record<FactorKey, number> = {
                    calm: analysis.calmScore,
                    energy: analysis.energyScore,
                    clarity: analysis.clarityScore,
                    stability: analysis.stabilityScore,
                  };
                  const strongest = (Object.keys(scores) as FactorKey[]).reduce((best, key) =>
                    scores[key] > scores[best] ? key : best,
                  );
                  const next = biggestLever(analysis);
                  return (
                    <>
                      <div className="nb bg-mint p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          What went well · {TONE_FACTORS[strongest].label} {scores[strongest]}/100
                        </p>
                        <p className="mt-1 text-sm">{buildFactorFeedback(analysis)[strongest].read}</p>
                      </div>
                      <div className="nb bg-sun p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          Improve next · {TONE_FACTORS[next.factor].label}
                        </p>
                        <p className="mt-1 text-sm">{next.tip}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {audioUrl && (
                <div className="nb mb-5 bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Your take
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Playback
                    </span>
                  </div>
                  <audio controls src={audioUrl} className="mt-3 w-full" />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <NBBadge
                    className={
                      TONE_LABELS[analysis.dominantTone]?.color ?? "bg-secondary"
                    }
                  >
                    {TONE_LABELS[analysis.dominantTone]?.label ??
                      analysis.dominantTone}
                  </NBBadge>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {TONE_LABELS[analysis.dominantTone]?.note}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Overall
                  </div>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
                    className="font-display text-5xl"
                  >
                    {analysis.overallScore}
                  </motion.div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="nb bg-secondary p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    What this tone means
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {TONE_LABELS[analysis.dominantTone]?.note}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">
                    This take reads as <span className="font-bold">{TONE_LABELS[analysis.dominantTone]?.label ?? analysis.dominantTone}</span>. For the next take, focus on your lowest factor below.
                  </p>
                </div>
                <div className="nb bg-secondary p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Concrete next action
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{biggestLever(analysis).tip}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Play className="size-3.5" />
                    Listen back once before your next take
                  </div>
                </div>
              </div>

              <section className="mt-6" aria-labelledby="take-score-breakdown">
                <h2 id="take-score-breakdown" className="font-display text-xl">
                  This exercise, in detail
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {buildScoreBreakdown(analysis, transcript).map((dimension) => (
                    <div key={dimension.label} className="nb bg-card p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest">{dimension.label}</h3>
                        <span className="font-display text-lg">
                          {dimension.score === null ? "Not scored" : `${dimension.score}/100`}
                        </span>
                      </div>
                      {dimension.score !== null && <NBMeter value={dimension.score} className="mt-2 h-2" />}
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dimension.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              {priorBestScore.current !== null && (
                <div className="nb mt-4 bg-secondary p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Compared with your previous best {drill.name} take
                  </p>
                  <p className="mt-1 text-sm">
                    {analysis.overallScore - priorBestScore.current > 0 ? "+" : ""}
                    {analysis.overallScore - priorBestScore.current} points overall
                    <span className="text-muted-foreground"> (previously {priorBestScore.current})</span>
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["calm", analysis.calmScore],
                    ["energy", analysis.energyScore],
                    ["clarity", analysis.clarityScore],
                    ["stability", analysis.stabilityScore],
                  ] as const
                ).map(([key, score]) => {
                  const factor = TONE_FACTORS[key];
                  const open = expandedFactor === key;
                  return (
                    <div key={key} className="nb bg-card p-3">
                      <button
                        type="button"
                        onClick={() => setExpandedFactor(open ? null : key)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {factor.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-display text-xl">{score}</span>
                          <span
                            aria-hidden
                            className={cn(
                              "text-[10px] font-bold transition-transform",
                              open && "rotate-180",
                            )}
                          >
                            ▼
                          </span>
                        </span>
                      </button>
                      <NBMeter value={score} className="mt-2" />
                      {open && (
                        <div className="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
                          {(() => {
                            const fb: FactorFeedback =
                              buildFactorFeedback(analysis)[key];
                            const STATUS_STYLES: Record<
                              FactorFeedback["status"],
                              string
                            > = {
                              strong: "bg-mint",
                              decent: "bg-sun",
                              wobbly: "bg-paper",
                              rough: "bg-coral",
                            };
                            return (
                              <>
                                <p>
                                  <span
                                    className={cn(
                                      "nb mr-2 inline-block bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                      STATUS_STYLES[fb.status],
                                    )}
                                  >
                                    {fb.status}
                                  </span>
                                  <span>{fb.read}</span>
                                </p>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  Your numbers: {fb.yourNumbers}
                                </p>
                                <p>
                                  <span className="font-bold">Try this: </span>
                                  <span className="text-muted-foreground">{fb.tip}</span>
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="nb bg-secondary p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Pitch
                  </div>
                  <div className="font-display text-lg">{analysis.avgPitchHz} Hz</div>
                </div>
                <div className="nb bg-secondary p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Range
                  </div>
                  <div className="font-display text-lg">{analysis.pitchRangeHz} Hz</div>
                </div>
                <div className="nb bg-secondary p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Pace
                  </div>
                  <div className="font-display text-lg">{analysis.wordsPerMinute} wpm</div>
                </div>
                <div className="nb bg-secondary p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Voiced
                  </div>
                  <div className="font-display text-lg">
                    {Math.round(analysis.voicedRatio * 100)}%
                  </div>
                </div>
              </div>

              <SaveRow
                analysis={analysis}
                drillId={drill.id}
                elapsedMs={elapsedMs}
                transcript={transcript}
                context={context.trim() || undefined}
                feedback={feedbackSummary(analysis)}
                saved={saved}
                onSaved={() => setSaved(true)}
                onRetry={reset}
                drillStats={bestByDrill.get(drill.id)}
              />
            </NBPanel>
          </div>
        )}

        {/* Tips */}
        <NBPanel className="bg-secondary p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Before you start
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {drill.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="nb flex size-5 shrink-0 items-center justify-center bg-sun text-[10px] font-bold">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </NBPanel>
      </div>
    </AppShell>
  );
}

function SaveRow({
  analysis,
  drillId,
  elapsedMs,
  transcript,
  context,
  feedback,
  saved,
  onSaved,
  onRetry,
  drillStats,
}: {
  analysis: ToneAnalysis;
  drillId: string;
  elapsedMs: number;
  transcript: string;
  context?: string;
  feedback: string;
  saved: boolean;
  onSaved: () => void;
  onRetry: () => void;
  drillStats?: { bestScore: number; attemptCount: number };
}) {
  const saveSession = useMutation(api.sessions.saveSession);
  const markTake = useMutation(api.dailyLog.mark);
  const addBonus = useMutation(api.dailyLog.addBonus);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<Id<"practiceSessions"> | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Credit the daily checklist + a personal-best bonus when earned.
      try {
        await markTake({ action: "take" });
      } catch { /* checklist credit is best-effort */ }
      if (analysis.overallScore >= (drillStats?.bestScore ?? 0)) {
        addBonus({ amount: 25 }).catch(() => {});
      }
      const sessionId = await saveSession({
        drill: drillId,
        durationMs: Math.round(elapsedMs),
        calmScore: analysis.calmScore,
        energyScore: analysis.energyScore,
        clarityScore: analysis.clarityScore,
        stabilityScore: analysis.stabilityScore,
        overallScore: analysis.overallScore,
        avgPitchHz: analysis.avgPitchHz,
        pitchRangeHz: analysis.pitchRangeHz,
        avgVolume: analysis.avgVolume,
        volumeVariability: analysis.volumeVariability,
        wordsPerMinute: analysis.wordsPerMinute,
        voicedRatio: analysis.voicedRatio,
        dominantTone: analysis.dominantTone,
        transcript: transcript || undefined,
        scenario: context,
        feedback,
      });
      trackEvent("practice_saved", {
        drill: drillId,
        score: analysis.overallScore,
      });
      setSavedId(sessionId);
      toast.success("Saved to your log.");
      onSaved();
    } catch {
      toast.error("We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!saved ? (
          <NBButton onClick={handleSave} disabled={saving} variant="mint">
            {saving ? "Saving…" : "Save to my log"}
          </NBButton>
        ) : (
          <span className="nb inline-flex items-center gap-1 bg-mint px-3 py-2 text-sm font-bold">
            <Check className="size-4" /> Saved
          </span>
        )}
        <NBButton onClick={onRetry} variant="paper">
          Not my best — again
        </NBButton>
      </div>
      {savedId && <CoachNote sessionId={savedId} />}
    </>
  );
}
