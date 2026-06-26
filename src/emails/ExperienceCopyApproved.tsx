import { Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

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
    heading: "¡Cambios aprobados!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} aprobó los cambios que propusiste para la experiencia "${title}". La experiencia ya está activa en GetRandomtrip.`,
    subtext:
      "Los clientes ya pueden descubrir y reservar esta experiencia.",
  },
  en: {
    preview: (title: string) =>
      `The tripper approved your changes for "${title}". The experience is now live.`,
    heading: "Changes Approved!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hi ${adminName}, ${tripperName} approved the changes you proposed for the experience "${title}". The experience is now live on GetRandomtrip.`,
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
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(adminName, tripperName, experienceTitle)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
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
