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
  /** Individually paid trips: the companion's share and pay-by time, pre-formatted. */
  /** `maxTopUp` is the most they may owe on top of it if others drop out; null = nothing can rise. */
  share?: { amount: string; deadline: string; maxTopUp: string | null } | null;
}

// Copy is gender-neutral by design (no "her"/"su" pronoun) — the buyer's
// gender is unknown at send time. ES leans on "te sumó a su randomtrip"
// (possessive "su", not a gendered pronoun); EN uses "their". An empty buyer
// name falls back to a name-less sentence so no subject/body starts blank.
const copy = {
  es: {
    heading: "Te sumaron a un randomtrip",
    body: (buyerFirstName: string) =>
      buyerFirstName.trim()
        ? `${buyerFirstName.trim()} te sumó a su randomtrip.`
        : "Te sumaron a un randomtrip.",
    datesLabel: "Fechas",
    typeLabel: "Tipo de viaje",
    account:
      "Creá tu cuenta para ver el viaje en tu panel y confirmar tus datos.",
    subtext: "Este enlace vence en 7 días.",
    cta: "VER MI VIAJE",
    shareLabel: "Tu parte",
    shareDeadline: (deadline: string) =>
      `Paga tu parte antes del ${deadline}. Si no pagas a tiempo, el viaje sigue sin ti.`,
    shareAdjust: (maxTopUp: string | null) =>
      maxTopUp
        ? `Si alguien del grupo no paga a tiempo, no viaja y el viaje se ajusta a quienes pagaron. Los extras compartidos se reparten de nuevo, así que podrías pagar hasta ${maxTopUp} más.`
        : "Si alguien del grupo no paga a tiempo, no viaja y el viaje se ajusta a quienes pagaron.",
  },
  en: {
    heading: "You've been added to a randomtrip",
    body: (buyerFirstName: string) =>
      buyerFirstName.trim()
        ? `${buyerFirstName.trim()} added you to their randomtrip.`
        : "You've been added to a randomtrip.",
    datesLabel: "Dates",
    typeLabel: "Trip type",
    account:
      "Create an account to see the trip in your dashboard and confirm your details.",
    subtext: "This link expires in 7 days.",
    cta: "SEE MY TRIP",
    shareLabel: "Your share",
    shareDeadline: (deadline: string) =>
      `Pay your share before ${deadline}. If you don't pay in time, the trip goes on without you.`,
    shareAdjust: (maxTopUp: string | null) =>
      maxTopUp
        ? `If someone in the group doesn't pay in time, they won't travel and the trip is adjusted to those who paid. Shared extras are split again, so you could pay up to ${maxTopUp} more.`
        : "If someone in the group doesn't pay in time, they won't travel and the trip is adjusted to those who paid.",
  },
};

export function getSubject(
  locale: "es" | "en",
  buyerFirstName: string,
): string {
  return copy[locale].body(buyerFirstName).replace(/\.$/, "");
}

export function formatTripDates(
  start: Date | null | undefined,
  end: Date | null | undefined,
  locale: "es" | "en",
): string | null {
  const first = start ?? end;
  if (!first) return null;
  const formatter = new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "es-AR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
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
  share,
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
      {share && (
        <>
          <Text style={detailText}>
            <strong>{c.shareLabel}:</strong> {share.amount}
          </Text>
          <Text style={bodyText}>{c.shareDeadline(share.deadline)}</Text>
          <Text style={bodyText}>{c.shareAdjust(share.maxTopUp)}</Text>
        </>
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
  color: "#383838", // Ink
  margin: "0 0 24px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const bodyText: React.CSSProperties = {
  color: "#383838", // Ink
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
  color: "#383838", // Ink
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 32px",
  lineHeight: "1.6",
  maxWidth: "400px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#E5A51C", // Ochre (brand feature/CTA)
  color: "#383838", // Ink
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
