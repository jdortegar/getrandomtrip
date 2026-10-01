import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";
import { travelerTypeLabels } from "./TripStartVouchers";

interface TravelerInviteProps {
  inviteUrl: string;
  buyerFirstName: string;
  locale: "es" | "en";
  startDate?: Date | null;
  endDate?: Date | null;
  /** Raw trip type key (e.g. `group`, `xsed`). Never the destination. */
  tripType?: string | null;
}

// Copy is gender-neutral by design (no "her"/"su" pronoun) — the buyer's
// gender is unknown at send time. ES leans on "te sumó a su randomtrip"
// (possessive "su", not a gendered pronoun); EN uses "their".
const copy = {
  es: {
    heading: "Te sumaron a un randomtrip",
    body: (buyerFirstName: string) => `${buyerFirstName} te sumó a su randomtrip.`,
    datesLabel: "Fechas",
    typeLabel: "Tipo de viaje",
    account:
      "Creá tu cuenta para ver el viaje en tu panel y confirmar tus datos.",
    subtext: "Este enlace vence en 7 días.",
    cta: "VER MI VIAJE",
  },
  en: {
    heading: "You've been added to a randomtrip",
    body: (buyerFirstName: string) => `${buyerFirstName} added you to their randomtrip.`,
    datesLabel: "Dates",
    typeLabel: "Trip type",
    account:
      "Create an account to see the trip in your dashboard and confirm your details.",
    subtext: "This link expires in 7 days.",
    cta: "SEE MY TRIP",
  },
};

export function getSubject(locale: "es" | "en", buyerFirstName: string): string {
  return copy[locale].body(buyerFirstName).replace(/\.$/, "");
}

export function formatTripDates(
  start: Date | null | undefined,
  end: Date | null | undefined,
  locale: "es" | "en",
): string | null {
  const first = start ?? end;
  if (!first) return null;
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return formatter.formatRange(first, end ?? first);
}

export function tripTypeLabel(
  tripType: string | null | undefined,
  locale: "es" | "en",
): string | null {
  const key = tripType?.trim().toLowerCase();
  if (!key) return null;
  // Brand name is localized: es uses XSED, en uses TGIS.
  if (key === "xsed") return locale === "en" ? "TGIS" : "XSED";
  return travelerTypeLabels[locale][key] ?? null;
}

export default function TravelerInvite({
  inviteUrl,
  buyerFirstName,
  locale,
  startDate,
  endDate,
  tripType,
}: TravelerInviteProps) {
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
