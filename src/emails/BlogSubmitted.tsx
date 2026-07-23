import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BlogSubmittedProps {
  tripperName: string;
  blogTitle: string;
  blogId: string;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  preview: (title: string) =>
    `Nuevo artículo enviado para revisión: "${title}"`,
  heading: "Nuevo artículo para revisar",
  body: (tripperName: string, title: string) =>
    `El tripper ${tripperName} acaba de enviar el artículo "${title}" para su revisión y publicación en Randomtrip.`,
  subtext:
    "Ingresá al panel de administración para revisar los detalles y aprobar o rechazar el artículo.",
  cta: "REVISAR ARTÍCULO",
};

export const subjects = {
  es: "Nuevo artículo enviado para revisión",
  en: "Nuevo artículo enviado para revisión",
};

export default function BlogSubmitted({
  tripperName,
  blogTitle,
  blogId,
}: BlogSubmittedProps) {
  const reviewUrl = `${BASE_URL}/es/dashboard/admin/blog/${blogId}`;

  return (
    <EmailLayout locale="es" preview={copy.preview(blogTitle)}>
      <Heading style={heading}>{copy.heading}</Heading>
      <Text style={bodyText}>{copy.body(tripperName, blogTitle)}</Text>

      <Section style={detailPanel}>
        <Text style={detailRow}>
          <span style={detailLabel}>Tripper:</span>{" "}
          <span style={detailValue}>{tripperName}</span>
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Artículo:</span>{" "}
          <span style={detailValue}>{blogTitle}</span>
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
