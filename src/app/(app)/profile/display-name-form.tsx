"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Field } from "@/components/ui";
import { getMessages } from "@/i18n";

import { updateDisplayName, type ProfileFormState } from "./actions";

const t = getMessages();

export function DisplayNameForm({ initialValue }: { initialValue: string }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateDisplayName,
    {},
  );

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {state.errorKey ? <Alert>{t(state.errorKey)}</Alert> : null}
        {state.noticeKey ? <Alert tone="success">{t(state.noticeKey)}</Alert> : null}

        <Field
          label={t("profile.displayName")}
          name="displayName"
          defaultValue={initialValue}
          hint={t("profile.displayNameHint")}
          maxLength={60}
          autoComplete="nickname"
        />

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? t("profile.pending") : t("profile.save")}
        </Button>
      </form>
    </Card>
  );
}
