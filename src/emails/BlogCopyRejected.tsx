import { Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BlogCopyRejectedProps {
  adminName: string;
  blogTitle: string;
  tripperName: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: (title: string) =>
      `El tripper rechazó tus cambios para "${title}". El artículo volvió a borrador.`,
    heading: "Cambios rechazados",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} rechazó los cambios que propusiste para el artículo "${title}". El artículo volvió al estado borrador y el tripper podrá editarlo y volver a enviarlo para revisión.`,
    subtext: "Podés ponerte en contacto con el tripper para coordinar los cambios necesarios.",
  },
  en: {
    preview: (title: string) =>
      `The tripper rejected your changes for "${title}". The article is back to draft.`,
    heading: "Changes Rejected",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hi ${adminName}, ${tripperName} rejected the changes you proposed for the article "${title}". The article has returned to draft status and the tripper can edit and resubmit it for review.`,
    subtext: "You can reach out to the tripper to coordinate the necessary changes.",
  },
};

export const subjects = {
  es: "El tripper rechazó tus cambios",
  en: "Tripper rejected your changes",
};

export default function BlogCopyRejected({
  adminName,
  blogTitle,
  tripperName,
  locale,
}: BlogCopyRejectedProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview(blogTitle)}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(adminName, tripperName, blogTitle)}</Text>
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
