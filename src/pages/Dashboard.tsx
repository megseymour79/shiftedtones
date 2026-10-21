import { NBButton, NBPanel, NBStat } from "@/components/nb";
import { AppShell } from "@/components/AppShell";
import { DailyChecklist } from "@/components/DailyChecklist";
import { dailyLabel, getAccessibleDailyChallenge } from "@/lib/daily";
import { GROUNDING_EXERCISES } from "@/lib/grounding";
import { levelInfo } from "@/lib/gamify";
import {
  UNLOCKABLE_DRILLS,
  isUnlocked,
  type UnlockStats,
} from "@/lib/unlocks";
import { api } from "@/convex/_generated/api";
import {
  Languages,
  MessagesSquare,
  Mic,
  Shuffle,
  Sparkles,
  Wind,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";

/**
 * /dashboard — the day at a glance. Today's numbers, today's goals,
 * today's checklist. Training lives in /gym, the record in /progress,
 * the calm side in /calm — this page just orients.
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
              {dailyLabel()} · your practice
            </p>
            <h1 className="mt-1 font-display text-3xl text-balance sm:text-4xl">
              What would you like to practice today?
            </h1>
            <Link
              to="/plan"
              className="mt-2 inline-block text-xs font-bold uppercase tracking-widest text-coral hover:underline"
            >
              See your 21-day plan →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NBStat label="Practice takes" value={stats.totalSessions} />
            <NBStat label="Days in a row" value={stats.streakDays} className="bg-mint" />
            <NBStat label="Drills tried" value={stats.drillsTried} className="bg-sun" />
            <NBStat
              label="Best score"
              value={stats.bestOverall}
              suffix={stats.bestOverall ? "/100" : undefined}
            />
          </div>
        </section>

        {/* Quick reps — every tool one tap away */}
        <section aria-label="Quick practice">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { to: "/gym", icon: Mic, label: "Try a drill", sub: "About 45 sec", color: "bg-coral" },
              { to: "/translate", icon: Languages, label: "Try another tone", sub: "Two short takes", color: "bg-sun" },
              { to: "/quiz", icon: MessagesSquare, label: "Read the Room", sub: "One scenario", color: "bg-mint" },
              { to: "/reframe", icon: Shuffle, label: "Try another response", sub: "About 2 min", color: "bg-paper" },
              { to: "/calm", icon: Wind, label: "Take a breather", sub: `${GROUNDING_EXERCISES.length} exercises`, color: "bg-paper" },
            ].map((rep) => {
              const Icon = rep.icon;
              return (
                <Link
                  key={rep.label}
                  to={rep.to}
                  className="group nb nb-press flex items-center gap-3 bg-card p-3"
                >
                  <span className={`nb flex size-9 shrink-0 items-center justify-center ${rep.color}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold leading-tight">{rep.label}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {rep.sub}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Today's two moves: challenge + checklist, side by side */}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="nb relative overflow-hidden bg-sun nb-shadow">
            <div className="flex h-full flex-col justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                  <Sparkles className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Today's challenge
                  </p>
                  <h2 className="font-display text-lg leading-tight sm:text-xl">
                    {daily.drill.name} — {daily.angle.toLowerCase()}
                  </h2>
                </div>
              </div>
              <p className="text-sm text-ink/70">
                About {daily.drill.seconds} seconds with your mic on. You can
                find this drill and your other practice options in the gym.
              </p>
              <div>
                <Link to={`/practice/${daily.drill.id}`}>
                  <NBButton variant="ink" className="text-xs">
                    <Mic className="size-3.5" /> Try today's drill
                  </NBButton>
                </Link>
              </div>
            </div>
          </div>
          <DailyChecklist todayDrillId={daily.drill.id} />
        </section>

      </div>
    </AppShell>
  );
}
