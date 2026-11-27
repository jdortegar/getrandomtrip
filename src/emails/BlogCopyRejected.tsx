import * as React from "react";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

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
    eyebrow: "Revisión de contenido",
    heading: "Cambios rechazados",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hola ${adminName}, ${tripperName} rechazó los cambios que propusiste para el artículo "${title}". El artículo volvió al estado borrador y el tripper podrá editarlo y volver a enviarlo para revisión.`,
    subtext:
      "Podés ponerte en contacto con el tripper para coordinar los cambios necesarios.",
  },
  en: {
    preview: (title: string) =>
      `The tripper rejected your changes for "${title}". The article is back to draft.`,
    eyebrow: "Content review",
    heading: "Changes Rejected",
    body: (adminName: string, tripperName: string, title: string) =>
      `Hi ${adminName}, ${tripperName} rejected the changes you proposed for the article "${title}". The article has returned to draft status and the tripper can edit and resubmit it for review.`,
    subtext:
      "You can reach out to the tripper to coordinate the necessary changes.",
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
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(adminName, tripperName, blogTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
    </EmailLayout>
  );
}
