import { describe, expect, it } from "vitest";

import {
  ACTIVITY_FACTORS,
  GOAL_MULTIPLIERS,
  PROTEIN_G_PER_KG,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/features/nutrition/domain";
import type { Database } from "@/lib/database.types";

/**
 * The seam between the pure domain and the database.
 *
 * The calculation engine declares its own `Gender`, `ActivityLevel` and `Goal`
 * rather than importing the generated types — that independence is what lets it
 * be tested and replaced without Supabase. The cost is that the two definitions
 * can drift: add a value to the Postgres enum and the engine will happily read
 * a row it has no factor for, producing `NaN` calories rather than an error.
 *
 * These checks close that gap. The type-level ones fail the BUILD if the sets
 * stop matching; the runtime ones fail the TESTS if a value exists in both but
 * the engine has no number for it.
 */

type DbGender = Database["public"]["Enums"]["gender"];
type DbActivityLevel = Database["public"]["Enums"]["activity_level"];
type DbGoal = Database["public"]["Enums"]["goal"];

/** True only when the two unions are identical in both directions. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Expect<T extends true> = T;

// A mismatch here is a type error at `npm run typecheck`, before any test runs.
type _GenderMatches = Expect<Equal<Gender, DbGender>>;
type _ActivityMatches = Expect<Equal<ActivityLevel, DbActivityLevel>>;
type _GoalMatches = Expect<Equal<Goal, DbGoal>>;

describe("the domain vocabulary matches the database enums", () => {
  it("has a TDEE factor for every activity level the column accepts", () => {
    const levels: DbActivityLevel[] = ["sedentary", "light", "moderate", "very", "extra"];

    for (const level of levels) {
      expect(ACTIVITY_FACTORS[level], `no factor for "${level}"`).toBeTypeOf("number");
      expect(Number.isFinite(ACTIVITY_FACTORS[level])).toBe(true);
    }
  });

  it("has a protein figure for every goal the column accepts", () => {
    const goals: DbGoal[] = ["lose_fat", "maintain", "gain_muscle", "custom"];

    for (const goal of goals) {
      expect(PROTEIN_G_PER_KG[goal], `no protein figure for "${goal}"`).toBeTypeOf("number");
    }
  });

  it("has a calorie multiplier for every fixed goal", () => {
    // `custom` is deliberately absent: it is driven by a rate, not a multiplier.
    expect(Object.keys(GOAL_MULTIPLIERS).sort()).toEqual([
      "gain_muscle",
      "lose_fat",
      "maintain",
    ]);
  });

  it("keeps the type-level assertions above referenced", () => {
    // Types alone leave no runtime trace, and an unused type alias is easy to
    // delete by accident. This keeps the file honest about what it asserts.
    const assertions: [_GenderMatches, _ActivityMatches, _GoalMatches] = [true, true, true];
    expect(assertions).toEqual([true, true, true]);
  });
});
