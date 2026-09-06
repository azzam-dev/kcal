"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Button, Field } from "@/components/ui";
import { getMessages } from "@/i18n";

import { signIn, type AuthFormState } from "../actions";

const t = getMessages();

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signIn, {});

  // An expired confirmation link lands here. It is not a failure of this form,
  // so it is shown until the user submits and gets a fresher answer.
  const errorKey = state.errorKey ?? (linkError ? "error.expiredLink" : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {errorKey ? <Alert>{t(errorKey)}</Alert> : null}

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        dir="ltr"
        required
      />

      <Field
        label={t("auth.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" full disabled={pending}>
        {pending ? t("auth.login.pending") : t("auth.login.submit")}
      </Button>

      <div className="flex flex-col gap-2 text-sm text-ink-muted">
        <Link href="/forgot-password" className="text-accent hover:opacity-80">
          {t("auth.login.forgot")}
        </Link>
        <p>
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-accent hover:opacity-80">
            {t("auth.login.createOne")}
          </Link>
        </p>
      </div>
    </form>
  );
}
