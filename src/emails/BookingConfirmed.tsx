import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface BookingConfirmedProps {
  client: string;
  tripRequestId: string;
  tripType: string;
  nights: number;
  departureDate?: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "¡Tu reserva está confirmada! Tu aventura comienza pronto.",
    heading: "¡Reserva confirmada!",
    body: (client: string) =>
      `Hola ${client}, tu reserva fue confirmada exitosamente. Estamos preparando todo para que tu experiencia sea increíble.`,
    tripLabel: "Tipo de viaje:",
    nightsLabel: "Noches:",
    departureDateLabel: "Fecha de salida:",
    subtext:
      "Recibirás más detalles a medida que se acerque la fecha. ¡Gracias por confiar en GetRandomTrip!",
    cta: "VER MI VIAJE",
  },
  en: {
    preview: "Your booking is confirmed! Your adventure starts soon.",
    heading: "Booking confirmed!",
    body: (client: string) =>
      `Hi ${client}, your booking has been successfully confirmed. We're preparing everything to make your experience incredible.`,
    tripLabel: "Trip type:",
    nightsLabel: "Nights:",
    departureDateLabel: "Departure date:",
    subtext:
      "You'll receive more details as the date approaches. Thank you for trusting GetRandomTrip!",
    cta: "VIEW MY TRIP",
  },
};

export const subjects = {
  es: "¡Tu reserva está confirmada!",
  en: "Your booking is confirmed!",
};

export default function BookingConfirmed({
  client,
  tripType,
  nights,
  departureDate,
  locale,
}: BookingConfirmedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(client)}</Text>

      {/* Trip summary */}
      <Section style={summaryPanel}>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{c.tripLabel}</span>{" "}
          <span style={summaryValue}>{tripType}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{c.nightsLabel}</span>{" "}
          <span style={summaryValue}>{nights}</span>
        </Text>
        {departureDate && (
          <Text style={summaryRow}>
            <span style={summaryLabel}>{c.departureDateLabel}</span>{" "}
            <span style={summaryValue}>{departureDate}</span>
          </Text>
        )}
      </Section>

      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={ctaHref} style={ctaButton}>
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
  margin: "0 auto 24px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const summaryPanel: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px 32px",
  margin: "0 auto 24px",
  maxWidth: "400px",
  textAlign: "left",
};

const summaryRow: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#5A5858",
  fontFamily: "'Barlow', Arial, sans-serif",
};

const summaryLabel: React.CSSProperties = {
  fontWeight: "700",
  color: "#111827",
};

const summaryValue: React.CSSProperties = {
  fontWeight: "400",
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
