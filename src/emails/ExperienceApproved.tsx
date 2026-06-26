import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface ExperienceApprovedProps {
  tripper: string;
  experienceTitle: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "¡Tu experiencia fue aprobada! Ya está disponible en GetRandomtrip.",
    heading: "¡Felicitaciones!",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu experiencia "${title}" fue aprobada y ya está disponible para los viajeros en GetRandomtrip.`,
    subtext:
      "Los clientes ya pueden descubrirla y reservarla. ¡Gracias por compartir tu pasión por el viaje!",
    cta: "VER MIS EXPERIENCIAS",
  },
  en: {
    preview: "Your experience was approved! It's now live on GetRandomtrip.",
    heading: "Congratulations!",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your experience "${title}" has been approved and is now live for travelers on GetRandomtrip.`,
    subtext:
      "Clients can now discover and book it. Thank you for sharing your passion for travel!",
    cta: "VIEW MY EXPERIENCES",
  },
};

export const subjects = {
  es: "Tu experiencia fue aprobada",
  en: "Your experience was approved",
};

export default function ExperienceApproved({
  tripper,
  experienceTitle,
  locale,
}: ExperienceApprovedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/tripper/experiences`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(tripper, experienceTitle)}</Text>
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
