import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface ExperienceApprovedProps {
  tripper: string;
  experienceTitle: string;
  experienceId: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "¡Tu experiencia fue aprobada! Ya está disponible en Randomtrip.",
    eyebrow: "Tu catálogo",
    heading: "¡Felicitaciones!",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu experiencia "${title}" fue aprobada y ya está disponible para los viajeros en Randomtrip.`,
    subtext:
      "Los clientes ya pueden descubrirla y reservarla. ¡Gracias por compartir tu pasión por el viaje!",
    cta: "Ver mis experiencias",
  },
  en: {
    preview: "Your experience was approved! It's now live on Randomtrip.",
    eyebrow: "Your catalog",
    heading: "Congratulations!",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your experience "${title}" has been approved and is now live for travelers on Randomtrip.`,
    subtext:
      "Clients can now discover and book it. Thank you for sharing your passion for travel!",
    cta: "View my experiences",
  },
};

export const subjects = {
  es: "Tu experiencia fue aprobada",
  en: "Your experience was approved",
};

export default function ExperienceApproved({
  tripper,
  experienceTitle,
  experienceId,
  locale,
}: ExperienceApprovedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/tripper/experiences/${encodeURIComponent(experienceId)}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripper, experienceTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
