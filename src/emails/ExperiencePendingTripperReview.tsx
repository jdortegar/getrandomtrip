import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

interface ExperiencePendingTripperReviewProps {
  tripperName: string;
  experienceTitle: string;
  changedFields: string[];
  reviewUrl: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: (title: string) =>
      `El admin propuso cambios para tu experiencia "${title}". Revisalos ahora.`,
    eyebrow: "Cambios propuestos",
    heading: "Revisión de experiencia",
    body: (tripperName: string, title: string) =>
      `Hola ${tripperName}, el equipo de Randomtrip revisó tu experiencia "${title}" y tiene cambios propuestos para que los revises.`,
    changedFieldsLabel: "Campos modificados",
    subtext:
      "Podés aprobar o rechazar los cambios desde tu panel de tripper. Si rechazás, la experiencia vuelve a estado borrador para que la edites.",
    cta: "Revisar cambios",
  },
  en: {
    preview: (title: string) =>
      `Admin proposed changes for your experience "${title}". Review them now.`,
    eyebrow: "Suggested changes",
    heading: "Experience Review",
    body: (tripperName: string, title: string) =>
      `Hi ${tripperName}, the Randomtrip team reviewed your experience "${title}" and has proposed some changes for your review.`,
    changedFieldsLabel: "Modified fields",
    subtext:
      "You can approve or reject the changes from your tripper dashboard. If you reject, the experience returns to draft status for you to edit.",
    cta: "Review changes",
  },
};

export const subjects = {
  es: "El admin propuso cambios en tu experiencia",
  en: "Admin proposed changes to your experience",
};

export default function ExperiencePendingTripperReview({
  tripperName,
  experienceTitle,
  changedFields,
  reviewUrl,
  locale,
}: ExperiencePendingTripperReviewProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview(experienceTitle)}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripperName, experienceTitle)}</EmailText>
      {changedFields.length > 0 && (
        <EmailPanel label={c.changedFieldsLabel}>{changedFields.join(", ")}</EmailPanel>
      )}
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={reviewUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
