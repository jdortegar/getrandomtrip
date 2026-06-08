import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface TripCancelledProps {
  client: string;
  tripRequestId: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Tu viaje fue cancelado. Estamos aquí para ayudarte.",
    heading: "Viaje cancelado",
    body: (client: string) =>
      `Hola ${client}, lamentamos informarte que tu viaje fue cancelado. Entendemos que esto puede ser decepcionante.`,
    subtext:
      "Si tenés preguntas o necesitás asistencia, nuestro equipo de soporte está disponible para ayudarte.",
    cta: "CONTACTAR SOPORTE",
  },
  en: {
    preview: "Your trip has been cancelled. We're here to help.",
    heading: "Trip cancelled",
    body: (client: string) =>
      `Hi ${client}, we're sorry to inform you that your trip has been cancelled. We understand this can be disappointing.`,
    subtext:
      "If you have questions or need assistance, our support team is available to help you.",
    cta: "CONTACT SUPPORT",
  },
};

export const subjects = {
  es: "Tu viaje fue cancelado",
  en: "Your trip has been cancelled",
};

export default function TripCancelled({
  client,
  locale,
}: TripCancelledProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/contact`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(client)}</Text>
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
  color: "#3f3f3f",
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
