import { NBButton, NBPanel } from "@/components/nb";
import { applyFix, isStale, readDraft, type Signal, type Snapshot } from "@/lib/tone-read";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const EXAMPLE = "You need to stop wasting everyone's time!! This is obviously not what I asked for, ASAP.";

const KIND_STYLE: Record<string, string> = {
  heat: "bg-coral/30",
  demand: "bg-sun/40",
  volume: "bg-coral/20",
  absolute: "bg-sun/30",
  hedge: "bg-muted",
  warmth: "bg-mint/50",
  play: "bg-mint/30",
};

function Annotated({ text, signals, dim }: { text: string; signals: Signal[]; dim: boolean }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const s of signals) {
    if (s.start < at) continue;
    if (s.start > at) parts.push(text.slice(at, s.start));
    parts.push(
      <mark key={s.start} title={s.note} className={cn("rounded-sm px-0.5 underline decoration-2 underline-offset-2", KIND_STYLE[s.kind])}>
        {text.slice(s.start, s.end)}
      </mark>,
    );
    at = s.end;
  }
  parts.push(text.slice(at));
  return (
    <p className={cn("whitespace-pre-wrap text-base leading-relaxed", dim && "opacity-50")} aria-label="Annotated draft">
      {parts}
    </p>
  );
}

/** Paste a draft, read it, and make one surgical edit. Nothing leaves the tab. */
export function ToneLab() {
  const [text, setText] = useState("");
  const [version, setVersion] = useState(0);
  const [snap, setSnap] = useState<Snapshot | null>(null);

  const stale = isStale(snap, text, version);
  const state = !text ? "idle" : snap && !stale ? "read" : "typing";
  const edit = (next: string) => {
    setText(next);
    setVersion((v) => v + 1);
  };
  const run = () => {
    if (!text.trim()) return;
    setSnap({ text, version, read: readDraft(text) });
  };
  const read = snap?.read;
  const fixable = useMemo(() => read?.shown.filter((s) => s.fix) ?? [], [read]);

  return (
    <div className="mt-8" data-state={state}>
      <textarea
        value={text}
        onChange={(e) => edit(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
        }}
        rows={3}
        placeholder="Paste your message…"
        aria-label="Your message"
        className="nb w-full bg-white p-3 text-base"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <NBButton variant="sun" onClick={run} disabled={!text.trim()}>
          Read it
        </NBButton>
        <NBButton onClick={() => edit(EXAMPLE)}>Use an example</NBButton>
        <span className="text-xs text-muted-foreground">⌘↵ · Nothing you typed leaves this tab.</span>
      </div>

      {snap && read && (
        <div className="mt-6 grid gap-4 md:grid-cols-12">
          <NBPanel className="p-4 md:col-span-7">
            <Annotated text={snap.text} signals={read.signals} dim={stale} />
          </NBPanel>
          <NBPanel className="p-4 md:col-span-5" aria-live="polite">
            {stale && (
              <p className="mb-2 text-sm font-bold text-coral">
                This read is for the previous draft — read it again.
              </p>
            )}
            <div className={cn(stale && "opacity-50")}>
              <p className="font-display text-lg">{read.reading}</p>
              {read.because.length > 0 && (
                <p className="mt-2 text-sm">
                  <b>Because:</b> {read.because.join(" · ")}
                </p>
              )}
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {read.shown.map((s) => (
                  <li key={s.start}>
                    “{s.text.trim()}” — {s.note}
                  </li>
                ))}
              </ul>
              {read.hiddenCount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">+{read.hiddenCount} more</p>
              )}
              <p className="mt-2 text-sm">
                <b>Would land better if:</b> {read.wouldLandBetter}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Warmth ↔ Heat: {read.warmthHeat} · Directness: {read.directness} · Evidence: {read.evidence.replace("-", " ")}
              </p>
              {!stale &&
                fixable.map((s) => (
                  <NBButton key={s.start} className="mr-2 mt-3" onClick={() => edit(applyFix(snap.text, s) ?? snap.text)}>
                    Fix “{s.text.trim()}” → “{s.fix?.replacement || "(cut)"}”
                  </NBButton>
                ))}
            </div>
          </NBPanel>
        </div>
      )}
    </div>
  );
}
