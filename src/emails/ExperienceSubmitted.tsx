import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface ExperienceSubmittedProps {
  tripperName: string;
  experienceTitle: string;
  experienceId: string;
}

const copy = {
  preview: (title: string) =>
    `Nueva experiencia enviada para revisión: "${title}"`,
  eyebrow: "Panel admin",
  heading: "Nueva experiencia para revisar",
  body: (tripperName: string, title: string) =>
    `El tripper ${tripperName} acaba de enviar la experiencia "${title}" para su revisión y publicación en Randomtrip.`,
  subtext:
    "Ingresá al panel de administración para revisar los detalles y aprobar o rechazar la experiencia.",
  cta: "Revisar experiencia",
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
  const reviewUrl = `${getApplicationOrigin()}/es/dashboard/admin/experiences/${experienceId}`;

  return (
    <EmailLayout locale="es" preview={copy.preview(experienceTitle)}>
      <EmailHeading eyebrow={copy.eyebrow}>{copy.heading}</EmailHeading>
      <EmailText>{copy.body(tripperName, experienceTitle)}</EmailText>
      <EmailDetailList
        items={[
          { label: "Tripper", value: tripperName },
          { label: "Experiencia", value: experienceTitle },
        ]}
      />
      <EmailText variant="note">{copy.subtext}</EmailText>
      <EmailButton href={reviewUrl}>{copy.cta}</EmailButton>
    </EmailLayout>
  );
}
