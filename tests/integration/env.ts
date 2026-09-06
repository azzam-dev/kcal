/**
 * Credentials for the integration tests.
 *
 * These talk to a real Supabase project, which is the entire point: row-level
 * security is enforced by Postgres, so a mock proves nothing about it.
 *
 * The service-role key appears ONLY here. It is used to create and delete the
 * throwaway accounts a test needs — never to exercise the behaviour under test,
 * which always runs through the ordinary publishable key with a real session,
 * exactly as a browser would.
 *
 * It lives in .env.test.local (git-ignored) and in CI as a secret. Nothing under
 * src/ may import this file.
 */

// Node reads the file itself; no dotenv dependency for something used by tests
// alone. Absent file means the integration tests skip rather than fail.
try {
  process.loadEnvFile(".env.test.local");
} catch {
  // Not present — CI without secrets, or a fresh clone. Handled below.
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * True when the tests can actually reach a project.
 *
 * Used with `describe.skipIf`. Skipping is deliberate: a contributor without
 * credentials should get a green run, not a wall of connection failures that
 * teaches them to ignore red. CI for this repo does supply them, so the skip
 * cannot quietly become permanent.
 */
export const CAN_RUN_INTEGRATION = Boolean(SUPABASE_URL && PUBLISHABLE_KEY && SERVICE_ROLE_KEY);
