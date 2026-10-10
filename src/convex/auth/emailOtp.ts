import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const EMAIL_OTP_API_URL = "https://auth.freebuff.app/send_otp";
const MAX_OTP_SENDS_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function nextOtpSendRateLimit(
  state: { otpAttemptsLeft?: number; otpLastAttemptTime?: number } | null,
  now: number,
) {
  const elapsedMs =
    state?.otpLastAttemptTime !== undefined
      ? Math.max(0, now - state.otpLastAttemptTime)
      : ONE_HOUR_MS;
  const attemptsLeft = Math.min(
    MAX_OTP_SENDS_PER_HOUR,
    Math.max(0, state?.otpAttemptsLeft ?? MAX_OTP_SENDS_PER_HOUR) +
      (elapsedMs * MAX_OTP_SENDS_PER_HOUR) / ONE_HOUR_MS,
  );

  if (attemptsLeft < 1) {
    return null;
  }

  return {
    otpAttemptsLeft: attemptsLeft - 1,
    otpLastAttemptTime: now,
  };
}

export const consumeOtpSendLimit = internalMutation({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const now = Date.now();
    const rateLimit = await ctx.db
      .query("authRateLimits")
      .withIndex("identifier", (q) => q.eq("identifier", identifier))
      .unique();
    const nextState = nextOtpSendRateLimit(rateLimit, now);

    if (nextState === null) {
      throw new Error(
        "Too many sign-in code requests. Please try again later.",
      );
    }

    if (rateLimit === null) {
      await ctx.db.insert("authRateLimits", {
        identifier,
        attemptsLeft: 5,
        lastAttemptTime: now,
        ...nextState,
      });
    } else {
      await ctx.db.patch(rateLimit._id, nextState);
    }
  },
});

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }, ctx?: ActionCtx) {
    const integrationKey = process.env.VLY_EMAIL_API_KEY;
    if (!integrationKey) {
      throw new Error(
        "We couldn't send your sign-in code. Please try again later.",
      );
    }
    if (!ctx) {
      throw new Error(
        "We couldn't send your sign-in code. Please try again later.",
      );
    }

    await ctx.runMutation(internal.auth.emailOtp.consumeOtpSendLimit, {
      identifier: email,
    });

    try {
      await axios.post(
        EMAIL_OTP_API_URL,
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": integrationKey,
          },
        },
      );
    } catch {
      throw new Error(
        "We couldn't send your sign-in code. Please try again later.",
      );
    }
  },
});
