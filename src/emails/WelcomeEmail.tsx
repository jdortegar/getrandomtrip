import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface WelcomeEmailProps {
  name: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "¡Bienvenido/a a GetRandomtrip! Tu próxima aventura te espera.",
    heading: "¡Bienvenido/a!",
    body: (name: string) =>
      `Hola ${name}, estamos muy contentos de que te hayas unido a GetRandomtrip. Somos la plataforma donde el destino es siempre una sorpresa.`,
    subtext:
      "Configurá tu viaje, contanos qué tipo de experiencia buscás, y nosotros nos encargamos del resto. ¡La aventura está a un paso!",
    cta: "EMPEZAR A PLANIFICAR",
  },
  en: {
    preview: "Welcome to GetRandomtrip! Your next adventure awaits.",
    heading: "Welcome!",
    body: (name: string) =>
      `Hi ${name}, we're thrilled to have you join GetRandomtrip. We're the platform where the destination is always a surprise.`,
    subtext:
      "Set up your trip, tell us what kind of experience you're looking for, and we'll take care of the rest. Adventure is just one step away!",
    cta: "START PLANNING",
  },
};

export const subjects = {
  es: "¡Bienvenido/a a GetRandomtrip!",
  en: "Welcome to GetRandomtrip!",
};

export default function WelcomeEmail({ name, locale }: WelcomeEmailProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/journey`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(name)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={ctaHref} style={ctaButton}>
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
