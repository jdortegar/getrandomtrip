import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface ReviewApprovedForTripperProps {
  dashboardUrl: string;
  excerpt: string;
  locale: "es" | "en";
  rating: number;
  tripperName: string;
}

const copy = {
  es: {
    preview: "Un cliente dejó una reseña sobre tu viaje. ¡Revisala ahora!",
    heading: "Nueva reseña",
    body: (tripperName: string) =>
      `Hola ${tripperName}, el equipo de Randomtrip revisó y aprobó una nueva reseña de uno de tus viajeros. Ya podés verla en tu panel y decidir si la publicás en tu perfil.`,
    excerpt: "Lo que escribió tu viajero:",
    stars: (n: number) => `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n}/5)`,
    cta: "VER MI RESEÑA",
  },
  en: {
    preview: "A client left a review about their trip. Check it out!",
    heading: "New review",
    body: (tripperName: string) =>
      `Hi ${tripperName}, the Randomtrip team reviewed and approved a new review from one of your travelers. You can now view it in your dashboard and choose whether to publish it on your profile.`,
    excerpt: "What your traveler wrote:",
    stars: (n: number) => `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n}/5)`,
    cta: "VIEW MY REVIEW",
  },
};

export const subjects = {
  es: "Tienes una nueva reseña aprobada",
  en: "You have a new approved review",
};

export default function ReviewApprovedForTripper({
  dashboardUrl,
  excerpt,
  locale,
  rating,
  tripperName,
}: ReviewApprovedForTripperProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(tripperName)}</Text>
      <Text style={starsText}>{c.stars(rating)}</Text>
      <Text style={excerptLabelText}>{c.excerpt}</Text>
      <Text style={excerptText}>&ldquo;{excerpt}&rdquo;</Text>
      <Button href={dashboardUrl} style={ctaButton}>
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

const starsText: React.CSSProperties = {
  color: "#f59e0b",
  fontSize: "18px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "700",
  margin: "0 auto 12px",
  textAlign: "center",
};

const excerptLabelText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "600",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  margin: "0 auto 8px",
  textAlign: "center",
};

const excerptText: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontStyle: "italic",
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
