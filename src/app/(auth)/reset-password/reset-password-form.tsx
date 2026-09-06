"use client";

import { useActionState } from "react";

import { Alert, Button, Field } from "@/components/ui";
import { getMessages } from "@/i18n";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

import { setNewPassword, type AuthFormState } from "../actions";

const t = getMessages();

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    setNewPassword,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.errorKey ? <Alert>{t(state.errorKey)}</Alert> : null}

      <Field
        label={t("auth.reset.newPassword")}
        name="password"
        type="password"
        autoComplete="new-password"
        hint={t("auth.passwordHint")}
        minLength={PASSWORD_MIN_LENGTH}
        required
      />

      <Button type="submit" full disabled={pending}>
        {pending ? t("auth.reset.pending") : t("auth.reset.submit")}
      </Button>
    </form>
  );
}
