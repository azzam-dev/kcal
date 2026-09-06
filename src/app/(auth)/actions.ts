"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MessageKey } from "@/i18n";
import { SITE_URL } from "@/lib/env";
import { authErrorKey } from "@/lib/errors";
import { safeRedirectPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { issueKey } from "@/lib/validation/messages";

/**
 * What every auth form gets back.
 *
 * One shape for success and failure so the form has one thing to render, and
 * only message KEYS cross this boundary — never a driver's error text.
 */
export type AuthFormState = {
  errorKey?: MessageKey;
  noticeKey?: MessageKey;
};

const DEFAULT_SIGNED_IN_PATH = "/profile";

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errorKey: issueKey(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { errorKey: authErrorKey(error, "auth:sign-in") };

  // The destination comes from the query string, so it is attacker-controlled
  // and has to be sanitised before it is followed.
  const next = safeRedirectPath(formData.get("next")?.toString(), DEFAULT_SIGNED_IN_PATH);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errorKey: issueKey(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) return { errorKey: authErrorKey(error, "auth:sign-up") };

  // Email confirmation is off, so signing up signs you in — there is no screen
  // between the form and the app, and nothing to resend.
  //
  // The guard is for the one state this code cannot see: "Confirm email" lives
  // in the Supabase dashboard, and if it is ever switched back on, Supabase
  // returns no session here. Redirecting anyway would bounce off the session
  // gate to /login with nothing explaining why, so say the true thing instead.
  // Everything that made that case a usable flow — the check-email screen and
  // its resend button — was removed on purpose; restore it from git history
  // rather than rebuilding it, before confirmation is turned back on.
  if (!data.session) {
    // Logged, because this branch is invisible otherwise: the user sees a
    // message about their inbox and the server says nothing at all, which is
    // exactly the state that is hard to diagnose from the outside.
    console.error("[auth:sign-up] no session returned — Confirm email is still on in Supabase");
    return { errorKey: "error.emailNotConfirmed" };
  }

  revalidatePath("/", "layout");
  redirect(DEFAULT_SIGNED_IN_PATH);
}

export async function requestPasswordReset(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) return { errorKey: issueKey(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/reset-password`,
  });

  // Same answer whether or not the address has an account, and no redirect that
  // would differ between the two. Anything else turns this form into a way to
  // ask "is this person a user of a calorie tracker?" — which it should not be
  // possible to find out. Rate-limit errors are the one exception worth showing,
  // because the user needs to know to wait.
  if (error) {
    const key = authErrorKey(error, "auth:reset-request");
    if (key === "error.rateLimited") return { errorKey: key };
  }

  return { noticeKey: "auth.forgot.sent" };
}

export async function setNewPassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) return { errorKey: issueKey(parsed.error.issues) };

  const supabase = await createClient();

  // updateUser acts on the session created by the recovery link. Without one
  // Supabase rejects it, so an expired or missing link cannot change a password.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { errorKey: authErrorKey(error, "auth:reset-complete") };

  revalidatePath("/", "layout");
  redirect(DEFAULT_SIGNED_IN_PATH);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
