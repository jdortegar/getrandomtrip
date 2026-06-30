import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface TripCompletedProps {
  client: string;
  locale: "es" | "en";
  reviewToken: string;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "¡Tu viaje fue completado! Esperamos que haya sido increíble.",
    heading: "¡Viaje completado!",
    body: (client: string) =>
      `Hola ${client}, ¡tu aventura llegó a su fin! Esperamos que cada momento haya sido memorable y que hayas disfrutado al máximo tu experiencia Randomtrip.`,
    subtext:
      "Tu opinión nos importa mucho. ¿Qué tal si compartís tu experiencia con otros viajeros dejando una reseña?",
    cta: "DEJAR UNA RESEÑA",
  },
  en: {
    preview: "Your trip is complete! We hope it was incredible.",
    heading: "Trip completed!",
    body: (client: string) =>
      `Hi ${client}, your adventure has come to an end! We hope every moment was memorable and that you fully enjoyed your Randomtrip experience.`,
    subtext:
      "Your opinion matters to us. How about sharing your experience with other travelers by leaving a review?",
    cta: "LEAVE A REVIEW",
  },
};

export const subjects = {
  es: "¡Tu viaje fue completado!",
  en: "Your trip is complete!",
};

export default function TripCompleted({ client, locale, reviewToken }: TripCompletedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/review/${reviewToken}`;

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
