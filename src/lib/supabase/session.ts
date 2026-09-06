import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Routes reachable without a session.
 *
 * Matched EXACTLY, not by prefix. Prefix matching would make every future
 * child route public too — `/register/anything` would open without a session
 * the moment such a page is added. Add each public route explicitly.
 */
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/register/check-email",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm",
]);

/**
 * Refreshes the auth cookie and redirects unauthenticated requests to /login.
 *
 * This is a convenience gate, not the security boundary: it stops a signed-out
 * visitor from loading a page shell. The actual protection is row-level
 * security in Postgres plus the `getUser()` check every protected page makes
 * for itself.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), not getSession(). getSession() trusts the cookie as-is; getUser()
  // verifies it with the auth server, so a forged or expired cookie cannot walk
  // past this gate.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !PUBLIC_ROUTES.has(request.nextUrl.pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Where they were headed, so sign-in can return them there. Kept as a
    // path-only value; see safeRedirectPath in src/lib/redirect.ts for why.
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}
