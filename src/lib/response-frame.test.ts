import { describe, expect, test } from "bun:test";
import {
  FRAME_STEPS,
  MESSAGE_KINDS,
  KIND_GOAL_HINTS,
} from "./response-frame";

describe("FRAME_STEPS", () => {
  test("covers the four planning questions in teachable order", () => {
    expect(FRAME_STEPS.map((s) => s.id)).toEqual([
      "their-move",
      "underneath",
      "aftertaste",
      "ask",
    ]);
    expect(FRAME_STEPS[0].question).toMatch(/want me to feel or do/i);
    expect(FRAME_STEPS[1].question).toMatch(/underneath what they said/i);
    expect(FRAME_STEPS[2].question).toMatch(/feel after/i);
    expect(FRAME_STEPS[3].question).toMatch(/kind of message/i);
  });

  test("every step is complete: substantive why, how, and a real gut-check", () => {
    for (const s of FRAME_STEPS) {
      expect(s.question.trim().endsWith("?")).toBe(true);
      expect(s.why.length).toBeGreaterThan(60);
      expect(s.how.length).toBeGreaterThan(60);
      expect(s.check.length).toBeGreaterThan(40);
      expect(s.color).toMatch(/^bg-[a-z]+$/);
    }
  });

  test("ids are unique", () => {
    expect(new Set(FRAME_STEPS.map((s) => s.id)).size).toBe(FRAME_STEPS.length);
  });
});

describe("MESSAGE_KINDS", () => {
  test("includes the core archetypes users actually need", () => {
    const ids = MESSAGE_KINDS.map((k) => k.id);
    for (const expected of [
      "agree",
      "acknowledge",
      "boundary",
      "repair",
      "inform",
      "de-escalate",
    ]) {
      expect(ids).toContain(expected);
    }
  });

  test("every kind has substantive cue, shape, and an ending line", () => {
    for (const k of MESSAGE_KINDS) {
      expect(k.label.trim().length).toBeGreaterThan(3);
      expect(k.cue.length).toBeGreaterThan(30);
      expect(k.shape.length).toBeGreaterThan(30);
      expect(k.ending.length).toBeGreaterThan(10);
      expect(k.color).toMatch(/^bg-[a-z]+$/);
    }
  });

  test("each ending is a speakable line (quoted or quotable)", () => {
    for (const k of MESSAGE_KINDS) {
      expect(k.ending).toMatch(/"/);
    }
  });

  test("ids are unique and every kind has a goal hint", () => {
    expect(new Set(MESSAGE_KINDS.map((k) => k.id)).size).toBe(MESSAGE_KINDS.length);
    for (const k of MESSAGE_KINDS) {
      expect(KIND_GOAL_HINTS[k.id]?.length ?? 0).toBeGreaterThan(5);
    }
  });
});
