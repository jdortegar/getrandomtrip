import * as React from "react";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface AdminTripContactMessageProps {
  /** Raw admin-authored plain text, newlines intact. */
  body: string;
  locale: "es" | "en";
  /** Used for the <Preview> only — never rendered as the <Heading>. */
  subject: string;
}

const copy = {
  es: {
    eyebrow: "Tu viaje",
    heading: "Un mensaje del equipo",
  },
  en: {
    eyebrow: "Your trip",
    heading: "A message from the team",
  },
};

/** Generic fallback subject — the route always sends the admin's own subject instead. */
export const subjects = {
  es: "Un mensaje del equipo de GetRandomtrip",
  en: "A message from the GetRandomtrip team",
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
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      {toParagraphs(body).map((paragraph, i) => (
        <EmailText key={i}>{paragraph}</EmailText>
      ))}
    </EmailLayout>
  );
}
