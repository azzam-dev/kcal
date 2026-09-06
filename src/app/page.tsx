import { Button, Card } from "@/components/ui";
import { getMessages } from "@/i18n";

/**
 * Holding page for Phase 01.
 *
 * The call to action is disabled rather than linked: /register does not exist
 * until Phase 02, and a button that 404s is worse than one that says why it is
 * not ready yet. It gets its href when the screen behind it exists.
 */
export default function HomePage() {
  const t = getMessages();

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium tracking-wide text-accent">{t("app.name")}</p>

      <h1 className="text-3xl font-semibold leading-tight text-balance sm:text-4xl">
        {t("home.heading")}
      </h1>

      <p className="mt-4 max-w-prose leading-relaxed text-ink-muted">{t("home.body")}</p>

      <Card className="mt-10">
        <Button disabled>{t("home.cta")}</Button>
        <p className="nums mt-4 text-sm text-ink-faint">
          {t("home.buildStatus", { phase: 1, total: 12 })}
        </p>
      </Card>
    </main>
  );
}
