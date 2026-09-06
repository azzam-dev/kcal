import type { Gender } from "./types";

/**
 * Basal metabolic rate.
 *
 * Behind an interface because the formula is the single most likely thing in
 * this engine to be replaced — swapping it should be one new object and its
 * tests, not a search through the app. Nothing outside this folder may contain
 * a metabolic equation.
 */
export type BmrInput = {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
};

export type BmrFormula = {
  readonly id: string;
  calculate(input: BmrInput): number;
};

/**
 * Mifflin-St Jeor (1990). The current clinical default, and the one reference
 * this project uses without inventing anything around it.
 *
 *   male:   10·kg + 6.25·cm − 5·age + 5
 *   female: 10·kg + 6.25·cm − 5·age − 161
 *
 * Chosen over Harris-Benedict, which is older and less accurate on modern body
 * composition, and over Katch-McArdle, which is more accurate but needs a body
 * fat percentage this app does not collect and a beginner does not know.
 */
export const mifflinStJeor: BmrFormula = {
  id: "mifflin-st-jeor",
  calculate({ gender, weightKg, heightCm, ageYears }) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    return gender === "male" ? base + 5 : base - 161;
  },
};

/** The minimum age this app will produce targets for. */
export const MIN_AGE_YEARS = 16;

/** Above this, the input is a typo rather than a person. */
export const MAX_AGE_YEARS = 100;

/**
 * Age from a birth year.
 *
 * Year-only, because that is what the profile stores — a stored age silently
 * goes stale and drags BMR with it, while a full birth date is three fields
 * for precision this equation cannot use. The cost is being at most one year
 * out until the person's birthday, which moves BMR by 5 kcal: less than the
 * error in the equation itself, and far less than the error in weighing
 * yourself on a different day.
 */
export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number {
  return now.getFullYear() - birthYear;
}
