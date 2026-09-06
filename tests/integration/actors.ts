import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import { PUBLISHABLE_KEY, SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

/**
 * Throwaway accounts and clients for the row-level security tests.
 *
 * Extracted here at the second RLS suite rather than left in the first: every
 * table this app adds needs the same two strangers to prove it keeps them
 * apart, and a copy of this per suite is a copy that drifts.
 *
 * The clients are deliberately untyped. A security test has to be able to send
 * a payload the application types would forbid — a row addressed to somebody
 * else's id is precisely the thing being tested — and `Database` would make
 * that a compile error instead of the refusal from Postgres we want to see.
 */

const PASSWORD = "integration-test-password";

export type Actor = { user: User; client: SupabaseClient };

/** Service-role client. Creates and destroys fixtures; never exercises behaviour. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client with no session at all, as an unauthenticated visitor would have. */
export function anonymousClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A real signed-in user, over the publishable key exactly as a browser would
 * be. The service-role client only creates the account.
 */
export async function createActor(admin: SupabaseClient, label: string): Promise<Actor> {
  const email = `rls-${label}-${crypto.randomUUID()}@example.test`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    // Skips the confirmation email. Confirmation stays ON for real sign-ups;
    // this only avoids a mailbox in a test.
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error(`could not create ${label}`);

  const client = anonymousClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;

  return { user: data.user, client };
}
