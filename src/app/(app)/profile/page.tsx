import { redirect } from "next/navigation";

import { getMessages } from "@/i18n";
import { createClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/server/profile";

import { DeleteAccountCard } from "./delete-account-card";
import { DisplayNameForm } from "./display-name-form";

export default async function ProfilePage() {
  const t = getMessages();

  // Belt and braces: src/proxy.ts already gates this route. Keep this check on
  // every protected page anyway — the proxy is one config edit away from not
  // matching a path, and this is what makes that a redirect instead of a crash
  // on `user.email`.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getOwnProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted" dir="auto">
          {t("profile.signedInAs", { email: user.email ?? "" })}
        </p>
      </div>

      <DisplayNameForm initialValue={profile?.displayName ?? ""} />

      <DeleteAccountCard />
    </div>
  );
}
