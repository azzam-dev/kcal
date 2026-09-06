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
     *   favicon.ico, *.svg|png|jpg|webp  — static assets
     * Running the session refresh on those costs an auth round-trip per asset
     * and protects nothing.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
