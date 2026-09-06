import type { AdjustmentReason, Gender, Goal } from "./types";

/**
 * Turning a TDEE into a daily calorie target, with the safety rails applied.
 */

/** Multipliers on TDEE for the fixed goals. */
export const GOAL_MULTIPLIERS: Record<Exclude<Goal, "custom">, number> = {
  lose_fat: 0.8,
  maintain: 1.0,
  gain_muscle: 1.12,
};

/**
 * Energy in a kilogram of body mass, used to turn a custom rate in kg/week into
 * a daily calorie offset. The widely cited figure is 3500 kcal per pound;
 * 7700 kcal/kg is that number in metric, rounded.
 */
export const KCAL_PER_KG = 7700;

/** Hard bounds on how far a target may sit from maintenance. */
export const MAX_DEFICIT_RATIO = 0.25;
export const MAX_SURPLUS_RATIO = 0.2;

/**
 * Absolute minimum daily intake, by gender. The commonly cited clinical floors
 * for an unsupervised diet.
 *
 * Note what is deliberately NOT here: a "never eat below your BMR" rule. The
 * sedentary factor is 1.20 and fat loss is ×0.80, so the plain result for every
 * sedentary person is 0.96·BMR — such a rule would report a safety intervention
 * to nearly every user of the app while moving their number by 4%. The 25% cap
 * already bounds the worst case at 0.90·BMR, and these floors catch the small
 * bodies that the ratio alone would not.
 */
export const CALORIE_FLOORS: Record<Gender, number> = {
  male: 1500,
  female: 1200,
};

export type CalorieTargetInput = {
  tdee: number;
  goal: Goal;
  gender: Gender;
  customRateKgPerWeek?: number;
};

export type CalorieTarget = {
  calories: number;
  adjustments: AdjustmentReason[];
};

/**
 * The unclamped target the goal asks for. Split out so the clamping is visible
 * as its own step rather than buried inside one expression.
 */
function requestedCalories(input: CalorieTargetInput): number {
  if (input.goal !== "custom") {
    return input.tdee * GOAL_MULTIPLIERS[input.goal];
  }
  const rate = input.customRateKgPerWeek ?? 0;
  return input.tdee + (rate * KCAL_PER_KG) / 7;
}

export function calorieTarget(input: CalorieTargetInput): CalorieTarget {
  const adjustments: AdjustmentReason[] = [];

  let calories = requestedCalories(input);

  const floorFromDeficit = input.tdee * (1 - MAX_DEFICIT_RATIO);
  const ceilingFromSurplus = input.tdee * (1 + MAX_SURPLUS_RATIO);

  if (calories < floorFromDeficit) {
    calories = floorFromDeficit;
    adjustments.push("deficit_capped");
  } else if (calories > ceilingFromSurplus) {
    calories = ceilingFromSurplus;
    adjustments.push("surplus_capped");
  }

  // The absolute floor is applied last so it wins over the ratio: a small
  // person's 25% deficit can still land under 1200.
  const floor = CALORIE_FLOORS[input.gender];
  if (calories < floor) {
    calories = floor;
    adjustments.push("calorie_floor_applied");
  }

  // Rounded to 10 because the input is an estimate to within a few hundred;
  // presenting "2347 kcal" claims a precision this arithmetic does not have.
  return { calories: Math.round(calories / 10) * 10, adjustments };
}

/** BMI, used for the underweight advisory and for the protein reference weight. */
export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export const UNDERWEIGHT_BMI = 18.5;

/**
 * A target weight below a healthy BMI is flagged, not blocked, and never used
 * to justify a deeper deficit. Refusing it outright would just push someone to
 * enter a number they do not mean; saying so plainly is more use.
 */
export function targetWeightIsUnderweight(targetWeightKg: number, heightCm: number): boolean {
  return bmi(targetWeightKg, heightCm) < UNDERWEIGHT_BMI;
}
