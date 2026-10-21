import { describe, expect, test } from "bun:test";
import { applyFix, detectSignals, isStale, readDraft, repetitionWeight } from "./tone-read";

describe("tone-read", () => {
  test("quotes the exact matched span", () => {
    const s = detectSignals("Please stay relaxed about it, thanks");
    expect(s.every((x) => "Please stay relaxed about it, thanks".slice(x.start, x.end) === x.text)).toBe(true);
  });

  test("word boundaries: no substring matches", () => {
    expect(detectSignals("neverland and alwaysome")).toEqual([]);
  });

  test("repetition weight is sub-linear", () => {
    expect(repetitionWeight(0.5, 2)).toBeLessThan(2 * repetitionWeight(0.5, 1));
    expect(repetitionWeight(0.5, 10)).toBeLessThanOrEqual(1);
  });

  test("nonsense lands in not-enough", () => {
    expect(readDraft("asdf qwer zxcv uiop lkjh").evidence).toBe("not-enough");
    expect(readDraft("hi").evidence).toBe("not-enough");
  });

  test("rude draft cites evidence and caps at four", () => {
    const r = readDraft("You need to stop wasting everyone's time!! This is stupid, obviously. You always do this, ASAP.");
    expect(r.reading).toMatch(/Rude/);
    expect(r.shown.length).toBeLessThanOrEqual(4);
    expect(r.because[0]).toContain("wasting everyone's time");
    expect(r.hiddenCount).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < r.shown.length; i++) expect(r.shown[i - 1].weight).toBeGreaterThanOrEqual(r.shown[i].weight);
  });

  test("warm and heated together is mixed", () => {
    expect(readDraft("Thanks so much, I appreciate it. This is stupid and you never listen!!").evidence).toBe("mixed");
  });

  test("applyFix edits only the span", () => {
    const t = "Send it right now please";
    const s = detectSignals(t).find((x) => x.text === "right now")!;
    expect(applyFix(t, s)).toBe("Send it by end of day please");
  });

  test("snapshot goes stale after any edit", () => {
    const snap = { text: "a b c d", version: 1, read: readDraft("a b c d") };
    expect(isStale(snap, "a b c d", 1)).toBe(false);
    expect(isStale(snap, "a b c d e", 2)).toBe(true);
  });
});
