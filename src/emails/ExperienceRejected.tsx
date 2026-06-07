import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

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
      `Hola ${tripper}, tu experiencia "${title}" requiere algunos ajustes antes de poder ser publicada en GetRandomTrip.`,
    subtext:
      "Revisá la nota del revisor a continuación, realizá los cambios necesarios y volvé a enviarla para su aprobación.",
    reviewNoteLabel: "Nota del revisor:",
    cta: "VER MIS EXPERIENCIAS",
    footer: "© 2026 RANDOMTRIP — Diseñamos tu viaje, vos elegís la aventura.",
  },
  en: {
    preview: "Your experience needs some adjustments before it can be published.",
    heading: "Experience needs review",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your experience "${title}" needs some adjustments before it can be published on GetRandomTrip.`,
    subtext:
      "Please review the note below, make the necessary changes, and resubmit it for approval.",
    reviewNoteLabel: "Reviewer note:",
    cta: "VIEW MY EXPERIENCES",
    footer: "© 2026 RANDOMTRIP — We design your trip, you choose the adventure.",
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
    <Html lang={locale}>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;700&display=swap"
        />
        <Font
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B43LT1Q.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v12/7cHpv4kjgoGqM7E3b8s8yn4.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{c.preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* ── Header ── */}
          <Section style={headerSection}>
            <Text style={headerTagline}>GETRANDOMTRIP</Text>
          </Section>

          {/* ── Main ── */}
          <Section style={mainSection}>
            <Heading style={heading}>{c.heading}</Heading>
            <Text style={bodyText}>{c.body(tripper, experienceTitle)}</Text>
            <Text style={subtextStyle}>{c.subtext}</Text>
          </Section>

          {/* ── Reviewer Note Panel ── */}
          <Section style={reviewNotePanel}>
            <Text style={reviewNoteLabel}>{c.reviewNoteLabel}</Text>
            <Text style={reviewNoteText}>{reviewNote}</Text>
          </Section>

          {/* ── CTA ── */}
          <Section style={ctaSection}>
            <Button href={ctaHref} style={ctaButton}>
              {c.cta}
            </Button>
          </Section>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Text style={footerText}>{c.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  margin: "0",
  padding: "0",
  fontFamily: "'Barlow', Arial, Helvetica, sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "600px",
  margin: "0 auto",
};

const headerSection: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  padding: "24px 40px",
  textAlign: "center",
};

const headerTagline: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#facc15",
  fontSize: "16px",
  fontWeight: "700",
  letterSpacing: "4px",
  textTransform: "uppercase",
  margin: "0",
};

const mainSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "48px 40px 32px",
  textAlign: "center",
};

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "38px",
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

const footerSection: React.CSSProperties = {
  marginTop: "20px",
  backgroundColor: "#ffffff",
  padding: "24px 32px 28px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#626262",
  fontSize: "9px",
  fontWeight: "400",
  letterSpacing: "1px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0",
  lineHeight: "1.5",
};
