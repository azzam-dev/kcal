import {
  ageFromBirthYear,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  mifflinStJeor,
  type BmrFormula,
} from "./bmr";
import { calorieTarget, targetWeightIsUnderweight } from "./goal";
import { proteinFirstStrategy, type MacroStrategy } from "./macros";
import { estimateTdee } from "./tdee";
import type {
  AdjustmentReason,
  CalculationResult,
  InputIssue,
  NutritionInput,
  NutritionTargets,
} from "./types";

export * from "./bmr";
export * from "./goal";
export * from "./macros";
export * from "./tdee";
export * from "./types";

/**
 * Bounds that make an input a person rather than a typo.
 *
 * Mirrored by CHECK constraints in the profiles migration. Two layers on
 * purpose: this one produces a message someone can act on, that one holds even
 * if a write ever arrives by another route.
 */
export const HEIGHT_CM_RANGE = { min: 90, max: 250 } as const;
export const WEIGHT_KG_RANGE = { min: 20, max: 400 } as const;

/**
 * The fastest weight change a custom goal may ask for.
 *
 * 1 kg a week is already at the aggressive end of what is sustainable; past it
 * the deficit cap would silently override the number anyway, and a rejected
 * input the user can see beats a request that is quietly ignored.
 */
export const CUSTOM_RATE_KG_PER_WEEK_LIMIT = 1;

export function validateNutritionInput(
  input: NutritionInput,
  now: Date = new Date(),
): InputIssue[] {
  const issues: InputIssue[] = [];
  const age = ageFromBirthYear(input.birthYear, now);

  if (age < MIN_AGE_YEARS) issues.push("age_below_minimum");
  else if (age > MAX_AGE_YEARS) issues.push("age_implausible");

  if (input.heightCm < HEIGHT_CM_RANGE.min || input.heightCm > HEIGHT_CM_RANGE.max) {
    issues.push("height_out_of_range");
  }

  if (input.weightKg < WEIGHT_KG_RANGE.min || input.weightKg > WEIGHT_KG_RANGE.max) {
    issues.push("weight_out_of_range");
  }

  const needsTargetWeight = input.goal === "lose_fat" || input.goal === "gain_muscle";
  if (needsTargetWeight) {
    if (input.targetWeightKg === undefined) {
      issues.push("target_weight_required");
    } else if (
      input.targetWeightKg < WEIGHT_KG_RANGE.min ||
      input.targetWeightKg > WEIGHT_KG_RANGE.max
    ) {
      issues.push("target_weight_out_of_range");
    }
  }

  if (input.goal === "custom") {
    if (input.customRateKgPerWeek === undefined) {
      issues.push("custom_rate_required");
    } else if (Math.abs(input.customRateKgPerWeek) > CUSTOM_RATE_KG_PER_WEEK_LIMIT) {
      issues.push("custom_rate_out_of_range");
    }
  }

  return issues;
}

export type EngineOptions = {
  bmrFormula?: BmrFormula;
  macroStrategy?: MacroStrategy;
  now?: Date;
};

/**
 * The whole engine: inputs in, daily targets out.
 *
 *   BMR → TDEE → goal adjustment + safety rails → calories → macros
 *
 * Returns a result rather than throwing, and never returns a number it had to
 * change without saying which and why. A silently clamped target is worse than
 * no target: the person follows it for months and never learns it was not what
 * they asked for.
 */
export function calculateTargets(
  input: NutritionInput,
  options: EngineOptions = {},
): CalculationResult {
  const {
    bmrFormula = mifflinStJeor,
    macroStrategy = proteinFirstStrategy,
    now = new Date(),
  } = options;

  const issues = validateNutritionInput(input, now);
  if (issues.length > 0) return { ok: false, issues };

  const bmr = bmrFormula.calculate({
    gender: input.gender,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    ageYears: ageFromBirthYear(input.birthYear, now),
  });

  const tdee = estimateTdee(bmr, input.activityLevel);

  const calories = calorieTarget({
    tdee,
    goal: input.goal,
    gender: input.gender,
    customRateKgPerWeek: input.customRateKgPerWeek,
  });

  const macros = macroStrategy.calculate({
    calories: calories.calories,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    goal: input.goal,
  });

  const adjustments: AdjustmentReason[] = [...calories.adjustments, ...macros.adjustments];

  // Advisory, and deliberately last: it says something about the destination,
  // not about the numbers, and it never makes the deficit deeper.
  if (
    input.targetWeightKg !== undefined &&
    targetWeightIsUnderweight(input.targetWeightKg, input.heightCm)
  ) {
    adjustments.push("target_weight_underweight");
  }

  const targets: NutritionTargets = {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: calories.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    adjustments,
  };

  return { ok: true, targets };
}
