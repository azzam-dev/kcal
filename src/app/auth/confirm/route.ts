import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the links the app emails. Exchanges the one-time credential
 * for a session, then forwards.
 *
 * Password recovery is the only one of those left — email confirmation is off,
 * so signing up no longer sends a link at all. This route stays because
 * `resetPasswordForEmail` points at it, and because it is what confirmation
 * would use again if it is ever switched back on.
 *
 * A Route Handler rather than a page because the exchange sets cookies, and a
 * Server Component cannot.
 *
 * It accepts BOTH shapes a Supabase email link can arrive in, because which one
 * you get is decided by an email template in the dashboard that this code
 * cannot see:
 *
 *   ?code=…                    Supabase's default template. The link goes to
 *                              `/auth/v1/verify` first, which consumes the
 *                              token and redirects here with a PKCE code.
 *   ?token_hash=…&type=…       The template rewritten to `{{ .TokenHash }}`,
 *                              which sends the user straight here.
 *
 * Handling only the second is what made every confirmation link in development
 * land on "الرابط انتهت صلاحيته": Supabase's own logs showed `GET /verify` 303
 * — the token verified fine — and then this route, finding no `token_hash`,
 * treated a perfectly good link as a dead one.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // `next` arrives from a link in an email — the least trustworthy place a URL
  // can come from — so it goes through the same sanitiser as any other one.
  const next = safeRedirectPath(searchParams.get("next"), "/profile");

  const supabase = await createClient();

  // One destination for every failure below. Distinguishing "no such token"
  // from "expired" would tell whoever is holding a stolen link which it is.
  const failed = (reason: string, detail?: unknown): never => {
    console.error(`[auth:confirm] ${reason}`, detail ?? "");
    redirect("/login?error=expired_link");
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failed("code exchange rejected", error);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) failed("token_hash rejected", error);
  } else {
    // Neither shape. Almost always a link that was opened twice — the first
    // open consumed the one-time token, and some mail clients open it for you
    // before you do.
    failed("link carried neither a code nor a token_hash");
  }

  redirect(next);
}
