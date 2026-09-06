import Link from "next/link";

import { getMessages } from "@/i18n";

export default function HomePage() {
  const t = getMessages();

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold tracking-wide text-accent">{t("app.name")}</p>

      <h1 className="text-3xl font-semibold leading-tight text-balance sm:text-4xl">
        {t("home.heading")}
      </h1>

      <p className="mt-4 max-w-prose leading-relaxed text-ink-muted">{t("home.body")}</p>

      <div className="mt-10 flex flex-col items-start gap-4">
        {/* A link, not the Button primitive: this navigates, and a real anchor
            is what gives middle-click, open-in-new-tab and copy-link. */}
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/90"
        >
          {t("home.cta")}
        </Link>

        <Link href="/login" className="text-sm text-ink-muted hover:text-ink">
          {t("home.signIn")}
        </Link>
      </div>
    </main>
  );
}
