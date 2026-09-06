"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Field } from "@/components/ui";
import { ar } from "@/i18n/ar";
import { getMessages } from "@/i18n";

import { deleteAccount, type ProfileFormState } from "./actions";

const t = getMessages();
const CONFIRM_WORD = ar["profile.delete.confirmWord"];

export function DeleteAccountCard() {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    deleteAccount,
    {},
  );

  return (
    <Card className="border-danger/30">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-danger">{t("profile.delete.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {t("profile.delete.body")}
          </p>
        </div>

        {state.errorKey ? <Alert>{t(state.errorKey)}</Alert> : null}

        <Field
          label={t("profile.delete.confirmLabel", { word: CONFIRM_WORD })}
          name="confirm"
          autoComplete="off"
          required
        />

        <Button type="submit" variant="danger" disabled={pending} className="self-start">
          {pending ? t("profile.delete.pending") : t("profile.delete.submit")}
        </Button>
      </form>
    </Card>
  );
}
