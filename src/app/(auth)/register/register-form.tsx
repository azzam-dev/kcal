"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Button, Field } from "@/components/ui";
import { getMessages } from "@/i18n";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

import { signUp, type AuthFormState } from "../actions";

const t = getMessages();

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.errorKey ? <Alert>{t(state.errorKey)}</Alert> : null}

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
        autoComplete="new-password"
        hint={t("auth.passwordHint")}
        // Stops the shortest mistakes before a round trip. The rule that counts
        // is the one in the schema on the server; this is only a courtesy.
        minLength={PASSWORD_MIN_LENGTH}
        required
      />

      <Button type="submit" full disabled={pending}>
        {pending ? t("auth.register.pending") : t("auth.register.submit")}
      </Button>

      <p className="text-sm text-ink-muted">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="text-accent hover:opacity-80">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </form>
  );
}
