import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface TravelerInviteProps {
  inviteUrl: string;
  buyerFirstName: string;
  locale: "es" | "en";
}

// Copy is gender-neutral by design (no "her"/"su" pronoun) — the buyer's
// gender is unknown at send time. ES leans on "te invitó a sumarte a su
// randomtrip" (possessive "su", not a gendered pronoun); EN uses "their".
const copy = {
  es: {
    preview: "Te invitaron a completar tus datos de viaje.",
    heading: "Te invitaron a un randomtrip",
    body: (buyerFirstName: string) =>
      `${buyerFirstName} te invitó a sumarte a su randomtrip. Completá tus datos de viaje para confirmar tu lugar.`,
    subtext: "Este enlace vence en 7 días.",
    cta: "COMPLETAR MIS DATOS",
  },
  en: {
    preview: "You've been invited to add your travel details.",
    heading: "You're invited to a randomtrip",
    body: (buyerFirstName: string) =>
      `${buyerFirstName} invited you to join their randomtrip. Add your travel details to confirm your spot.`,
    subtext: "This link expires in 7 days.",
    cta: "ADD MY DETAILS",
  },
};

export const subjects = {
  es: "Te invitaron a completar tus datos de viaje",
  en: "You've been invited to add your travel details",
};

export default function TravelerInvite({
  inviteUrl,
  buyerFirstName,
  locale,
}: TravelerInviteProps) {
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
