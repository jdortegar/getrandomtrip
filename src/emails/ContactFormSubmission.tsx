import { Link } from "@react-email/components";
import * as React from "react";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import { emailColors } from "./components/tokens";

interface ContactFormSubmissionProps {
  attachmentName?: string;
  email: string;
  interest: string;
  locale: "es" | "en";
  message: string;
  name: string;
}

const copy = {
  es: {
    eyebrow: "Bandeja de entrada",
    heading: "Nuevo mensaje del formulario de contacto",
    name: "Nombre",
    email: "Email",
    interest: "Interés",
    message: "Mensaje",
    attachment: "Adjunto",
    preview: "Nuevo mensaje del formulario de contacto",
  },
  en: {
    eyebrow: "Inbox",
    heading: "New contact form submission",
    name: "Name",
    email: "Email",
    interest: "Interest",
    message: "Message",
    attachment: "Attachment",
    preview: "New contact form submission",
  },
};

export default function ContactFormSubmission({
  attachmentName,
  email,
  interest,
  locale,
  message,
  name,
}: ContactFormSubmissionProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailDetailList
        items={[
          { label: c.name, value: name },
          {
            label: c.email,
            value: (
              <Link href={`mailto:${email}`} style={emailLink}>
                {email}
              </Link>
            ),
          },
          { label: c.interest, value: interest },
          ...(attachmentName
            ? [{ label: c.attachment, value: attachmentName }]
            : []),
        ]}
      />
      <EmailPanel label={c.message}>{message}</EmailPanel>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const emailLink: React.CSSProperties = {
  color: emailColors.primary,
  textDecoration: "underline",
};
