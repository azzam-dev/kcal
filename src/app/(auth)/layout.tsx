import Link from "next/link";

import { getMessages } from "@/i18n";

/** Shared shell for every signed-out screen, so they cannot drift apart. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = getMessages();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Link
        href="/"
        className="self-start text-sm font-semibold tracking-wide text-accent hover:opacity-80"
      >
        {t("app.name")}
      </Link>
      {children}
    </main>
  );
}
