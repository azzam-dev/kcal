import { bmi } from "./goal";
import type { AdjustmentReason, Goal } from "./types";

/**
 * Splitting a calorie target into protein, carbohydrate and fat.
 *
 * A separate engine from the calorie one, behind an interface, because the two
 * change for different reasons: the calorie side follows a metabolic equation,
 * this side follows a dietary strategy. Adding keto or user-set ratios later is
 * a new object implementing `MacroStrategy`, not an edit here.
 */

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/**
 * Protein per kilogram of REFERENCE weight, by goal.
 *
 * `custom` takes the fat-loss figure: a custom rate can be a deficit, where too
 * little protein costs muscle, and being slightly high in a surplus costs
 * nothing at all. The asymmetry of the mistake decides the default.
 */
export const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.0,
  maintain: 1.6,
  gain_muscle: 1.8,
  custom: 2.0,
};

export const PROTEIN_FLOOR_G_PER_KG = 1.2;

/** Fat as a share of total calories, with a floor per kilogram beneath it. */
export const FAT_CALORIE_RATIO = 0.25;
export const FAT_FLOOR_G_PER_KG = 0.6;

/** The BMI at which the protein reference weight stops following body weight. */
export const REFERENCE_BMI_CAP = 25;

/**
 * The weight protein and fat are scaled against.
 *
 * Capped at the weight that would put this person at BMI 25. Scaling protein
 * off raw body weight asks a 140 kg person for 280 g of protein a day — a
 * number that is neither achievable nor supported by anything: the tissue that
 * needs feeding is lean mass, and lean mass does not rise in step with fat.
 */
export function referenceWeightKg(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) <= REFERENCE_BMI_CAP) return weightKg;

  const heightM = heightCm / 100;
  return REFERENCE_BMI_CAP * heightM * heightM;
}

export type MacroInput = {
  calories: number;
  weightKg: number;
  heightCm: number;
  goal: Goal;
};

export type MacroResult = {
  protein: number;
  carbs: number;
  fat: number;
  adjustments: AdjustmentReason[];
};

export type MacroStrategy = {
  readonly id: string;
  calculate(input: MacroInput): MacroResult;
};

/**
 * Protein first, then fat, and carbohydrate takes what is left.
 *
 * The order is the strategy: protein and fat have requirements, carbohydrate is
 * the flexible remainder. Where the calorie target cannot cover protein and fat
 * at their preferred levels — a low target on a large frame — both are pulled
 * back toward their floors together rather than one being sacrificed to the
 * other, and the result says so.
 */
export const proteinFirstStrategy: MacroStrategy = {
  id: "protein-first",

  calculate({ calories, weightKg, heightCm, goal }): MacroResult {
    const adjustments: AdjustmentReason[] = [];
    const reference = referenceWeightKg(weightKg, heightCm);

    const proteinFloor = PROTEIN_FLOOR_G_PER_KG * reference;
    const fatFloor = FAT_FLOOR_G_PER_KG * reference;

    let protein = PROTEIN_G_PER_KG[goal] * reference;
    let fat = Math.max((calories * FAT_CALORIE_RATIO) / KCAL_PER_G.fat, fatFloor);

    const preferredCost = protein * KCAL_PER_G.protein + fat * KCAL_PER_G.fat;

    if (preferredCost > calories) {
      const floorCost = proteinFloor * KCAL_PER_G.protein + fatFloor * KCAL_PER_G.fat;

      if (floorCost >= calories) {
        // Below what protein and fat need even at their minimums. Report it
        // rather than quietly producing a split that does not add up — this is
        // the signal that the calorie target itself is wrong for this person.
        protein = proteinFloor;
        fat = fatFloor;
        adjustments.push("macros_rebalanced", "macros_below_floor");
      } else {
        // Pull both back by the same fraction of their headroom above the
        // floors, so neither is spent to protect the other.
        const keep = (calories - floorCost) / (preferredCost - floorCost);
        protein = proteinFloor + (protein - proteinFloor) * keep;
        fat = fatFloor + (fat - fatFloor) * keep;
        adjustments.push("macros_rebalanced");
      }
    }

    // Round protein and fat first, then derive carbohydrate from what those
    // rounded values actually cost. Rounding all three independently lets the
    // three numbers on screen fail to add up to the fourth.
    const roundedProtein = Math.round(protein);
    const roundedFat = Math.round(fat);
    const remaining =
      calories - roundedProtein * KCAL_PER_G.protein - roundedFat * KCAL_PER_G.fat;
    const roundedCarbs = Math.max(0, Math.round(remaining / KCAL_PER_G.carbs));

    return {
      protein: roundedProtein,
      carbs: roundedCarbs,
      fat: roundedFat,
      adjustments,
    };
  },
};
