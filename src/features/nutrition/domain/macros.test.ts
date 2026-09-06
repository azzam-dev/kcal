import { describe, expect, it } from "vitest";

import {
  KCAL_PER_G,
  PROTEIN_G_PER_KG,
  proteinFirstStrategy,
  referenceWeightKg,
} from "./macros";
import type { Goal } from "./types";

const calculate = proteinFirstStrategy.calculate;

function caloriesFrom({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  return protein * KCAL_PER_G.protein + carbs * KCAL_PER_G.carbs + fat * KCAL_PER_G.fat;
}

describe("referenceWeightKg", () => {
  it("uses body weight inside a healthy range", () => {
    expect(referenceWeightKg(80, 180)).toBe(80);
  });

  it("caps at the weight that would be BMI 25", () => {
    // 1.70 m, 140 kg is BMI 48. The cap is 25 × 1.70² = 72.25 kg.
    expect(referenceWeightKg(140, 170)).toBeCloseTo(72.25, 2);
  });

  it("keeps protein achievable for a heavy person", () => {
    // The reason the cap exists: uncapped, this asks for 280 g of protein a day.
    const { protein } = calculate({ calories: 2200, weightKg: 140, heightCm: 170, goal: "lose_fat" });

    // 2.0 g/kg on the capped 72.25 kg reference, rounded: 145 g.
    expect(protein).toBe(145);
    expect(protein).toBeLessThan(2 * 140);
  });
});

describe("proteinFirstStrategy", () => {
  it("splits a comfortable target without adjusting anything", () => {
    const result = calculate({ calories: 2210, weightKg: 80, heightCm: 180, goal: "lose_fat" });

    expect(result).toEqual({ protein: 160, carbs: 255, fat: 61, adjustments: [] });
  });

  it("produces macros that add up to the calorie target", () => {
    // Rounding three numbers independently is how a dashboard ends up showing
    // three values that do not reach the fourth.
    for (const calories of [1200, 1650, 2000, 2210, 2800, 3500]) {
      const result = calculate({ calories, weightKg: 75, heightCm: 175, goal: "maintain" });
      expect(Math.abs(caloriesFrom(result) - calories)).toBeLessThanOrEqual(4);
    }
  });

  it.each([
    ["lose_fat", 2.0],
    ["maintain", 1.6],
    ["gain_muscle", 1.8],
    ["custom", 2.0],
  ] as const)("uses %s protein at %s g/kg", (goal, perKg) => {
    const result = calculate({ calories: 2600, weightKg: 70, heightCm: 175, goal: goal as Goal });

    expect(PROTEIN_G_PER_KG[goal as Goal]).toBe(perKg);
    expect(result.protein).toBe(Math.round(perKg * 70));
  });

  it("holds fat at its floor when 25% of calories would fall under it", () => {
    // 1200 × 25% ÷ 9 = 33.3 g, while 0.6 g/kg on 70 kg is 42 g.
    const result = calculate({ calories: 1200, weightKg: 70, heightCm: 175, goal: "maintain" });

    expect(result.fat).toBe(Math.round(0.6 * 70));
  });

  it("never returns negative carbohydrate", () => {
    for (const calories of [600, 900, 1200]) {
      const result = calculate({ calories, weightKg: 100, heightCm: 200, goal: "lose_fat" });
      expect(result.carbs).toBeGreaterThanOrEqual(0);
    }
  });

  describe("when the target cannot cover protein and fat", () => {
    it("pulls both back toward their floors and says so", () => {
      // 100 kg at 2.00 m is exactly BMI 25, so the reference weight is 100 kg:
      // 200 g protein and 60 g fat cost 1340 kcal against a 1200 target.
      const result = calculate({ calories: 1200, weightKg: 100, heightCm: 200, goal: "lose_fat" });

      expect(result.adjustments).toEqual(["macros_rebalanced"]);
      expect(result.protein).toBe(165);
      expect(result.fat).toBe(60);
      expect(result.carbs).toBe(0);
    });

    it("cuts neither one to protect the other", () => {
      // Both keep the same fraction of their headroom above the floor. Fat is
      // already at its floor here, so it does not move at all while protein
      // gives up exactly the shortfall.
      const result = calculate({ calories: 1200, weightKg: 100, heightCm: 200, goal: "lose_fat" });

      expect(result.fat).toBe(60); // its floor: 0.6 × 100
      expect(result.protein).toBeGreaterThan(120); // above its floor: 1.2 × 100
    });

    it("reports when even the floors do not fit", () => {
      // Floors alone cost 1020 kcal here, against a 900 target. The honest
      // answer is to say the calorie target itself does not work for this body.
      const result = calculate({ calories: 900, weightKg: 100, heightCm: 200, goal: "lose_fat" });

      expect(result.adjustments).toEqual(["macros_rebalanced", "macros_below_floor"]);
      expect(result.protein).toBe(120);
      expect(result.fat).toBe(60);
      expect(result.carbs).toBe(0);
    });
  });

  it("is identified, so a stored target can say which strategy produced it", () => {
    expect(proteinFirstStrategy.id).toBe("protein-first");
  });
});
