import { z } from "zod";

/**
 * Input schemas for the auth flows.
 *
 * These run on the SERVER, inside the action. Client-side validation is a
 * convenience for the person typing; it is not a control, because nothing stops
 * a request that never went through the form.
 */

/**
 * bcrypt — which is what Supabase hashes with — only reads the first 72 BYTES
 * of a password and silently ignores the rest. Without this cap, two different
 * long passwords can both open the same account, and the user is never told.
 * The limit is on bytes, not characters: Arabic characters are two bytes each
 * in UTF-8, so a 40-character Arabic passphrase is already 80 bytes.
 */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 8;

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "password_too_short")
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, {
    message: "password_too_long",
  });

/**
 * Trim and lower-case BEFORE checking the format, not after.
 *
 * The other order rejects "  user@example.com " as a malformed address — a
 * trailing space from a paste or a phone keyboard, which the user cannot see
 * and would have no idea how to fix. Lower-casing also means the same address
 * cannot be registered twice in two different cases.
 */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("email_invalid").max(254, "email_invalid"));

export const loginSchema = z.object({
  email,
  // Deliberately NOT the `password` schema. Sign-in must accept whatever the
  // account was created with; tightening the rules later would otherwise lock
  // existing users out of their own accounts.
  password: z.string().min(1, "password_required"),
});

export const registerSchema = z.object({ email, password });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

export const displayNameSchema = z.object({
  // An empty field means "clear it", which is different from "leave it alone".
  displayName: z.string().trim().max(60, "display_name_too_long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
