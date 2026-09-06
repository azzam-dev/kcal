import { getMessages } from "@/i18n";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const t = getMessages();
  const { next, error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.login.title")}</h1>
      {/* `next` is passed straight through to the action, which sanitises it —
          this page never turns it into a link or a redirect itself. */}
      <LoginForm next={next} linkError={error === "expired_link"} />
    </>
  );
}
