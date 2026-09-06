import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Must be created per request — it closes over that request's cookies, so a
 * module-level singleton would serve one user's session to everybody.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. This is expected and safe to
          // swallow ONLY because src/proxy.ts refreshes the session on every
          // request, so the refreshed cookie is written there instead. Remove
          // that proxy and this catch starts silently dropping refreshes.
        }
      },
    },
  });
}
