import * as React from "react";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface ExperienceCopyApprovedProps {
  adminName: string;
  experienceTitle: string;
  tripperName: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: (title: string) =>
      `El tripper aprobó tus cambios para "${title}". La experiencia ya está activa.`,
    eyebrow: "Revisión de contenido",
    heading: "¡Cambios aprobados!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} aprobó los cambios que propusiste para la experiencia "${title}". La experiencia ya está activa en Randomtrip.`,
    subtext: "Los clientes ya pueden descubrir y reservar esta experiencia.",
  },
  en: {
    preview: (title: string) =>
      `The tripper approved your changes for "${title}". The experience is now live.`,
    eyebrow: "Content review",
    heading: "Changes Approved!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hi ${adminName}, ${tripperName} approved the changes you proposed for the experience "${title}". The experience is now live on Randomtrip.`,
    subtext: "Clients can now discover and book this experience.",
  },
};

export const subjects = {
  es: "El tripper aprobó tus cambios",
  en: "Tripper approved your changes",
};

export default function ExperienceCopyApproved({
  adminName,
  experienceTitle,
  tripperName,
  locale,
}: ExperienceCopyApprovedProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview(experienceTitle)}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>
        {c.body(adminName, tripperName, experienceTitle)}
      </EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
    </EmailLayout>
  );
}
