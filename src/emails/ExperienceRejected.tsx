import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

interface ExperienceRejectedProps {
  tripper: string;
  experienceTitle: string;
  experienceId: string;
  reviewNote: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Tu experiencia requiere ajustes antes de ser publicada.",
    eyebrow: "Tu catálogo",
    heading: "Experiencia en revisión",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu experiencia "${title}" requiere algunos ajustes antes de poder ser publicada en Randomtrip.`,
    subtext:
      "Revisá la nota del revisor a continuación, realizá los cambios necesarios y volvé a enviarla para su aprobación.",
    reviewNoteLabel: "Nota del revisor",
    cta: "Ver mis experiencias",
  },
  en: {
    preview:
      "Your experience needs some adjustments before it can be published.",
    eyebrow: "Your catalog",
    heading: "Experience needs review",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your experience "${title}" needs some adjustments before it can be published on Randomtrip.`,
    subtext:
      "Please review the note below, make the necessary changes, and resubmit it for approval.",
    reviewNoteLabel: "Reviewer note",
    cta: "View my experiences",
  },
};

export const subjects = {
  es: "Tu experiencia requiere ajustes",
  en: "Your experience needs adjustments",
};

export default function ExperienceRejected({
  tripper,
  experienceTitle,
  experienceId,
  reviewNote,
  locale,
}: ExperienceRejectedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/tripper/experiences/${encodeURIComponent(experienceId)}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripper, experienceTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailPanel label={c.reviewNoteLabel}>{reviewNote}</EmailPanel>
      <EmailButton href={ctaHref}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
