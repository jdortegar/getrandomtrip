import { Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BlogCopyApprovedProps {
  adminName: string;
  blogTitle: string;
  tripperName: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: (title: string) =>
      `El tripper aprobó tus cambios para "${title}". El artículo ya está publicado.`,
    heading: "¡Cambios aprobados!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} aprobó los cambios que propusiste para el artículo "${title}". El artículo ya está publicado en Randomtrip.`,
    subtext: "Los lectores ya pueden descubrir este artículo.",
  },
  en: {
    preview: (title: string) =>
      `The tripper approved your changes for "${title}". The article is now live.`,
    heading: "Changes Approved!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hi ${adminName}, ${tripperName} approved the changes you proposed for the article "${title}". The article is now live on Randomtrip.`,
    subtext: "Readers can now discover this article.",
  },
};

export const subjects = {
  es: "El tripper aprobó tus cambios",
  en: "Tripper approved your changes",
};

export default function BlogCopyApproved({
  adminName,
  blogTitle,
  tripperName,
  locale,
}: BlogCopyApprovedProps) {
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
