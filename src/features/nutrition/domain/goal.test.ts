import { describe, expect, it } from "vitest";

import {
  bmi,
  CALORIE_FLOORS,
  calorieTarget,
  KCAL_PER_KG,
  MAX_DEFICIT_RATIO,
  targetWeightIsUnderweight,
} from "./goal";

describe("calorieTarget", () => {
  it("subtracts 20% for fat loss", () => {
    const { calories, adjustments } = calorieTarget({
      tdee: 2500,
      goal: "lose_fat",
      gender: "male",
    });

    expect(calories).toBe(2000);
    expect(adjustments).toEqual([]);
  });

  it("leaves maintenance alone", () => {
    expect(calorieTarget({ tdee: 2500, goal: "maintain", gender: "male" }).calories).toBe(2500);
  });

  it("adds 12% for muscle gain", () => {
    // 2500 × 1.12 = 2800
    expect(calorieTarget({ tdee: 2500, goal: "gain_muscle", gender: "male" }).calories).toBe(2800);
  });

  it("turns a custom rate into a daily offset", () => {
    // −0.5 kg/week × 7700 kcal/kg ÷ 7 days = −550 kcal/day
    const { calories, adjustments } = calorieTarget({
      tdee: 2500,
      goal: "custom",
      gender: "male",
      customRateKgPerWeek: -0.5,
    });

    expect(calories).toBe(2500 - (0.5 * KCAL_PER_KG) / 7);
    expect(adjustments).toEqual([]);
  });

  it("rounds to the nearest 10, because the inputs are estimates", () => {
    // A figure like 2207 claims a precision this arithmetic does not have.
    const { calories } = calorieTarget({ tdee: 2759, goal: "lose_fat", gender: "male" });

    expect(calories).toBe(2210);
    expect(calories % 10).toBe(0);
  });

  describe("safety rails", () => {
    it("caps a deficit at 25% and says so", () => {
      // −1 kg/week on a 2400 TDEE asks for 1300; the cap allows 1800.
      const { calories, adjustments } = calorieTarget({
        tdee: 2400,
        goal: "custom",
        gender: "male",
        customRateKgPerWeek: -1,
      });

      expect(calories).toBe(1800);
      expect(calories).toBe(2400 * (1 - MAX_DEFICIT_RATIO));
      expect(adjustments).toEqual(["deficit_capped"]);
    });

    it("caps a surplus at 20% and says so", () => {
      const { calories, adjustments } = calorieTarget({
        tdee: 2400,
        goal: "custom",
        gender: "male",
        customRateKgPerWeek: 1,
      });

      expect(calories).toBe(2880);
      expect(adjustments).toEqual(["surplus_capped"]);
    });

    it("applies the absolute floor when the ratio alone leaves it too low", () => {
      // A small frame: 20% off 1450 is 1160, under the 1200 floor.
      const { calories, adjustments } = calorieTarget({
        tdee: 1450,
        goal: "lose_fat",
        gender: "female",
      });

      expect(calories).toBe(CALORIE_FLOORS.female);
      expect(adjustments).toEqual(["calorie_floor_applied"]);
    });

    it("uses a higher floor for men", () => {
      const { calories, adjustments } = calorieTarget({
        tdee: 1800,
        goal: "lose_fat",
        gender: "male",
      });

      expect(calories).toBe(CALORIE_FLOORS.male);
      expect(adjustments).toEqual(["calorie_floor_applied"]);
    });

    it("reports both rails when both bind", () => {
      // An extreme custom rate on a small TDEE: capped by ratio, then still
      // under the floor. Both are reported, in the order they were applied.
      const { calories, adjustments } = calorieTarget({
        tdee: 1400,
        goal: "custom",
        gender: "female",
        customRateKgPerWeek: -1,
      });

      expect(calories).toBe(CALORIE_FLOORS.female);
      expect(adjustments).toEqual(["deficit_capped", "calorie_floor_applied"]);
    });

    it("does NOT clamp a sedentary fat-loss target up to BMR", () => {
      // Guards a deliberate omission. A "never below BMR" rule would fire for
      // every sedentary person on this goal — 1.20 × 0.80 = 0.96·BMR — turning
      // a 4% difference into a safety warning shown to almost everyone.
      const bmrValue = 1800;
      const { calories, adjustments } = calorieTarget({
        tdee: bmrValue * 1.2,
        goal: "lose_fat",
        gender: "male",
      });

      expect(calories).toBeLessThan(bmrValue);
      expect(adjustments).toEqual([]);
    });

    it("never lets any goal fall below 75% of TDEE", () => {
      for (const rate of [-1, -5, -100]) {
        const { calories } = calorieTarget({
          tdee: 3000,
          goal: "custom",
          gender: "male",
          customRateKgPerWeek: rate,
        });
        expect(calories).toBeGreaterThanOrEqual(3000 * (1 - MAX_DEFICIT_RATIO) - 5);
      }
    });
  });
});

describe("bmi", () => {
  it("is weight over height in metres squared", () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 2);
  });
});

describe("targetWeightIsUnderweight", () => {
  it("flags a target under BMI 18.5", () => {
    // 18.5 at 1.70 m is 53.5 kg.
    expect(targetWeightIsUnderweight(50, 170)).toBe(true);
  });

  it("accepts a target inside the healthy range", () => {
    expect(targetWeightIsUnderweight(65, 170)).toBe(false);
  });
});
