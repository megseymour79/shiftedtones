import { NBButton, NBPanel, NBStat } from "@/components/nb";
import { AppShell } from "@/components/AppShell";
import { DailyChecklist } from "@/components/DailyChecklist";
import { dailyLabel, getAccessibleDailyChallenge } from "@/lib/daily";
import { arcDaysLeft, arcStageFor } from "@/lib/arc";
import { levelInfo } from "@/lib/gamify";
import {
  UNLOCKABLE_DRILLS,
  isUnlocked,
  type UnlockStats,
} from "@/lib/unlocks";
import { api } from "@/convex/_generated/api";
import {
  Mic,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";

/**
 * /dashboard — the day at a glance. Today's numbers, today's goals,
 * today's checklist. Practice and history each have their own page, so
 * this view can stay focused on what might be useful today.
 */
export default function Dashboard() {
  const progression = useQuery(api.dailyLog.progression);

  // Stats drive every panel here; render only once they've loaded so a
  // returning user never sees a zeros-frame.
  if (progression === undefined) {
    return (
      <AppShell active="dashboard">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <NBPanel className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
          </NBPanel>
        </div>
      </AppShell>
    );
  }

  const level = levelInfo(progression.totalXp);

  const stats = {
    totalSessions: progression?.totalSessions ?? 0,
    streakDays: progression?.streakDays ?? 0,
    bestOverall: progression?.bestOverall ?? 0,
    drillsTried: progression?.drillsTried ?? 0,
  };

  const unlockStats: UnlockStats = {
    takes: stats.totalSessions,
    level: level.level,
    drillsTried: stats.drillsTried,
    bestScore: stats.bestOverall,
    streak: stats.streakDays,
  };
  // The daily CTA must always be runnable: when the calendar pick sits
  // behind a lock, swap it for a starter so the checklist's deep link
  // never dead-ends on the lock screen.
  const daily = getAccessibleDailyChallenge((drillId) => {
    const gate = UNLOCKABLE_DRILLS.find((u) => u.id === drillId);
    return !gate || isUnlocked(gate, unlockStats);
  });

  return (
    <AppShell active="dashboard">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Greeting + headline stats */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {dailyLabel()}
            </p>
            <h1 className="mt-1 font-display text-3xl text-balance sm:text-4xl">
              What feels useful today?
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NBStat label="Practice takes" value={stats.totalSessions} />
            <NBStat label="Days in a row" value={stats.streakDays} suffix="d" className="bg-mint" />
            <NBStat label="Scenarios tried" value={stats.drillsTried} className="bg-sun" />
            <NBStat
              label="Best score"
              value={stats.bestOverall}
              suffix={stats.bestOverall ? "/100" : undefined}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="nb relative overflow-hidden bg-sun nb-shadow">
            <div className="flex h-full flex-col justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                  <Sparkles className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    One idea for today
                  </p>
                  <h2 className="font-display text-lg leading-tight sm:text-xl">
                    {daily.drill.name} — {daily.angle.toLowerCase()}
                  </h2>
                </div>
              </div>
              <p className="text-sm text-ink/70">
                About {daily.drill.seconds} seconds to practice aloud. You can
                browse other scenarios whenever you like.
              </p>
              <div>
                <Link to={`/practice/${daily.drill.id}`}>
                  <NBButton variant="ink" className="text-xs">
                    <Mic className="size-3.5" /> Try this one
                  </NBButton>
                </Link>
              </div>
            </div>
          </div>
          <DailyChecklist todayDrillId={daily.drill.id} />
        </section>

        {/* 21-day arc — where you are in the reprogramming program */}
        <ArcPanel streakDays={stats.streakDays} />
      </div>
    </AppShell>
  );
}

/**
 * The 21-day reprogramming arc: your streak maps onto a three-week
 * program (floor → range → translation), so coming back isn't just a
 * checklist — it's a curriculum with a finish line.
 */
function ArcPanel({ streakDays }: { streakDays: number }) {
  const day = Math.max(1, streakDays);
  const stage = arcStageFor(day);
  const left = arcDaysLeft(day);
  const dayPct = Math.min(100, Math.round((day / 21) * 100));

  return (
    <NBPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-ink bg-mint px-5 py-3">
        <div className="font-display">Your 21-day practice plan</div>
        <span className="nb inline-flex items-center bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-paper">
          {left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "Plan complete — keep practicing"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-5">
          <div className="nb flex size-14 shrink-0 flex-col items-center justify-center bg-card">
            <span className="font-display text-xl leading-none">{day}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">day</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg">{stage.name}</span>
              <span className="text-xs text-muted-foreground">· {stage.promise}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-bold text-ink">Today's practice:</span> {stage.move}
            </p>
          </div>
        </div>

        {/* Stage track: three blocks across 21 days */}
        <div className="mt-4 flex gap-1" aria-hidden>
          {Array.from({ length: 21 }).map((_, i) => {
            const d = i + 1;
            const s = arcStageFor(d);
            const isStage = s.id === stage.id;
            const isDone = d <= day;
            return (
              <span
                key={i}
                title={`Day ${d} — ${s.name}`}
                className={`h-3 flex-1 border border-ink ${
                  isDone ? (isStage ? "bg-ink" : "bg-muted") : "bg-card"
                }`}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{stage.why}</p>
        <div className="mt-3 h-1.5 bg-muted">
          <div className="h-full bg-ink" style={{ width: `${dayPct}%` }} />
        </div>
      </div>
    </NBPanel>
  );
}
