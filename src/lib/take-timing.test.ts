import { describe, expect, test } from "bun:test";
import {
  PACE_BAR_CLASS,
  PACE_HINTS,
  capElapsedMs,
  pacePct,
  paceStatus,
} from "./take-timing";

describe("capElapsedMs", () => {
  test("caps elapsed time at the exercise target", () => {
    expect(capElapsedMs(36_250, 35_000)).toBe(35_000);
    expect(capElapsedMs(12_500, 35_000)).toBe(12_500);
    expect(capElapsedMs(47_000, 35_000)).toBe(35_000);
    expect(capElapsedMs(34_000, 35_000)).toBe(34_000);
  });

  test("leaves uncapped clocks unchanged and never returns negative time", () => {
    expect(capElapsedMs(47_000)).toBe(47_000);
    expect(capElapsedMs(36_250)).toBe(36_250);
    expect(capElapsedMs(-1, 35_000)).toBe(0);
  });
});

describe("paceStatus", () => {
  const target = 45_000;

  test("warming-up before a third of the target", () => {
    expect(paceStatus(0, target)).toBe("warming-up");
    expect(paceStatus(target / 3 - 1, target)).toBe("warming-up");
  });

  test("on-pace inside the target window", () => {
    expect(paceStatus(target / 3, target)).toBe("on-pace");
    expect(paceStatus(target - 1, target)).toBe("on-pace");
  });

  test("good-length right after the target", () => {
    expect(paceStatus(target, target)).toBe("good-length");
    expect(paceStatus(target * 1.49, target)).toBe("good-length");
  });

  test("overtime well past the target", () => {
    expect(paceStatus(target * 1.5, target)).toBe("overtime");
    expect(paceStatus(target * 4, target)).toBe("overtime");
  });

  test("zero/negative target is safe (stays on-pace)", () => {
    expect(paceStatus(10_000, 0)).toBe("on-pace");
    expect(paceStatus(10_000, -1)).toBe("on-pace");
  });
});

describe("pacePct", () => {
  test("fills linearly and caps at 100", () => {
    expect(pacePct(0, 45_000)).toBe(0);
    expect(pacePct(22_500, 45_000)).toBe(50);
    expect(pacePct(45_000, 45_000)).toBe(100);
    expect(pacePct(90_000, 45_000)).toBe(100);
  });

  test("zero target stays at 0", () => {
    expect(pacePct(10_000, 0)).toBe(0);
  });
});

describe("pace copy covers every status", () => {
  const statuses = ["warming-up", "on-pace", "good-length", "overtime"] as const;
  test("hint + bar class exist for each", () => {
    for (const s of statuses) {
      expect(PACE_HINTS[s].length).toBeGreaterThan(5);
      expect(PACE_BAR_CLASS[s]).toMatch(/^bg-/);
    }
  });
});
