import { describe, expect, test } from "bun:test";
import { nextOtpSendRateLimit } from "./emailOtp";

const HOUR_MS = 60 * 60 * 1000;
const now = 1_800_000_000_000;

describe("nextOtpSendRateLimit", () => {
  test("allows three sends and then throttles further requests", () => {
    let state = nextOtpSendRateLimit(null, now);
    expect(state?.otpAttemptsLeft).toBe(2);

    state = nextOtpSendRateLimit(state, now);
    expect(state?.otpAttemptsLeft).toBe(1);

    state = nextOtpSendRateLimit(state, now);
    expect(state?.otpAttemptsLeft).toBe(0);
    expect(nextOtpSendRateLimit(state, now)).toBeNull();
  });

  test("replenishes gradually and caps at the hourly maximum", () => {
    const exhausted = { otpAttemptsLeft: 0, otpLastAttemptTime: now };
    expect(
      nextOtpSendRateLimit(exhausted, now + HOUR_MS / 3)?.otpAttemptsLeft,
    ).toBe(0);
    expect(
      nextOtpSendRateLimit(exhausted, now + HOUR_MS)?.otpAttemptsLeft,
    ).toBe(2);
  });

  test("does not grant extra sends if the clock moves backward", () => {
    const exhausted = { otpAttemptsLeft: 0, otpLastAttemptTime: now };
    expect(nextOtpSendRateLimit(exhausted, now - 1)).toBeNull();
  });
});
