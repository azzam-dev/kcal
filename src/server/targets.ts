import type { PostgrestError } from "@supabase/supabase-js";

import type { NutritionInput, NutritionTargets } from "@/features/nutrition/domain";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access for `nutrition_targets`. Queries only — no business rules, no
 * formatting, and no clock.
 *
 * As in `profile.ts`, note the absence of any `where user_id = …` for
 * authorisation on the read: RLS scopes it to the caller's own rows inside
 * Postgres. `insertTarget` does set the column, because the INSERT policy
 * checks the incoming row against `auth.uid()` — setting it is how the row
 * identifies itself, not how it is protected. A forged id is refused by
 * Postgres, not by anything here.
 */

export type TargetSource = Database["public"]["Enums"]["target_source"];

/** A stored target, named as the calculation engine names its output. */
export type NutritionTarget = {
  id: string;
  effectiveFrom: string;
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: TargetSource;
};

export type NewTarget = {
  userId: string;
  /**
   * The first day this target applies, as `YYYY-MM-DD` in the USER's timezone.
   * Required rather than defaulted for the same reason the column has no
   * `default current_date`: the database's today is UTC's today.
   */
  effectiveFrom: string;
  targets: NutritionTargets;
  source: TargetSource;
  /** The inputs these numbers came from, kept so the row can be explained later. */
  inputs: NutritionInput;
};

/**
 * The target in effect on a given day — the newest row not in the future.
 *
 * `today` is passed in, as a `YYYY-MM-DD` date in the user's timezone, because
 * this layer has no business deciding what day it is: computing it here from
 * the server's clock would put every user outside UTC on the wrong day for
 * part of every day.
 */
export async function getCurrentTarget(today: string): Promise<NutritionTarget | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nutrition_targets")
    .select("id, effective_from, bmr, tdee, calorie_target, protein_g, carb_g, fat_g, source")
    .lte("effective_from", today)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[targets:read-current]", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    effectiveFrom: data.effective_from,
    bmr: data.bmr,
    tdee: data.tdee,
    calories: data.calorie_target,
    protein: data.protein_g,
    carbs: data.carb_g,
    fat: data.fat_g,
    source: data.source,
  };
}

/**
 * Adds a target. There is no update: a changed goal inserts a row with a later
 * `effective_from`, and the days already measured against the old one keep it.
 *
 * Returns the database error rather than a message key, so the mapping to
 * Arabic stays in the action with every other one. A second insert for the same
 * day arrives here as `23505`, which `databaseErrorKey` already knows.
 */
export async function insertTarget(target: NewTarget): Promise<PostgrestError | null> {
  const supabase = await createClient();

  const { error } = await supabase.from("nutrition_targets").insert({
    user_id: target.userId,
    effective_from: target.effectiveFrom,
    bmr: target.targets.bmr,
    tdee: target.targets.tdee,
    calorie_target: target.targets.calories,
    protein_g: target.targets.protein,
    carb_g: target.targets.carbs,
    fat_g: target.targets.fat,
    source: target.source,
    // `targets.adjustments` is deliberately not stored: it is a function of
    // these inputs, so keeping it as well would create a second copy that can
    // disagree with what the engine says today.
    inputs: { ...target.inputs },
  });

  return error;
}
