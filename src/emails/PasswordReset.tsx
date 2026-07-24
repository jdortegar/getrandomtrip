import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface PasswordResetProps {
  name: string;
  resetUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Restablecé tu contraseña de Randomtrip.",
    heading: "Restablecé tu contraseña",
    body: (name: string) =>
      `Hola ${name}, recibimos una solicitud para restablecer tu contraseña.`,
    subtext:
      "Este enlace vence en 1 hora y solo puede usarse una vez. Si vos no lo solicitaste, podés ignorar este email.",
    cta: "RESTABLECER CONTRASEÑA",
  },
  en: {
    preview: "Reset your Randomtrip password.",
    heading: "Reset your password",
    body: (name: string) =>
      `Hi ${name}, we received a request to reset your password.`,
    subtext:
      "This link expires in 1 hour and can only be used once. If you didn't request this, you can ignore this email.",
    cta: "RESET PASSWORD",
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
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(name)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={resetUrl} style={ctaButton}>
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
