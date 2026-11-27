import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

interface BlogRejectedProps {
  tripper: string;
  blogTitle: string;
  blogId: string;
  reviewNote: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Tu artículo requiere ajustes antes de ser publicado.",
    eyebrow: "Tu blog",
    heading: "Artículo en revisión",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu artículo "${title}" requiere algunos ajustes antes de poder ser publicado en Randomtrip.`,
    subtext:
      "Revisá la nota del revisor a continuación, realizá los cambios necesarios y volvé a enviarlo para su aprobación.",
    reviewNoteLabel: "Nota del revisor",
    cta: "Ver mis artículos",
  },
  en: {
    preview: "Your article needs some adjustments before it can be published.",
    eyebrow: "Your blog",
    heading: "Article needs review",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your article "${title}" needs some adjustments before it can be published on Randomtrip.`,
    subtext:
      "Please review the note below, make the necessary changes, and resubmit it for approval.",
    reviewNoteLabel: "Reviewer note",
    cta: "View my articles",
  },
};

export const subjects = {
  es: "Tu artículo requiere ajustes",
  en: "Your article needs adjustments",
};

export default function BlogRejected({
  tripper,
  blogTitle,
  blogId,
  reviewNote,
  locale,
}: BlogRejectedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/tripper/blog/${encodeURIComponent(blogId)}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripper, blogTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailPanel label={c.reviewNoteLabel}>{reviewNote}</EmailPanel>
      <EmailButton href={ctaHref}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
