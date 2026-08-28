import { Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

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
    heading: "Nuevo mensaje del formulario de contacto",
    name: "Nombre",
    email: "Email",
    interest: "Interés",
    message: "Mensaje",
    attachment: "Adjunto",
    preview: "Nuevo mensaje del formulario de contacto",
  },
  en: {
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
      <Heading style={heading}>{c.heading}</Heading>

      <Text style={fieldText}>
        <strong>{c.name}:</strong> {name}
      </Text>
      <Text style={fieldText}>
        <strong>{c.email}:</strong> <Link href={`mailto:${email}`}>{email}</Link>
      </Text>
      <Text style={fieldText}>
        <strong>{c.interest}:</strong> {interest}
      </Text>

      <Text style={{ ...fieldText, marginTop: "20px" }}>
        <strong>{c.message}:</strong>
      </Text>
      <Section style={messageBox}>
        <Text style={messageText}>{message}</Text>
      </Section>

      {attachmentName && (
        <Text style={{ ...fieldText, marginTop: "20px" }}>
          <strong>{c.attachment}:</strong> {attachmentName}
        </Text>
      )}
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "32px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 24px",
  lineHeight: "1.15",
  textAlign: "left",
};

const fieldText: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 0 8px",
  lineHeight: "1.6",
  textAlign: "left",
};

const messageBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "14px",
  margin: "8px 0 0",
};

const messageText: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0",
  lineHeight: "1.6",
  textAlign: "left",
  whiteSpace: "pre-wrap",
};
