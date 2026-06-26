import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface DestinationRevealedProps {
  client: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  locale: "es" | "en";
  tripId: string;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: (destination: string) =>
      `¡Tu destino fue revelado! Te vas a ${destination}.`,
    heading: "¡Tu destino fue revelado!",
    body: (client: string) =>
      `Hola ${client}, llegó el momento que tanto esperabas. Tu destino sorpresa está a punto de hacerse realidad.`,
    destinationLabel: "Tu destino:",
    departureDateLabel: "Fecha de salida:",
    returnDateLabel: "Fecha de regreso:",
    subtext:
      "Ingresá a tu panel para ver todos los detalles de tu viaje. ¡Preparate para una experiencia increíble!",
    cta: "VER MI DESTINO",
  },
  en: {
    preview: (destination: string) =>
      `Your destination has been revealed! You're going to ${destination}.`,
    heading: "Your destination is revealed!",
    body: (client: string) =>
      `Hi ${client}, the moment you've been waiting for has arrived. Your surprise destination is about to become reality.`,
    destinationLabel: "Your destination:",
    departureDateLabel: "Departure date:",
    returnDateLabel: "Return date:",
    subtext:
      "Log in to your dashboard to see all the details of your trip. Get ready for an incredible experience!",
    cta: "VIEW MY DESTINATION",
  },
};

export const subjects = {
  es: "¡Tu destino fue revelado!",
  en: "Your destination has been revealed!",
};

export default function DestinationRevealed({
  client,
  destination,
  departureDate,
  returnDate,
  locale,
  tripId,
}: DestinationRevealedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/trips/${tripId}/reveal`;

  return (
    <EmailLayout locale={locale} preview={c.preview(destination)}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(client)}</Text>

      {/* Destination highlight */}
      <Section style={destinationPanel}>
        <Text style={destinationLabel}>{c.destinationLabel}</Text>
        <Text style={destinationName}>{destination}</Text>
        {departureDate && (
          <Text style={dateRow}>
            <span style={dateLabel}>{c.departureDateLabel}</span>{" "}
            {departureDate}
          </Text>
        )}
        {returnDate && (
          <Text style={dateRow}>
            <span style={dateLabel}>{c.returnDateLabel}</span> {returnDate}
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
  fontSize: "38px",
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

const destinationPanel: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  borderRadius: "8px",
  padding: "24px 32px",
  margin: "0 auto 24px",
  maxWidth: "400px",
  textAlign: "center",
};

const destinationLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#facc15",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "2px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const destinationName: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "2px",
  margin: "0 0 16px",
  lineHeight: "1",
};

const dateRow: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#cccccc",
  fontSize: "13px",
  fontWeight: "400",
  margin: "4px 0 0",
};

const dateLabel: React.CSSProperties = {
  fontWeight: "700",
  color: "#ffffff",
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
