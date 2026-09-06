import { redirect } from "next/navigation";

import { getMessages } from "@/i18n";
import { createClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const t = getMessages();

  // Reaching this page means the recovery link already exchanged itself for a
  // session at /auth/confirm. Without one there is nothing to update, so send
  // the visitor back to ask for a fresh link rather than showing a form that
  // can only fail. This is the same belt-and-braces check every protected page
  // makes for itself, independent of the proxy.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=expired_link");

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.reset.title")}</h1>
      <ResetPasswordForm />
    </>
  );
}
