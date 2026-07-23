import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BlogApprovedProps {
  tripper: string;
  blogTitle: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "¡Tu artículo fue aprobado! Ya está disponible en Randomtrip.",
    heading: "¡Felicitaciones!",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu artículo "${title}" fue aprobado y ya está disponible para los viajeros en Randomtrip.`,
    subtext:
      "Los lectores ya pueden descubrirlo. ¡Gracias por compartir tu pasión por el viaje!",
    cta: "VER MIS ARTÍCULOS",
  },
  en: {
    preview: "Your article was approved! It's now live on Randomtrip.",
    heading: "Congratulations!",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your article "${title}" has been approved and is now live for readers on Randomtrip.`,
    subtext: "Readers can now discover it. Thank you for sharing your passion for travel!",
    cta: "VIEW MY ARTICLES",
  },
};

export const subjects = {
  es: "Tu artículo fue aprobado",
  en: "Your article was approved",
};

export default function BlogApproved({ tripper, blogTitle, locale }: BlogApprovedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/tripper/blog`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(tripper, blogTitle)}</Text>
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
