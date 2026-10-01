import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";
import { formatTripDates, tripTypeLabel } from "./TravelerInvite";

interface TravelerReminderProps {
  inviteUrl: string;
  buyerFirstName: string;
  locale: "es" | "en";
  startDate?: Date | null;
  endDate?: Date | null;
  /** Raw trip type key (e.g. `group`, `xsed`). Never the destination. */
  tripType?: string | null;
}

// "See my trip" framing, mirroring TravelerInvite: a nudge to open the trip,
// not a paperwork request. Same gender-neutral constraint (no "her"/"su"
// pronoun referring to the buyer) and the same empty-name fallback.
const copy = {
  es: {
    heading: "Tu viaje te está esperando",
    body: (buyerFirstName: string) =>
      `${buyerFirstName.trim() ? `${buyerFirstName.trim()} te sumó a su randomtrip` : "Te sumaron a un randomtrip"} y todavía no lo viste.`,
    datesLabel: "Fechas",
    typeLabel: "Tipo de viaje",
    account:
      "Creá tu cuenta para ver el viaje en tu panel y confirmar tus datos.",
    subtext: "Este enlace vence en 7 días.",
    cta: "VER MI VIAJE",
  },
  en: {
    heading: "Your trip is waiting for you",
    body: (buyerFirstName: string) =>
      `${buyerFirstName.trim() ? `${buyerFirstName.trim()} added you to their randomtrip` : "You've been added to a randomtrip"} and you haven't seen it yet.`,
    datesLabel: "Dates",
    typeLabel: "Trip type",
    account:
      "Create an account to see the trip in your dashboard and confirm your details.",
    subtext: "This link expires in 7 days.",
    cta: "SEE MY TRIP",
  },
};

const subjects = {
  es: "Recordatorio: tu randomtrip te espera",
  en: "Reminder: your randomtrip is waiting",
};

export function getSubject(locale: "es" | "en"): string {
  return subjects[locale];
}

export default function TravelerReminder({
  inviteUrl,
  buyerFirstName,
  locale,
  startDate,
  endDate,
  tripType,
}: TravelerReminderProps) {
  const c = copy[locale];
  const dates = formatTripDates(startDate, endDate, locale);
  const type = tripTypeLabel(tripType, locale);

  return (
    <EmailLayout locale={locale} preview={c.body(buyerFirstName)}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(buyerFirstName)}</Text>
      {dates && (
        <Text style={detailText}>
          <strong>{c.datesLabel}:</strong> {dates}
        </Text>
      )}
      {type && (
        <Text style={detailText}>
          <strong>{c.typeLabel}:</strong> {type}
        </Text>
      )}
      <Text style={bodyText}>{c.account}</Text>
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

const detailText: React.CSSProperties = {
  ...bodyText,
  margin: "0 auto 8px",
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
