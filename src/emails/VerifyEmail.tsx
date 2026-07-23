import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Verificá tu email para activar tu cuenta de Randomtrip.",
    heading: "Verificá tu email",
    body: (name: string) =>
      `Hola ${name}, gracias por sumarte a Randomtrip. Confirmá tu email para poder iniciar sesión.`,
    subtext: "Este enlace vence en 24 horas.",
    cta: "VERIFICAR EMAIL",
  },
  en: {
    preview: "Verify your email to activate your Randomtrip account.",
    heading: "Verify your email",
    body: (name: string) =>
      `Hi ${name}, thanks for joining Randomtrip. Confirm your email so you can sign in.`,
    subtext: "This link expires in 24 hours.",
    cta: "VERIFY EMAIL",
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
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(name)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={verifyUrl} style={ctaButton}>
        {c.cta}
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "42px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 24px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const bodyText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 16px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const subtextStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 32px",
  lineHeight: "1.6",
  maxWidth: "400px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#facc15",
  color: "#1f2937",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  lineHeight: "24px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "2px",
  display: "inline-block",
};
