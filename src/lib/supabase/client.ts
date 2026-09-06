import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Supabase client for Client Components. Never import this from server code.
 *
 * Typed with the generated `Database`, so a column that does not exist is a
 * compile error rather than `undefined` at runtime. Regenerate after every
 * migration: `npm run db:types`.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
