import { describe, expect, it } from "vitest";

import {
  ACTIVITY_FACTORS,
  activityLevelDisagrees,
  estimateTdee,
  suggestActivityLevel,
} from "./tdee";
import type { ActivityLevel } from "./types";

describe("estimateTdee", () => {
  it("multiplies BMR by the level's factor", () => {
    expect(estimateTdee(1780, "moderate")).toBe(1780 * 1.55);
  });

  it("uses the standard factors", () => {
    expect(ACTIVITY_FACTORS).toEqual({
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extra: 1.9,
    });
  });

  it("rises with every step up the scale", () => {
    const order: ActivityLevel[] = ["sedentary", "light", "moderate", "very", "extra"];
    const values = order.map((level) => estimateTdee(1500, level));

    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(new Set(values).size).toBe(order.length);
  });
});

describe("suggestActivityLevel", () => {
  it.each([
    [0, "sedentary"],
    [1, "light"],
    [3, "light"],
    [4, "moderate"],
    [5, "moderate"],
    [6, "very"],
    [7, "very"],
  ] as const)("maps %i training days to %s", (days, expected) => {
    expect(suggestActivityLevel(days)).toBe(expected);
  });

  it("never suggests `extra` from training days alone", () => {
    // `extra` describes a physically demanding job, not a gym habit, so no
    // number of training days should imply it.
    const suggestions = [0, 1, 2, 3, 4, 5, 6, 7].map(suggestActivityLevel);
    expect(suggestions).not.toContain("extra");
  });
});

describe("activityLevelDisagrees", () => {
  it("flags a clear contradiction", () => {
    // "I do not exercise" alongside five training days a week.
    expect(activityLevelDisagrees("sedentary", 5)).toBe(true);
  });

  it("stays quiet on an adjacent judgement call", () => {
    // 3 days sits on the light/moderate boundary; intensity decides it, and the
    // person knows their own intensity. Prompting here trains people to dismiss
    // prompts.
    expect(activityLevelDisagrees("light", 3)).toBe(false);
    expect(activityLevelDisagrees("moderate", 3)).toBe(false);
  });

  it("never questions `extra`", () => {
    expect(activityLevelDisagrees("extra", 0)).toBe(false);
    expect(activityLevelDisagrees("extra", 7)).toBe(false);
  });

  it("flags an overstated level too, not only an understated one", () => {
    expect(activityLevelDisagrees("very", 0)).toBe(true);
  });
});
