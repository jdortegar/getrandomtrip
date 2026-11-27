import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface BlogSubmittedProps {
  tripperName: string;
  blogTitle: string;
  blogId: string;
}

const copy = {
  preview: (title: string) =>
    `Nuevo artículo enviado para revisión: "${title}"`,
  eyebrow: "Panel admin",
  heading: "Nuevo artículo para revisar",
  body: (tripperName: string, title: string) =>
    `El tripper ${tripperName} acaba de enviar el artículo "${title}" para su revisión y publicación en Randomtrip.`,
  subtext:
    "Ingresá al panel de administración para revisar los detalles y aprobar o rechazar el artículo.",
  cta: "Revisar artículo",
};

export const subjects = {
  es: "Nuevo artículo enviado para revisión",
  en: "Nuevo artículo enviado para revisión",
};

export default function BlogSubmitted({
  tripperName,
  blogTitle,
  blogId,
}: BlogSubmittedProps) {
  const reviewUrl = `${getApplicationOrigin()}/es/dashboard/admin/blog/${blogId}`;

  return (
    <EmailLayout locale="es" preview={copy.preview(blogTitle)}>
      <EmailHeading eyebrow={copy.eyebrow}>{copy.heading}</EmailHeading>
      <EmailText>{copy.body(tripperName, blogTitle)}</EmailText>
      <EmailDetailList
        items={[
          { label: "Tripper", value: tripperName },
          { label: "Artículo", value: blogTitle },
        ]}
      />
      <EmailText variant="note">{copy.subtext}</EmailText>
      <EmailButton href={reviewUrl}>{copy.cta}</EmailButton>
    </EmailLayout>
  );
}
