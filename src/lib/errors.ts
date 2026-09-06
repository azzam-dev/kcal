import type { MessageKey } from "@/i18n";

/**
 * Turns a Supabase error into a message key the UI can render.
 *
 * Two rules, both load-bearing:
 *
 * 1. **Key on the error CODE, never on its message text.** Message strings are
 *    English prose that Supabase is free to reword in any release; matching on
 *    them produces a mapping that breaks silently and starts showing users the
 *    generic fallback for errors we thought we handled.
 *
 * 2. **The original never reaches the user.** It goes to the server log, and
 *    the user gets a message written for them. Raw driver text leaks schema and
 *    internals, and tells the person nothing they can act on.
 */

export type SupabaseLikeError = {
  code?: string | null;
  message?: string;
  status?: number;
};

const AUTH_CODE_TO_KEY: Partial<Record<string, MessageKey>> = {
  invalid_credentials: "error.invalidCredentials",
  email_not_confirmed: "error.emailNotConfirmed",
  email_exists: "error.emailExists",
  // Supabase rejects addresses its own validation dislikes — a domain with no
  // MX record, for instance — after our schema has already accepted the format.
  // Without this the user is told "something went wrong" about the one field
  // they could actually fix.
  email_address_invalid: "field.emailInvalid",
  user_already_exists: "error.emailExists",
  weak_password: "error.weakPassword",
  same_password: "error.samePassword",
  otp_expired: "error.expiredLink",
  over_request_rate_limit: "error.rateLimited",
  over_email_send_rate_limit: "error.rateLimited",
  validation_failed: "error.invalidInput",
};

const DATABASE_CODE_TO_KEY: Partial<Record<string, MessageKey>> = {
  // Postgres / PostgREST codes that a user can actually do something about.
  "23505": "error.duplicate", // unique_violation
  "23514": "error.invalidInput", // check_violation
  "42501": "error.notAllowed", // insufficient_privilege — an RLS denial
  PGRST301: "error.sessionExpired", // JWT expired
};

function classify(
  error: SupabaseLikeError,
  context: string,
  table: Partial<Record<string, MessageKey>>,
): MessageKey {
  // The full original, on the server only, tagged so a report of "it said
  // something went wrong" can be traced to one call site.
  console.error(`[${context}]`, error);

  const code = error.code ?? undefined;
  return (code && table[code]) || "error.generic";
}

export function authErrorKey(error: SupabaseLikeError, context: string): MessageKey {
  return classify(error, context, AUTH_CODE_TO_KEY);
}

export function databaseErrorKey(error: SupabaseLikeError, context: string): MessageKey {
  return classify(error, context, DATABASE_CODE_TO_KEY);
}
