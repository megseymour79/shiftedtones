import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { getDrill } from "../lib/drills";

/** Save a completed microphone practice session and update best scores. */
export const saveSession = mutation({
  args: {
    drill: v.string(),
    scenario: v.optional(v.string()),
    feedback: v.optional(v.string()),
    durationMs: v.number(),
    calmScore: v.number(),
    energyScore: v.number(),
    clarityScore: v.number(),
    stabilityScore: v.number(),
    overallScore: v.number(),
    avgPitchHz: v.number(),
    pitchRangeHz: v.number(),
    avgVolume: v.number(),
    volumeVariability: v.number(),
    wordsPerMinute: v.number(),
    voicedRatio: v.number(),
    dominantTone: v.string(),
    transcript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const sessionId = await ctx.db.insert("practiceSessions", {
      userId: user._id,
      ...args,
    });

    // Upsert drill attempt stats
    const existing = await ctx.db
      .query("drillAttempts")
      .withIndex("by_user_drill", (q) =>
        q.eq("userId", user._id).eq("drill", args.drill),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bestScore: Math.max(existing.bestScore, args.overallScore),
        attemptCount: existing.attemptCount + 1,
      });
    } else {
      await ctx.db.insert("drillAttempts", {
        userId: user._id,
        drill: args.drill,
        bestScore: args.overallScore,
        attemptCount: 1,
      });
    }

    return sessionId;
  },
});

/** Recent practice sessions, newest first. */
export const listSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("practiceSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/** Best score + attempts per drill. */
export const drillStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("drillAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/** Aggregate practice summary for the dashboard. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        avgOverall: 0,
        bestOverall: 0,
        streakDays: 0,
      };
    }
    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        avgOverall: 0,
        bestOverall: 0,
        streakDays: 0,
      };
    }

    const totalSessions = sessions.length;
    const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const avgOverall = Math.round(
      sessions.reduce((acc, s) => acc + s.overallScore, 0) / totalSessions,
    );
    const bestOverall = Math.max(...sessions.map((s) => s.overallScore));

    // Distinct practice days sorted ascending → streak counting back from most recent day
    const days = Array.from(
      new Set(
        sessions.map((s) => {
          const d = new Date(s._creationTime);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }),
      ),
    ).sort((a, b) => {
      const [ay, am, ad] = a.split("-").map(Number);
      const [by, bm, bd] = b.split("-").map(Number);
      return new Date(ay, am, ad).getTime() - new Date(by, bm, bd).getTime();
    });

    let streakDays = 0;
    const dayMs = 86_400_000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Walk backwards from today (or yesterday if today not practiced yet)
    let cursor = today.getTime();
    const latestDay = days[days.length - 1];
    const [ly, lm, ld] = latestDay.split("-").map(Number);
    const latest = new Date(ly, lm, ld).getTime();
    if (latest < today.getTime() - dayMs) {
      // latest practice is older than yesterday → no active streak
      streakDays = 0;
    } else {
      if (latest < today.getTime()) cursor = today.getTime() - dayMs;
      for (let i = days.length - 1; i >= 0; i--) {
        const [y, m, d] = days[i].split("-").map(Number);
        const dayTime = new Date(y, m, d).getTime();
        if (dayTime === cursor) {
          streakDays++;
          cursor -= dayMs;
        } else {
          break;
        }
      }
    }

    return {
      totalSessions,
      totalMinutes: Math.round(totalMs / 60_000),
      avgOverall,
      bestOverall,
      streakDays,
    };
  },
});

/** Coach plumbing: one take (ownership-checked), enriched with drill copy. */
export const getSessionForCoach = internalQuery({
  args: { sessionId: v.id("practiceSessions") },
  handler: async (ctx, { sessionId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== user._id) return null;
    const drill = getDrill(session.drill);
    return {
      userId: session.userId,
      drill: session.drill,
      drillName: drill?.name ?? session.drill,
      focus: drill?.focus ?? "",
      durationMs: session.durationMs,
      dominantTone: session.dominantTone,
      overallScore: session.overallScore,
      calmScore: session.calmScore,
      energyScore: session.energyScore,
      clarityScore: session.clarityScore,
      stabilityScore: session.stabilityScore,
      avgPitchHz: session.avgPitchHz,
      pitchRangeHz: session.pitchRangeHz,
      wordsPerMinute: session.wordsPerMinute,
      voicedRatio: session.voicedRatio,
      volumeVariability: session.volumeVariability,
      transcript: session.transcript,
      scenario: session.scenario,
    };
  },
});

/** Best overall score on a drill, or undefined when never practiced. */
export const getDrillBest = internalQuery({
  args: { userId: v.id("users"), drill: v.string() },
  handler: async (ctx, { userId, drill }) => {
    const row = await ctx.db
      .query("drillAttempts")
      .withIndex("by_user_drill", (q) => q.eq("userId", userId).eq("drill", drill))
      .unique();
    return row?.bestScore;
  },
});
