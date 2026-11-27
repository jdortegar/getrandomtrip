import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

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
    eyebrow: "Cambios propuestos",
    heading: "Revisión de artículo",
    body: (tripperName: string, title: string) =>
      `Hola ${tripperName}, el equipo de Randomtrip revisó tu artículo "${title}" y tiene cambios propuestos para que los revises.`,
    changedFieldsLabel: "Campos modificados",
    subtext:
      "Podés aprobar o rechazar los cambios desde tu panel de tripper. Si rechazás, el artículo vuelve a estado borrador para que lo edites.",
    cta: "Revisar cambios",
  },
  en: {
    preview: (title: string) =>
      `Admin proposed changes for your article "${title}". Review them now.`,
    eyebrow: "Suggested changes",
    heading: "Article Review",
    body: (tripperName: string, title: string) =>
      `Hi ${tripperName}, the Randomtrip team reviewed your article "${title}" and has proposed some changes for your review.`,
    changedFieldsLabel: "Modified fields",
    subtext:
      "You can approve or reject the changes from your tripper dashboard. If you reject, the article returns to draft status for you to edit.",
    cta: "Review changes",
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
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripperName, blogTitle)}</EmailText>
      {changedFields.length > 0 && (
        <EmailPanel label={c.changedFieldsLabel}>{changedFields.join(", ")}</EmailPanel>
      )}
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={reviewUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
