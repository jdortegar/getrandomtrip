import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BlogPendingTripperReviewProps {
  tripperName: string;
  blogTitle: string;
  changedFields: string[];
  reviewUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: (title: string) =>
      `El admin propuso cambios para tu artículo "${title}". Revisalos ahora.`,
    heading: "Revisión de artículo",
    body: (tripperName: string, title: string) =>
      `Hola ${tripperName}, el equipo de Randomtrip revisó tu artículo "${title}" y tiene cambios propuestos para que los revises.`,
    changedFieldsLabel: "Campos modificados:",
    subtext:
      "Podés aprobar o rechazar los cambios desde tu panel de tripper. Si rechazás, el artículo vuelve a estado borrador para que lo edites.",
    cta: "REVISAR CAMBIOS",
  },
  en: {
    preview: (title: string) =>
      `Admin proposed changes for your article "${title}". Review them now.`,
    heading: "Article Review",
    body: (tripperName: string, title: string) =>
      `Hi ${tripperName}, the Randomtrip team reviewed your article "${title}" and has proposed some changes for your review.`,
    changedFieldsLabel: "Modified fields:",
    subtext:
      "You can approve or reject the changes from your tripper dashboard. If you reject, the article returns to draft status for you to edit.",
    cta: "REVIEW CHANGES",
  },
};

export const subjects = {
  es: "El admin propuso cambios en tu artículo",
  en: "Admin proposed changes to your article",
};

export default function BlogPendingTripperReview({
  tripperName,
  blogTitle,
  changedFields,
  reviewUrl,
  locale,
}: BlogPendingTripperReviewProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview(blogTitle)}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(tripperName, blogTitle)}</Text>
      {changedFields.length > 0 && (
        <Text style={changedFieldsText}>
          {c.changedFieldsLabel} {changedFields.join(", ")}
        </Text>
      )}
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={reviewUrl} style={ctaButton}>
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

const changedFieldsText: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "600",
  margin: "0 auto 16px",
  lineHeight: "1.6",
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
