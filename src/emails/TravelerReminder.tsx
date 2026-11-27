import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
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
    eyebrow: "Recordatorio",
    heading: "Tu viaje te está esperando",
    body: (buyerFirstName: string) =>
      `${buyerFirstName.trim() ? `${buyerFirstName.trim()} te sumó a su randomtrip` : "Te sumaron a un randomtrip"} y todavía no lo viste.`,
    datesLabel: "Fechas",
    typeLabel: "Tipo de viaje",
    account:
      "Creá tu cuenta para ver el viaje en tu panel y confirmar tus datos.",
    subtext: "Este enlace vence en 7 días.",
    cta: "Ver mi viaje",
  },
  en: {
    eyebrow: "Reminder",
    heading: "Your trip is waiting for you",
    body: (buyerFirstName: string) =>
      `${buyerFirstName.trim() ? `${buyerFirstName.trim()} added you to their randomtrip` : "You've been added to a randomtrip"} and you haven't seen it yet.`,
    datesLabel: "Dates",
    typeLabel: "Trip type",
    account:
      "Create an account to see the trip in your dashboard and confirm your details.",
    subtext: "This link expires in 7 days.",
    cta: "See my trip",
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

  const details = [
    ...(dates ? [{ label: c.datesLabel, value: dates }] : []),
    ...(type ? [{ label: c.typeLabel, value: type }] : []),
  ];

  return (
    <EmailLayout locale={locale} preview={c.body(buyerFirstName)}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(buyerFirstName)}</EmailText>
      {details.length > 0 && <EmailDetailList items={details} />}
      <EmailText>{c.account}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={inviteUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
