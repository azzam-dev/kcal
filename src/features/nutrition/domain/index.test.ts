import { describe, expect, it } from "vitest";

import { calculateTargets, validateNutritionInput } from "./index";
import type { BmrFormula } from "./bmr";
import type { MacroStrategy } from "./macros";
import type { NutritionInput } from "./types";

/** Fixed so age, and therefore every number below, is deterministic. */
const NOW = new Date("2026-09-06T00:00:00Z");

const BASE: NutritionInput = {
  gender: "male",
  birthYear: 1996, // 30 at NOW
  heightCm: 180,
  weightKg: 80,
  activityLevel: "moderate",
  goal: "lose_fat",
  targetWeightKg: 75,
};

function targetsFor(overrides: Partial<NutritionInput> = {}) {
  const result = calculateTargets({ ...BASE, ...overrides }, { now: NOW });
  if (!result.ok) throw new Error(`expected success, got ${result.issues.join(", ")}`);
  return result.targets;
}

describe("calculateTargets", () => {
  it("produces the full chain for a worked example", () => {
    // BMR 10·80 + 6.25·180 − 5·30 + 5      = 1780
    // TDEE 1780 × 1.55                      = 2759
    // fat loss 2759 × 0.80 = 2207.2 → to 10 = 2210
    // protein 2.0 × 80 = 160 g             = 640 kcal
    // fat max(2210 × 0.25 ÷ 9, 48) = 61 g  = 549 kcal
    // carbs (2210 − 640 − 549) ÷ 4         = 255 g
    expect(targetsFor()).toEqual({
      bmr: 1780,
      tdee: 2759,
      calories: 2210,
      protein: 160,
      carbs: 255,
      fat: 61,
      adjustments: [],
    });
  });

  it("is deterministic for the same inputs and the same day", () => {
    expect(targetsFor()).toEqual(targetsFor());
  });

  it("moves every downstream number when activity changes", () => {
    const sedentary = targetsFor({ activityLevel: "sedentary" });
    const veryActive = targetsFor({ activityLevel: "very" });

    expect(sedentary.bmr).toBe(veryActive.bmr);
    expect(veryActive.tdee).toBeGreaterThan(sedentary.tdee);
    expect(veryActive.calories).toBeGreaterThan(sedentary.calories);
    expect(veryActive.carbs).toBeGreaterThan(sedentary.carbs);
  });

  it("keeps protein steady across activity levels", () => {
    // Protein is scaled off body size, not off energy expenditure. Carbohydrate
    // is the flexible remainder, and it should absorb the whole difference.
    const sedentary = targetsFor({ activityLevel: "sedentary" });
    const veryActive = targetsFor({ activityLevel: "very" });

    expect(sedentary.protein).toBe(veryActive.protein);
  });

  it("orders goals as expected at identical body inputs", () => {
    const lose = targetsFor({ goal: "lose_fat" }).calories;
    const maintain = targetsFor({ goal: "maintain", targetWeightKg: undefined }).calories;
    const gain = targetsFor({ goal: "gain_muscle", targetWeightKg: 85 }).calories;

    expect(lose).toBeLessThan(maintain);
    expect(maintain).toBeLessThan(gain);
  });

  it("surfaces a clamp instead of applying it silently", () => {
    const targets = targetsFor({
      gender: "female",
      heightCm: 155,
      weightKg: 48,
      activityLevel: "sedentary",
      targetWeightKg: 45,
    });

    // A person who follows a quietly clamped number for months never learns it
    // was not the one they asked for.
    expect(targets.adjustments).toContain("calorie_floor_applied");
  });

  it("flags an underweight target without deepening the deficit", () => {
    const healthy = targetsFor({ targetWeightKg: 75 });
    const underweight = targetsFor({ targetWeightKg: 55 }); // BMI 17 at 180 cm

    expect(underweight.adjustments).toContain("target_weight_underweight");
    expect(underweight.calories).toBe(healthy.calories);
  });

  it("accepts a replacement BMR formula", () => {
    const flat: BmrFormula = { id: "flat", calculate: () => 2000 };
    const result = calculateTargets(BASE, { now: NOW, bmrFormula: flat });

    expect(result.ok && result.targets.bmr).toBe(2000);
    expect(result.ok && result.targets.tdee).toBe(3100); // 2000 × 1.55
  });

  it("accepts a replacement macro strategy", () => {
    const even: MacroStrategy = {
      id: "even",
      calculate: () => ({ protein: 100, carbs: 100, fat: 100, adjustments: [] }),
    };
    const result = calculateTargets(BASE, { now: NOW, macroStrategy: even });

    expect(result.ok && result.targets.protein).toBe(100);
  });

  it("refuses rather than throwing when the input is invalid", () => {
    const result = calculateTargets({ ...BASE, birthYear: 2020 }, { now: NOW });

    expect(result).toEqual({ ok: false, issues: ["age_below_minimum"] });
  });
});

describe("validateNutritionInput", () => {
  const validate = (overrides: Partial<NutritionInput>) =>
    validateNutritionInput({ ...BASE, ...overrides }, NOW);

  it("accepts a complete, plausible input", () => {
    expect(validate({})).toEqual([]);
  });

  it("refuses anyone under 16", () => {
    expect(validate({ birthYear: 2011 })).toEqual(["age_below_minimum"]);
    expect(validate({ birthYear: 2010 })).toEqual([]); // exactly 16
  });

  it("refuses an implausible age", () => {
    expect(validate({ birthYear: 1900 })).toEqual(["age_implausible"]);
  });

  it.each([
    [89, "height_out_of_range"],
    [251, "height_out_of_range"],
  ] as const)("refuses a height of %i cm", (heightCm, issue) => {
    expect(validate({ heightCm })).toContain(issue);
  });

  it.each([19, 401])("refuses a weight of %i kg", (weightKg) => {
    expect(validate({ weightKg })).toContain("weight_out_of_range");
  });

  it("requires a target weight for goals that move weight", () => {
    expect(validate({ goal: "lose_fat", targetWeightKg: undefined })).toEqual([
      "target_weight_required",
    ]);
    expect(validate({ goal: "gain_muscle", targetWeightKg: undefined })).toEqual([
      "target_weight_required",
    ]);
  });

  it("does not require a target weight for maintenance", () => {
    expect(validate({ goal: "maintain", targetWeightKg: undefined })).toEqual([]);
  });

  it("requires a rate for a custom goal", () => {
    expect(validate({ goal: "custom", customRateKgPerWeek: undefined })).toEqual([
      "custom_rate_required",
    ]);
  });

  it("refuses a custom rate faster than 1 kg a week, in either direction", () => {
    // Past this the deficit cap would override the number anyway; a visible
    // refusal beats a request that is quietly ignored.
    expect(validate({ goal: "custom", customRateKgPerWeek: -1.5 })).toEqual([
      "custom_rate_out_of_range",
    ]);
    expect(validate({ goal: "custom", customRateKgPerWeek: 1.5 })).toEqual([
      "custom_rate_out_of_range",
    ]);
    expect(validate({ goal: "custom", customRateKgPerWeek: -1 })).toEqual([]);
  });

  it("reports every problem at once, not the first one", () => {
    const issues = validate({ birthYear: 2015, heightCm: 300, weightKg: 5 });

    expect(issues).toEqual([
      "age_below_minimum",
      "height_out_of_range",
      "weight_out_of_range",
    ]);
  });
});
