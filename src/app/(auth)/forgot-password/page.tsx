import { getMessages } from "@/i18n";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  const t = getMessages();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.forgot.title")}</h1>
      <p className="text-sm text-ink-muted">{t("auth.forgot.body")}</p>
      <ForgotPasswordForm />
    </>
  );
}
