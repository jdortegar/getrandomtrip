import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface ExperienceSubmittedProps {
  tripperName: string;
  experienceTitle: string;
  experienceId: string;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  preview: (title: string) =>
    `Nueva experiencia enviada para revisión: "${title}"`,
  heading: "Nueva experiencia para revisar",
  body: (tripperName: string, title: string) =>
    `El tripper ${tripperName} acaba de enviar la experiencia "${title}" para su revisión y publicación en GetRandomTrip.`,
  subtext:
    "Ingresá al panel de administración para revisar los detalles y aprobar o rechazar la experiencia.",
  cta: "REVISAR EXPERIENCIA",
};

export const subjects = {
  es: "Nueva experiencia enviada para revisión",
  en: "Nueva experiencia enviada para revisión",
};

export default function ExperienceSubmitted({
  tripperName,
  experienceTitle,
  experienceId,
}: ExperienceSubmittedProps) {
  const reviewUrl = `${BASE_URL}/es/admin/experiences/${experienceId}`;

  return (
    <EmailLayout locale="es" preview={copy.preview(experienceTitle)}>
      <Heading style={heading}>{copy.heading}</Heading>
      <Text style={bodyText}>{copy.body(tripperName, experienceTitle)}</Text>

      {/* Experience detail */}
      <Section style={detailPanel}>
        <Text style={detailRow}>
          <span style={detailLabel}>Tripper:</span>{" "}
          <span style={detailValue}>{tripperName}</span>
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Experiencia:</span>{" "}
          <span style={detailValue}>{experienceTitle}</span>
        </Text>
      </Section>

      <Text style={subtextStyle}>{copy.subtext}</Text>
      <Button href={reviewUrl} style={ctaButton}>
        {copy.cta}
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "38px",
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
  margin: "0 auto 24px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const detailPanel: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px 32px",
  margin: "0 auto 24px",
  maxWidth: "400px",
  textAlign: "left",
};

const detailRow: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#5A5858",
  fontFamily: "'Barlow', Arial, sans-serif",
};

const detailLabel: React.CSSProperties = {
  fontWeight: "700",
  color: "#111827",
};

const detailValue: React.CSSProperties = {
  fontWeight: "400",
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
