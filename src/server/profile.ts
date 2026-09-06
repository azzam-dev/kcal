import { createClient } from "@/lib/supabase/server";

/**
 * Data access for `profiles`. Queries only — no business rules, no formatting.
 *
 * Note the absence of any `where user_id = …` filter for authorisation: RLS
 * scopes every one of these to the caller's own row inside Postgres. Adding an
 * app-level filter here would read as if it were the protection, and would then
 * be the thing someone "cleans up" one day.
 */

export type Profile = {
  displayName: string | null;
  onboardedAt: string | null;
};

export async function getOwnProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, onboarded_at")
    .maybeSingle();

  if (error) {
    console.error("[profile:read]", error);
    return null;
  }

  if (!data) return null;

  return {
    displayName: data.display_name,
    onboardedAt: data.onboarded_at,
  };
}
