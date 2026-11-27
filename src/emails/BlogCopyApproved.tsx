import * as React from "react";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

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
    eyebrow: "Revisión de contenido",
    heading: "¡Cambios aprobados!",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} aprobó los cambios que propusiste para el artículo "${title}". El artículo ya está publicado en Randomtrip.`,
    subtext: "Los lectores ya pueden descubrir este artículo.",
  },
  en: {
    preview: (title: string) =>
      `The tripper approved your changes for "${title}". The article is now live.`,
    eyebrow: "Content review",
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
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(adminName, tripperName, blogTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
    </EmailLayout>
  );
}
