import Link from "next/link";

import { Card } from "@/components/ui";
import { getMessages } from "@/i18n";

export default function CheckEmailPage() {
  const t = getMessages();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.checkEmail.title")}</h1>
      <Card>
        <p className="leading-relaxed text-ink-muted">{t("auth.checkEmail.body")}</p>
      </Card>
      <Link href="/login" className="text-sm text-accent hover:opacity-80">
        {t("auth.forgot.backToLogin")}
      </Link>
    </>
  );
}
