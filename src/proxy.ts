import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

// Next 16 renamed the middleware convention to `proxy`. The file must sit at
// src/proxy.ts (or the project root) — anywhere else and it is simply not run,
// with no warning, and every protected route quietly loses its gate.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   _next/static, _next/image  — build output
     *   apple-icon  — the generated iOS touch icon, which has no extension
     *   favicon.ico, *.svg|png|jpg|webp|webmanifest  — static assets
     * Running the session refresh on those costs an auth round-trip per asset
     * and protects nothing.
     *
     * The manifest and the touch icon are on this list because a phone fetches
     * both while signed out, and the gate answers an ungated request with a
     * redirect to /login. Caught in the browser: /manifest.webmanifest served
     * the login page's HTML, which makes the app silently uninstallable —
     * nothing errors, the manifest is just never valid.
     */
    "/((?!_next/static|_next/image|apple-icon|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
