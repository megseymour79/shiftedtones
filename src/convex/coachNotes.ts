import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { coachEntitlement, FREE_COACH_NOTES } from "../lib/entitlements";

/**
 * Coach note persistence + entitlement checks. Kept free of "use node" so the
 * LLM action in coach.ts can run these via ctx.runQuery / ctx.runMutation.
 */

/** Auth + ownership + entitlement in one shot for the coach action. */
export const checkAccess = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const usedNotes = await ctx.db
      .query("coachNotes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const entitlement = coachEntitlement({
      coachUnlocked: user.coachUnlocked === true,
      freeNotesUsed: usedNotes.length,
    });
    return { entitlement, hasAnyNotes: usedNotes.length > 0 };
  },
});

/** The coach note attached to a saved take, if one exists. */
export const forSession = query({
  args: { sessionId: v.id("practiceSessions") },
  handler: async (ctx, { sessionId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const note = await ctx.db
      .query("coachNotes")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (!note || note.userId !== user._id) return null;
    return { feedback: note.feedback, oneThing: note.oneThing, source: note.source };
  },
});

/**
 * One-note-per-take guard, invoked by the action before the LLM call.
 * Throws (readable message) when the take already has its note.
 */
export const reserveForSession = internalMutation({
  args: { sessionId: v.id("practiceSessions") },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("coachNotes")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) {
      throw new Error("That take already has its coach note.");
    }
  },
});

/**
 * Persist the generated note and consume one free credit when applicable.
 * Called by the action after a successful generation.
 */
export const store = internalMutation({
  args: {
    sessionId: v.id("practiceSessions"),
    feedback: v.string(),
    oneThing: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Re-check ownership + idempotency at write time.
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Take not found");
    }
    const existing = await ctx.db
      .query("coachNotes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing) return existing._id;

    const noteId = await ctx.db.insert("coachNotes", { userId: user._id, ...args });

    if (user.coachUnlocked !== true) {
      const usedNotes = await ctx.db
        .query("coachNotes")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      if (usedNotes.length > FREE_COACH_NOTES) {
        throw new Error(
          "Your free coach notes are used up. Unlock the coach to keep going.",
        );
      }
    }
    return noteId;
  },
});
