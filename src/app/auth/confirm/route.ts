import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for every link the app emails: sign-up confirmation and
 * password recovery. Exchanges the one-time token for a session, then forwards.
 *
 * A Route Handler rather than a page because the exchange sets cookies, and a
 * Server Component cannot.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // `next` arrives from a link in an email — the least trustworthy place a URL
  // can come from — so it goes through the same sanitiser as any other one.
  const next = safeRedirectPath(searchParams.get("next"), "/profile");

  if (!tokenHash || !type) redirect("/login?error=expired_link");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("[auth:confirm]", error);
    // One destination for every failure. Distinguishing "no such token" from
    // "expired" would tell whoever is holding a stolen link which it is.
    redirect("/login?error=expired_link");
  }

  redirect(next);
}
