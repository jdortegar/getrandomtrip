import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Verificá tu email para activar tu cuenta de Randomtrip.",
    eyebrow: "Tu cuenta",
    heading: "Verificá tu email",
    body: (name: string) =>
      `Hola ${name}, gracias por sumarte a Randomtrip. Confirmá tu email para poder iniciar sesión.`,
    subtext: "Este enlace vence en 24 horas.",
    cta: "Verificar email",
  },
  en: {
    preview: "Verify your email to activate your Randomtrip account.",
    eyebrow: "Your account",
    heading: "Verify your email",
    body: (name: string) =>
      `Hi ${name}, thanks for joining Randomtrip. Confirm your email so you can sign in.`,
    subtext: "This link expires in 24 hours.",
    cta: "Verify email",
  },
};

export const subjects = {
  es: "Verificá tu email en Randomtrip",
  en: "Verify your email on Randomtrip",
};

export default function VerifyEmail({
  name,
  verifyUrl,
  locale,
}: VerifyEmailProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(name)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={verifyUrl}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
