import { Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface AdminTripContactMessageProps {
  /** Raw admin-authored plain text, newlines intact. */
  body: string;
  locale: "es" | "en";
  /** Used for the <Preview> only — never rendered as the <Heading>. */
  subject: string;
}

const copy = {
  es: {
    heading: "Un mensaje del equipo",
  },
  en: {
    heading: "A message from the team",
  },
};

/** Generic fallback subject — the route always sends the admin's own subject instead. */
export const subjects = {
  es: "Un mensaje del equipo de GetRandomTrip",
  en: "A message from the GetRandomTrip team",
};

/** Splits raw text on newlines, trims each line, and drops blank lines. */
export function toParagraphs(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function AdminTripContactMessage({
  body,
  locale,
  subject,
}: AdminTripContactMessageProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={subject}>
      <Heading style={heading}>{c.heading}</Heading>
      {toParagraphs(body).map((paragraph, i) => (
        <Text key={i} style={bodyText}>
          {paragraph}
        </Text>
      ))}
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
  margin: "0 0 16px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "left",
};
