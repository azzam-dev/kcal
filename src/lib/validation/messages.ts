import type { MessageKey } from "@/i18n";

/**
 * Maps a Zod issue code to a message key.
 *
 * The schemas carry short stable codes ("password_too_short") rather than
 * Arabic prose, for the same reason the Supabase error mapping keys on codes:
 * the text belongs in the catalogue with every other user-facing string, and a
 * schema should not have to be edited to reword a sentence.
 */
const ISSUE_TO_KEY: Partial<Record<string, MessageKey>> = {
  email_invalid: "field.emailInvalid",
  password_required: "field.passwordRequired",
  password_too_short: "field.passwordTooShort",
  password_too_long: "field.passwordTooLong",
  display_name_too_long: "field.displayNameTooLong",
};

/** First issue only: one clear thing to fix beats a list of five. */
export function issueKey(issues: readonly { message: string }[]): MessageKey {
  const first = issues[0]?.message;
  return (first && ISSUE_TO_KEY[first]) || "error.invalidInput";
}
