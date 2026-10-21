import { AppShell } from "@/components/AppShell";
import { NBButton, NBPanel } from "@/components/nb";
import { api } from "@/convex/_generated/api";
import { arcDaysLeft, arcStageFor } from "@/lib/arc";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function Plan() {
  const progression = useQuery(api.dailyLog.progression);
  const streakDays = progression?.streakDays ?? 0;
  const day = Math.max(1, streakDays);
  const stage = arcStageFor(day);
  const daysLeft = arcDaysLeft(day);
  const progress = Math.min(100, Math.round((day / 21) * 100));

  return (
    <AppShell active="plan">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            A guide, not a deadline
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            Your 21-day practice plan
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Take it one day at a time. The plan moves with your practice, so
            there's no need to rush through it.
          </p>
        </section>

        <NBPanel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-mint px-5 py-3">
            <div className="font-display text-lg">{stage.name}</div>
            <span className="nb inline-flex items-center bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-paper">
              {daysLeft > 0
                ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`
                : "You've reached day 21"}
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-5">
              <div className="nb flex size-14 shrink-0 flex-col items-center justify-center bg-card">
                <span className="font-display text-xl leading-none">{day}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  day
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg">{stage.promise}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stage.move}
                </p>
              </div>
            </div>

            <div
              className="mt-5 flex gap-1"
              role="progressbar"
              aria-label="21-day practice plan progress"
              aria-valuemin={0}
              aria-valuemax={21}
              aria-valuenow={Math.min(day, 21)}
            >
              {Array.from({ length: 21 }).map((_, index) => {
                const barDay = index + 1;
                const barStage = arcStageFor(barDay);
                const isCurrentStage = barStage.id === stage.id;
                const isDone = barDay <= day;
                return (
                  <span
                    key={barDay}
                    aria-hidden
                    className={`h-3 flex-1 border border-ink ${
                      isDone
                        ? isCurrentStage
                          ? "bg-ink"
                          : "bg-muted"
                        : "bg-card"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-2 h-1.5 bg-muted">
              <div className="h-full bg-ink" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {stage.why}
            </p>
          </div>
        </NBPanel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Want to practice now? Pick a short drill and start wherever you are.
          </p>
          <Link to="/gym">
            <NBButton variant="coral">
              Browse drills <ArrowRight className="size-4" />
            </NBButton>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
