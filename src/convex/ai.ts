"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { vly } from "../lib/vly-integrations";

const SYSTEM_PROMPT = `You are a communication coach inside ShiftedTone.
The user was triggered by a situation and reacted with their automatic response.
Produce a REFRAME: how they could respond instead, in alignment with their goal.
Reply with STRICT JSON only (no markdown fences), shaped exactly:
{
  "reframe": "the suggested response, written in first person as the user would say it, 1-3 sentences",
  "toneNote": "one short sentence on HOW to deliver it (pace, warmth, firmness, breathing)"
}
Keep the reframe grounded, kind, and assertive. Use clear, conversational language without slang, jargon, or dramatic phrasing. Never shame the user's automatic reaction.`;

/** AI reframe coach: turns trigger + automatic reaction into a grounded alternative response. */
export const reframe = action({
  args: {
    trigger: v.string(),
    reaction: v.string(),
    goal: v.optional(v.string()),
  },
  handler: async (ctx, { trigger, reaction, goal }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const result = await vly.ai.completion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Situation: ${trigger}\nAutomatic reaction: ${reaction}\nGoal: ${goal ?? "respond calmly and clearly"}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 300,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error ?? "We couldn't create a response just now. Please try again.");
    }

    const content = result.data.choices?.[0]?.message?.content ?? "";
    // Extract the first JSON object from the response
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("We couldn't create a response just now. Please try again.");
    }
    const parsed = JSON.parse(match[0]) as {
      reframe?: string;
      toneNote?: string;
    };
    if (!parsed.reframe) {
      throw new Error("We couldn't create a response just now. Please try again.");
    }

    return {
      reframe: parsed.reframe,
      toneNote: parsed.toneNote ?? "Try slowing down and speaking as you breathe out.",
    };
  },
});
