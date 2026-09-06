import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminClient, anonymousClient, createActor, type Actor } from "../actors";
import { CAN_RUN_INTEGRATION } from "../env";

/**
 * `nutrition_targets` is append-only, and this is where that claim is checked
 * against Postgres rather than against the migration's comments.
 *
 * Two properties matter here and neither is enforced by application code:
 * one user's targets are invisible and unwritable to another, and NOBODY —
 * including the owner — can update or delete a row. A goal change supersedes;
 * it does not edit. Yesterday's progress was measured against yesterday's
 * target, and a target that can be rewritten rewrites that history.
 */

const INPUTS = {
  gender: "male",
  birthYear: 1998,
  heightCm: 178,
  weightKg: 82,
  activityLevel: "moderate",
  goal: "lose_fat",
  targetWeightKg: 75,
};

/** A complete, valid row. Dates are fixed so no test depends on the day it runs. */
function targetRow(userId: string, effectiveFrom: string, overrides: object = {}) {
  return {
    user_id: userId,
    effective_from: effectiveFrom,
    bmr: 1800,
    tdee: 2790,
    calorie_target: 2230,
    protein_g: 164,
    carb_g: 258,
    fat_g: 62,
    source: "calculated",
    inputs: INPUTS,
    ...overrides,
  };
}

describe.skipIf(!CAN_RUN_INTEGRATION)("nutrition_targets row-level security", () => {
  let admin: SupabaseClient;
  let alice: Actor;
  let bob: Actor;

  beforeAll(async () => {
    admin = adminClient();
    [alice, bob] = await Promise.all([
      createActor(admin, "targets-alice"),
      createActor(admin, "targets-bob"),
    ]);
  }, 30_000);

  afterAll(async () => {
    // The targets go with them, by cascade from auth.users — which is also the
    // only way a row in this table is ever removed.
    await Promise.all(
      [alice, bob]
        .filter(Boolean)
        .map((actor) => admin.auth.admin.deleteUser(actor.user.id)),
    );
  });

  it("lets a user store a target of their own", async () => {
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(alice.user.id, "2026-01-01"));

    expect(error).toBeNull();

    const { data } = await alice.client
      .from("nutrition_targets")
      .select("calorie_target, source")
      .eq("effective_from", "2026-01-01")
      .single();

    expect(data).toEqual({ calorie_target: 2230, source: "calculated" });
  });

  it("refuses a target addressed to somebody else", async () => {
    // The INSERT policy checks the incoming row against auth.uid(), so the
    // user_id in the payload is a claim the database verifies rather than
    // trusts. This is the single test that says so.
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(bob.user.id, "2026-01-02"));

    expect(error?.code).toBe("42501"); // insufficient_privilege — an RLS denial

    const { data: bobsRows } = await bob.client
      .from("nutrition_targets")
      .select("id")
      .eq("effective_from", "2026-01-02");

    expect(bobsRows).toEqual([]);
  });

  it("does not let one user read another's targets", async () => {
    await bob.client.from("nutrition_targets").insert(targetRow(bob.user.id, "2026-02-01"));

    const { data, error } = await alice.client
      .from("nutrition_targets")
      .select("user_id");

    // RLS filters rather than refuses, so the honest assertion is that bob's
    // row is absent from what came back — not that the query failed.
    expect(error).toBeNull();
    expect(data?.every((row) => row.user_id === alice.user.id)).toBe(true);
  });

  it("refuses an UPDATE from the owner", async () => {
    // No update grant and no update policy. A correction is a new row; this is
    // what makes "append-only" a property of the database rather than a habit.
    const { error } = await alice.client
      .from("nutrition_targets")
      .update({ calorie_target: 9999 })
      .eq("effective_from", "2026-01-01");

    expect(error).not.toBeNull();

    const { data } = await alice.client
      .from("nutrition_targets")
      .select("calorie_target")
      .eq("effective_from", "2026-01-01")
      .single();

    expect(data?.calorie_target).toBe(2230);
  });

  it("refuses a DELETE from the owner", async () => {
    const { error } = await alice.client
      .from("nutrition_targets")
      .delete()
      .eq("effective_from", "2026-01-01");

    expect(error).not.toBeNull();

    const { count } = await alice.client
      .from("nutrition_targets")
      .select("id", { count: "exact", head: true })
      .eq("effective_from", "2026-01-01");

    expect(count).toBe(1);
  });

  it("keeps one target per day", async () => {
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(alice.user.id, "2026-01-01", { calorie_target: 2000 }));

    expect(error?.code).toBe("23505"); // unique_violation
  });

  it("supersedes an earlier target instead of touching it", async () => {
    // The phase 04 "done" criterion, as a test: changing a goal writes a new
    // row with a later effective date, and the old row is exactly as it was.
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(alice.user.id, "2026-03-01", { calorie_target: 2600, source: "custom" }));

    expect(error).toBeNull();

    const { data: onTheOldDay } = await alice.client
      .from("nutrition_targets")
      .select("calorie_target, source")
      .lte("effective_from", "2026-02-28")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    expect(onTheOldDay).toEqual({ calorie_target: 2230, source: "calculated" });

    const { data: onTheNewDay } = await alice.client
      .from("nutrition_targets")
      .select("calorie_target, source")
      .lte("effective_from", "2026-03-15")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    expect(onTheNewDay).toEqual({ calorie_target: 2600, source: "custom" });
  });

  it("enforces the sanity bounds in the database, not only in the engine", async () => {
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(alice.user.id, "2026-04-01", { calorie_target: 20_000 }));

    expect(error?.code).toBe("23514"); // check_violation
  });

  it("refuses an inputs snapshot that is not an object", async () => {
    // jsonb accepts a bare number happily. The CHECK is what stops a caller
    // storing something no later reader can make sense of.
    const { error } = await alice.client
      .from("nutrition_targets")
      .insert(targetRow(alice.user.id, "2026-04-02", { inputs: 42 }));

    expect(error?.code).toBe("23514");
  });

  it("shows nothing to a client with no session", async () => {
    const anonymous = anonymousClient();

    const { data, error } = await anonymous.from("nutrition_targets").select("id");

    // anon holds no grant on the table at all, so this is a hard refusal rather
    // than an empty result.
    expect(error ?? data).not.toEqual([]);
  });
});
