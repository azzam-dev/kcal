import Link from "next/link";

import { Button } from "@/components/ui";
import { getMessages } from "@/i18n";

import { signOut } from "../(auth)/actions";

/** Shell for every signed-in screen. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = getMessages();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/profile" className="text-sm font-semibold tracking-wide text-accent">
            {t("app.name")}
          </Link>
          {/* A form, not a link: signing out changes state, and a GET that
              changes state can be triggered by any page that embeds the URL. */}
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
              {t("auth.logout")}
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
