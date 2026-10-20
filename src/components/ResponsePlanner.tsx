import { FRAME_STEPS, MESSAGE_KINDS, KIND_GOAL_HINTS } from "@/lib/response-frame";
import { ChevronDown, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The Response Planner — an expandable, self-paced think-through that
 * turns a reaction into a response. Rendered between the two passes of
 * the Translation Drill and above the Reframe Lab's response field.
 *
 * `onGoalPick` lets a host page receive the chosen message kind as a
 * ready-made goal line (Reframe prefills its goal field with it).
 */
export function ResponsePlanner({
  title = "Think it through first",
  intro = "Take a moment to consider what you want to say and how you want it to come across.",
  accent = "bg-paper",
  onGoalPick,
}: {
  title?: string;
  intro?: string;
  accent?: string;
  onGoalPick?: (goal: string) => void;
}) {
  const [openStep, setOpenStep] = useState<string | null>(FRAME_STEPS[0].id);
  const [openKind, setOpenKind] = useState<string | null>(null);

  return (
    <section className={cn("nb nb-shadow overflow-hidden", accent)}>
      <div className="border-b-2 border-ink px-5 py-3">
        <div className="flex items-center gap-2 font-display text-xl">
          <MessagesSquare className="size-5" /> {title}
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>
      </div>

      {/* The four questions */}
      <div className="flex flex-col gap-2 p-5">
        {FRAME_STEPS.map((step, i) => {
          const open = openStep === step.id;
          return (
            <div key={step.id} className="nb bg-card">
              <button
                type="button"
                onClick={() => setOpenStep(open ? null : step.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    "nb flex size-7 shrink-0 items-center justify-center font-display text-sm",
                    step.color,
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold leading-snug">
                  {step.question}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open && (
                <div className="flex flex-col gap-3 border-t-2 border-dashed border-ink/20 px-4 py-3 text-sm">
                  <p className="leading-relaxed text-muted-foreground">{step.why}</p>
                  <p className="leading-relaxed">
                    <span className="font-bold">Try this: </span>
                    {step.how}
                  </p>
                  <p className="nb bg-secondary p-3 text-xs leading-relaxed">
                    <span className="font-bold uppercase tracking-widest">Check in: </span>
                    {step.check}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message kinds — step four made concrete */}
      <div className="border-t-2 border-ink bg-secondary/60 px-5 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          What kind of message is this? Choose one:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MESSAGE_KINDS.map((kind) => {
            const open = openKind === kind.id;
            return (
              <button
                key={kind.id}
                type="button"
                onClick={() => setOpenKind(open ? null : kind.id)}
                aria-expanded={open}
                className={cn(
                  "nb nb-press px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                  open ? kind.color : "bg-card text-muted-foreground hover:text-ink",
                )}
              >
                {kind.label}
              </button>
            );
          })}
        </div>

        {openKind && (
          <div className="mt-4 flex flex-col gap-3 border-2 border-ink bg-card p-4 text-sm">
            {MESSAGE_KINDS.filter((k) => k.id === openKind).map((kind) => (
              <div key={kind.id} className="flex flex-col gap-3">
                <p className="leading-relaxed text-muted-foreground">
                  <span className="font-bold text-ink">This may fit if: </span>
                  {kind.cue}
                </p>
                <p className="leading-relaxed">
                  <span className="font-bold">You could: </span>
                  {kind.shape}
                </p>
                <p className="nb bg-mint/40 p-3 font-medium leading-snug">{kind.ending}</p>
                {onGoalPick && (
                  <button
                    type="button"
                    onClick={() => onGoalPick(KIND_GOAL_HINTS[kind.id] ?? kind.label.toLowerCase())}
                    className="self-start text-[10px] font-bold uppercase tracking-widest text-coral hover:underline"
                  >
                    Use this as my goal →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
