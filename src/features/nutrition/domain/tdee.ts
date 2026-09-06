import type { ActivityLevel } from "./types";

/**
 * Total daily energy expenditure = BMR × an activity factor.
 *
 * The standard Harris-Benedict activity multipliers, used unchanged.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

export function estimateTdee(bmr: number, level: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[level];
}

/**
 * The activity level implied by a number of training days per week.
 *
 * NOT part of the calculation. Onboarding asks for both an activity level and
 * a training-day count, and the level already encodes the days — feeding both
 * into the multiplier double-counts and inflates TDEE by hundreds of calories
 * with nothing on screen to explain the result (docs/DECISIONS.md, amendment 2).
 *
 * This exists only so the UI can notice the two answers disagree and offer the
 * level that matches, leaving the choice with the user. The bands are the ones
 * written on the options themselves, so the suggestion always matches the text
 * the person just read.
 */
export function suggestActivityLevel(trainingDaysPerWeek: number): ActivityLevel {
  if (trainingDaysPerWeek <= 0) return "sedentary";
  if (trainingDaysPerWeek <= 3) return "light";
  if (trainingDaysPerWeek <= 5) return "moderate";
  return "very";
}

/**
 * Whether the chosen level and the stated training days are far enough apart to
 * be worth mentioning.
 *
 * Adjacent levels are not flagged: "light" versus "moderate" at 3 days a week
 * is a judgement call about intensity that the person is better placed to make
 * than a lookup table, and a prompt on every boundary case trains people to
 * dismiss prompts. "extra" is never questioned — it describes a job, not a
 * gym habit, so training days say nothing about it.
 */
export function activityLevelDisagrees(
  chosen: ActivityLevel,
  trainingDaysPerWeek: number,
): boolean {
  if (chosen === "extra") return false;

  const order: ActivityLevel[] = ["sedentary", "light", "moderate", "very", "extra"];
  const chosenIndex = order.indexOf(chosen);
  const suggestedIndex = order.indexOf(suggestActivityLevel(trainingDaysPerWeek));

  return Math.abs(chosenIndex - suggestedIndex) >= 2;
}
