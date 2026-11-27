import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface PasswordResetProps {
  name: string;
  resetUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Restablecé tu contraseña de Randomtrip.",
    eyebrow: "Tu cuenta",
    heading: "Restablecé tu contraseña",
    body: (name: string) =>
      `Hola ${name}, recibimos una solicitud para restablecer tu contraseña.`,
    subtext:
      "Este enlace vence en 1 hora y solo puede usarse una vez. Si vos no lo solicitaste, podés ignorar este email.",
    cta: "Restablecer contraseña",
  },
  en: {
    preview: "Reset your Randomtrip password.",
    eyebrow: "Your account",
    heading: "Reset your password",
    body: (name: string) =>
      `Hi ${name}, we received a request to reset your password.`,
    subtext:
      "This link expires in 1 hour and can only be used once. If you didn't request this, you can ignore this email.",
    cta: "Reset password",
  },
};

export const subjects = {
  es: "Restablecé tu contraseña de Randomtrip",
  en: "Reset your Randomtrip password",
};

export default function PasswordReset({
  name,
  resetUrl,
  locale,
}: PasswordResetProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(name)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={resetUrl}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
