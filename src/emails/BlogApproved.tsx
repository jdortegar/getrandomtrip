import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface BlogApprovedProps {
  tripper: string;
  blogTitle: string;
  blogId: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "¡Tu artículo fue aprobado! Ya está disponible en Randomtrip.",
    eyebrow: "Tu blog",
    heading: "¡Felicitaciones!",
    body: (tripper: string, title: string) =>
      `Hola ${tripper}, tu artículo "${title}" fue aprobado y ya está disponible para los viajeros en Randomtrip.`,
    subtext:
      "Los lectores ya pueden descubrirlo. ¡Gracias por compartir tu pasión por el viaje!",
    cta: "Ver mis artículos",
  },
  en: {
    preview: "Your article was approved! It's now live on Randomtrip.",
    eyebrow: "Your blog",
    heading: "Congratulations!",
    body: (tripper: string, title: string) =>
      `Hi ${tripper}, your article "${title}" has been approved and is now live for readers on Randomtrip.`,
    subtext:
      "Readers can now discover it. Thank you for sharing your passion for travel!",
    cta: "View my articles",
  },
};

export const subjects = {
  es: "Tu artículo fue aprobado",
  en: "Your article was approved",
};

export default function BlogApproved({
  tripper,
  blogTitle,
  blogId,
  locale,
}: BlogApprovedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/tripper/blog/${encodeURIComponent(blogId)}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripper, blogTitle)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
