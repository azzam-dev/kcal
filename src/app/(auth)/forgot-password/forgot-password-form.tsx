"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Button, Field } from "@/components/ui";
import { getMessages } from "@/i18n";

import { requestPasswordReset, type AuthFormState } from "../actions";

const t = getMessages();

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {},
  );

  // The confirmation deliberately does not say whether an account exists — the
  // action returns the same notice either way. Hiding the form afterwards keeps
  // it that way visually too: a form that stays open invites a second attempt
  // that might read differently.
  if (state.noticeKey) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">{t(state.noticeKey)}</Alert>
        <Link href="/login" className="text-sm text-accent hover:opacity-80">
          {t("auth.forgot.backToLogin")}
        </Link>
      </div>
    );
  }

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

      <Button type="submit" full disabled={pending}>
        {pending ? t("auth.forgot.pending") : t("auth.forgot.submit")}
      </Button>

      <Link href="/login" className="text-sm text-accent hover:opacity-80">
        {t("auth.forgot.backToLogin")}
      </Link>
    </form>
  );
}
