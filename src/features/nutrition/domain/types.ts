/**
 * The calculation engine's vocabulary.
 *
 * These unions mirror the Postgres enums in
 * supabase/migrations/..._create_profiles.sql. They are declared here rather
 * than imported from the generated database types on purpose: this layer is
 * pure TypeScript with no dependency on Supabase, which is what makes it
 * testable without a database and replaceable without touching the app. The
 * two must be changed together — a value added to one and not the other is a
 * compile error at the boundary, which is where it should surface.
 */

export type Gender = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";

export type Goal = "lose_fat" | "maintain" | "gain_muscle" | "custom";

/** Everything the engine needs. Validated at the boundary before it gets here. */
export type NutritionInput = {
  gender: Gender;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Required by goals that move weight; ignored by `maintain`. */
  targetWeightKg?: number;
  /** Required by `custom` only. Negative loses weight, positive gains. */
  customRateKgPerWeek?: number;
};

/**
 * Why a produced number differs from the arithmetic result.
 *
 * Reasons, not sentences: the domain has no business knowing what language the
 * user reads. The UI maps each of these to a message key.
 */
export type AdjustmentReason =
  /** The requested deficit exceeded the cap and was reduced. */
  | "deficit_capped"
  /** The requested surplus exceeded the cap and was reduced. */
  | "surplus_capped"
  /** The result fell under the absolute minimum for this gender. */
  | "calorie_floor_applied"
  /** Protein and fat were cut toward their floors to fit the calorie target. */
  | "macros_rebalanced"
  /** Even at their floors, protein and fat do not fit. Carbohydrate is zero. */
  | "macros_below_floor"
  /** The target weight implies a BMI under 18.5. Advisory only. */
  | "target_weight_underweight";

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Empty when nothing was clamped. Order is stable for display. */
  adjustments: AdjustmentReason[];
};

/** Why an input was refused. Mapped to a message key by the UI. */
export type InputIssue =
  | "age_below_minimum"
  | "age_implausible"
  | "height_out_of_range"
  | "weight_out_of_range"
  | "target_weight_required"
  | "target_weight_out_of_range"
  | "custom_rate_required"
  | "custom_rate_out_of_range";

export type CalculationResult =
  | { ok: true; targets: NutritionTargets }
  | { ok: false; issues: InputIssue[] };
