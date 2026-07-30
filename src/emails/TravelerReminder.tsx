import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface TravelerReminderProps {
  inviteUrl: string;
  buyerFirstName: string;
  locale: "es" | "en";
}

// Same gender-neutral copy constraint as TravelerInvite — no "her"/"su"
// pronoun referring to the buyer.
const copy = {
  es: {
    preview: "Recordatorio: completá tus datos de viaje.",
    heading: "Todavía te esperan en este randomtrip",
    body: (buyerFirstName: string) =>
      `Recordatorio para completar tus datos de viaje para el randomtrip de ${buyerFirstName} antes de la fecha límite.`,
    subtext: "Este enlace vence en 7 días.",
    cta: "COMPLETAR MIS DATOS",
  },
  en: {
    preview: "Reminder: complete your travel details.",
    heading: "You're still invited to this randomtrip",
    body: (buyerFirstName: string) =>
      `Friendly reminder to add your travel details for ${buyerFirstName}'s randomtrip before the deadline.`,
    subtext: "This link expires in 7 days.",
    cta: "ADD MY DETAILS",
  },
};

export const subjects = {
  es: "Recordatorio: completá tus datos de viaje",
  en: "Reminder: complete your travel details",
};

export default function TravelerReminder({
  inviteUrl,
  buyerFirstName,
  locale,
}: TravelerReminderProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(buyerFirstName)}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={inviteUrl} style={ctaButton}>
        {c.cta}
      </Button>
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

const ctaButton: React.CSSProperties = {
  backgroundColor: "#facc15",
  color: "#1f2937",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  lineHeight: "24px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "2px",
  display: "inline-block",
};
