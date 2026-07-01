import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface ExperienceRejectedProps {
  tripper: string;
  experienceTitle: string;
  reviewNote: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Tu experiencia requiere ajustes antes de ser publicada.",
    heading: "Experiencia en revisión",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu experiencia "${title}" requiere algunos ajustes antes de poder ser publicada en Randomtrip.`,
    subtext:
      "Revisá la nota del revisor a continuación, realizá los cambios necesarios y volvé a enviarla para su aprobación.",
    reviewNoteLabel: "Nota del revisor:",
    cta: "VER MIS EXPERIENCIAS",
  },
  en: {
    preview: "Your experience needs some adjustments before it can be published.",
    heading: "Experience needs review",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your experience "${title}" needs some adjustments before it can be published on Randomtrip.`,
    subtext:
      "Please review the note below, make the necessary changes, and resubmit it for approval.",
    reviewNoteLabel: "Reviewer note:",
    cta: "VIEW MY EXPERIENCES",
  },
};

export const subjects = {
  es: "Tu experiencia requiere ajustes",
  en: "Your experience needs adjustments",
};

export default function ExperienceRejected({
  tripper,
  experienceTitle,
  reviewNote,
  locale,
}: ExperienceRejectedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/tripper/experiences`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(tripper, experienceTitle)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>

      {/* Reviewer Note Panel */}
      <Section style={reviewNotePanel}>
        <Text style={reviewNoteLabel}>{c.reviewNoteLabel}</Text>
        <Text style={reviewNoteText}>{reviewNote}</Text>
      </Section>

      <Section style={ctaSection}>
        <Button href={ctaHref} style={ctaButton}>
          {c.cta}
        </Button>
      </Section>
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
  margin: "0 auto 0",
  lineHeight: "1.6",
  maxWidth: "400px",
  textAlign: "center",
};

const reviewNotePanel: React.CSSProperties = {
  backgroundColor: "#fdf9f9",
  padding: "24px 40px",
  margin: "0",
};

const reviewNoteLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#888",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const reviewNoteText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  lineHeight: "1.7",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "32px 40px",
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
