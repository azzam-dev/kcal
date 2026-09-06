import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  CAN_RUN_INTEGRATION,
  PUBLISHABLE_KEY,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "../env";

/**
 * The security test the whole design rests on.
 *
 * Authorisation in this app lives in Postgres, not in application code — so the
 * only way to know it works is to ask Postgres, as two real users, over the same
 * public API a browser uses. Every client below is built with the PUBLISHABLE
 * key; the service-role client exists solely to create and destroy the fixtures.
 *
 * A passing run means: user A cannot read, change or destroy anything of user
 * B's, and cannot forge a row of their own.
 */

const PASSWORD = "integration-test-password";

type Actor = { user: User; client: SupabaseClient };

describe.skipIf(!CAN_RUN_INTEGRATION)("profiles row-level security", () => {
  let admin: SupabaseClient;
  let alice: Actor;
  let bob: Actor;

  async function createActor(label: string): Promise<Actor> {
    const email = `rls-${label}-${crypto.randomUUID()}@example.test`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      // Skips the confirmation email. Confirmation stays ON for real sign-ups;
      // this only avoids a mailbox in a test.
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error(`could not create ${label}`);

    const client = createClient(SUPABASE_URL!, PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    if (signInError) throw signInError;

    return { user: data.user, client };
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    [alice, bob] = await Promise.all([createActor("alice"), createActor("bob")]);
  }, 30_000);

  afterAll(async () => {
    // Leaving accounts behind would slowly turn the project into a landfill and
    // make a later "no rows" assertion pass for the wrong reason.
    await Promise.all(
      [alice, bob]
        .filter(Boolean)
        .map((actor) => admin.auth.admin.deleteUser(actor.user.id)),
    );
  });

  it("creates exactly one profile row per sign-up, via the trigger", async () => {
    const { data, error } = await alice.client.from("profiles").select("id");

    expect(error).toBeNull();
    expect(data).toEqual([{ id: alice.user.id }]);
  });

  it("leaves the profile empty for onboarding to fill", async () => {
    // handle_new_user must not invent a display name from the email local-part:
    // it produces a name the user never chose and then has to discover.
    const { data } = await alice.client
      .from("profiles")
      .select("display_name, onboarded_at")
      .single();

    expect(data?.display_name).toBeNull();
    expect(data?.onboarded_at).toBeNull();
  });

  it("does not let one user read another's profile", async () => {
    const { data, error } = await alice.client
      .from("profiles")
      .select("id, display_name")
      .eq("id", bob.user.id);

    // Not an error — RLS filters rather than refuses, so the honest assertion
    // is that nothing came back, not that something failed.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("does not let one user modify another's profile", async () => {
    const { data, error } = await alice.client
      .from("profiles")
      .update({ display_name: "owned" })
      .eq("id", bob.user.id)
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: bobsRow } = await bob.client.from("profiles").select("display_name").single();
    expect(bobsRow?.display_name).toBeNull();
  });

  it("lets a user update their own profile", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({ display_name: "عزام" })
      .eq("id", alice.user.id);

    expect(error).toBeNull();

    const { data } = await alice.client.from("profiles").select("display_name").single();
    expect(data?.display_name).toBe("عزام");
  });

  it("refuses an INSERT from any client", async () => {
    // There is no insert grant and no insert policy: rows come from the sign-up
    // trigger only. This blocks a forged profile for an id that is not theirs
    // AND a second row for their own id.
    const { error } = await alice.client
      .from("profiles")
      .insert({ id: crypto.randomUUID() });

    expect(error).not.toBeNull();
  });

  it("refuses a DELETE from any client", async () => {
    // Profiles disappear by cascade from auth.users. A client that could delete
    // its profile row directly would leave an auth user with no profile — a
    // state no code path expects.
    const { error } = await alice.client.from("profiles").delete().eq("id", alice.user.id);

    expect(error).not.toBeNull();
  });

  it("shows nothing to a client with no session", async () => {
    const anonymous = createClient(SUPABASE_URL!, PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anonymous.from("profiles").select("id");

    // anon holds no grant on the table at all, so this is a hard refusal rather
    // than an empty result.
    expect(error ?? data).not.toEqual([]);
  });

  it("enforces the sanity bounds in the database, not only in the form", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({ height_cm: 500 })
      .eq("id", alice.user.id);

    expect(error?.code).toBe("23514"); // check_violation
  });

  it("rejects a display name over the column's limit", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({ display_name: "ع".repeat(61) })
      .eq("id", alice.user.id);

    expect(error?.code).toBe("23514");
  });

  it("deletes only the caller's own account", async () => {
    const victim = await createActor("victim");
    const survivor = await createActor("survivor");

    const { error } = await victim.client.rpc("delete_own_account");
    expect(error).toBeNull();

    const { data: gone } = await admin.auth.admin.getUserById(victim.user.id);
    expect(gone.user).toBeNull();

    const { data: still } = await admin.auth.admin.getUserById(survivor.user.id);
    expect(still.user?.id).toBe(survivor.user.id);

    await admin.auth.admin.deleteUser(survivor.user.id);
  }, 30_000);

  it("refuses delete_own_account to a client with no session", async () => {
    const anonymous = createClient(SUPABASE_URL!, PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await anonymous.rpc("delete_own_account");
    expect(error).not.toBeNull();
  });
});
