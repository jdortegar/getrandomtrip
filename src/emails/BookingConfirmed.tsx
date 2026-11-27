import { getApplicationOrigin } from "@/lib/deployment";
import { Link, Text } from "@react-email/components";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import { emailColors, emailFonts } from "./components/tokens";

interface BookingConfirmedProps {
  client: string;
  tripRequestId: string;
  tripType: string;
  nights: number;
  departureDate?: string;
  receiptUrl?: string | null;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "¡Tu reserva está confirmada! Tu aventura comienza pronto.",
    eyebrow: "Tu viaje",
    heading: "¡Reserva confirmada!",
    body: (client: string) =>
      `Hola ${client}, tu reserva fue confirmada exitosamente. Estamos preparando todo para que tu experiencia sea increíble.`,
    tripLabel: "Tipo de viaje",
    nightsLabel: "Noches",
    departureDateLabel: "Fecha de salida",
    subtext:
      "Recibirás más detalles a medida que se acerque la fecha. ¡Gracias por confiar en Randomtrip!",
    cta: "Ver mi viaje",
    receiptLink: "Ver comprobante de pago",
  },
  en: {
    preview: "Your booking is confirmed! Your adventure starts soon.",
    eyebrow: "Your trip",
    heading: "Booking confirmed!",
    body: (client: string) =>
      `Hi ${client}, your booking has been successfully confirmed. We're preparing everything to make your experience incredible.`,
    tripLabel: "Trip type",
    nightsLabel: "Nights",
    departureDateLabel: "Departure date",
    subtext:
      "You'll receive more details as the date approaches. Thank you for trusting Randomtrip!",
    cta: "View my trip",
    receiptLink: "View payment receipt",
  },
};

export const subjects = {
  es: "¡Tu reserva está confirmada!",
  en: "Your booking is confirmed!",
};

export default function BookingConfirmed({
  client,
  tripRequestId,
  tripType,
  nights,
  departureDate,
  receiptUrl,
  locale,
}: BookingConfirmedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/trips/${encodeURIComponent(tripRequestId)}`;

  const details = [
    { label: c.tripLabel, value: tripType },
    { label: c.nightsLabel, value: nights },
    ...(departureDate
      ? [{ label: c.departureDateLabel, value: departureDate }]
      : []),
  ];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(client)}</EmailText>
      <EmailDetailList items={details} />
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>{c.cta}</EmailButton>
      {receiptUrl && (
        <Text style={receiptText}>
          <Link href={receiptUrl} style={receiptLink}>
            {c.receiptLink}
          </Link>
        </Text>
      )}
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const receiptText: React.CSSProperties = {
  margin: "0",
};

const receiptLink: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "underline",
};
