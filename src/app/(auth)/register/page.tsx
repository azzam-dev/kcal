import { getMessages } from "@/i18n";

import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  const t = getMessages();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.register.title")}</h1>
      <RegisterForm />
    </>
  );
}
