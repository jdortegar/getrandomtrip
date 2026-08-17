import { Button, Column, Heading, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface DestinationRevealedProps {
  client: string;
  /** Kept for the caller (sendDestinationRevealed) and analytics — never
   * rendered. The whole point of this email is to NOT leak it. */
  destination: string;
  departureDate?: string;
  returnDate?: string;
  locale: "es" | "en";
  tripId: string;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Ya podés descubrir tu destino sorpresa.",
    heading: "Tu destino ya está listo",
    body: (client: string) =>
      `Hola ${client}, llegó el momento que tanto esperabas. Tu destino sorpresa ya está cargado en tu panel, esperando a que lo descubras.`,
    departureLabel: "Salida",
    returnLabel: "Regreso",
    subtext:
      "No te lo contamos por acá a propósito: el destino se descubre rascando la tarjeta en tu panel.",
    cta: "DESCUBRIR MI DESTINO",
  },
  en: {
    preview: "You can now uncover your surprise destination.",
    heading: "Your destination is ready",
    body: (client: string) =>
      `Hi ${client}, the moment you've been waiting for has arrived. Your surprise destination is loaded in your dashboard, waiting for you to uncover it.`,
    departureLabel: "Departure",
    returnLabel: "Return",
    subtext:
      "We're deliberately not saying it here — scratch the card in your dashboard to find out.",
    cta: "UNCOVER MY DESTINATION",
  },
};

export const subjects = {
  es: "Tu destino ya está listo",
  en: "Your destination is ready",
};

export default function DestinationRevealed({
  client,
  departureDate,
  returnDate,
  locale,
  tripId,
}: DestinationRevealedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/trips/${tripId}/reveal`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(client)}</Text>

      {/* Teaser panel — same gradient as the reveal page's scratch cover,
          deliberately no destination name anywhere in it. */}
      <Section style={destinationPanel}>
        <Text style={teaserLine}>
          {locale === "es" ? (
            <>
              Rascá en el sitio
              <br />
              para descubrirlo
            </>
          ) : (
            <>
              Scratch on the site
              <br />
              to uncover it
            </>
          )}
        </Text>
      </Section>

      {departureDate && (
        <Section style={dateTableWrapper}>
          <Row>
            <Column style={dateCellLeft}>
              <Section style={dateCellBox}>
                <Text style={dateCellLabel}>{c.departureLabel}</Text>
                <Text style={dateCellValue}>{departureDate}</Text>
              </Section>
            </Column>
            {returnDate && (
              <Column style={dateCellRight}>
                <Section style={dateCellBox}>
                  <Text style={dateCellLabel}>{c.returnLabel}</Text>
                  <Text style={dateCellValue}>{returnDate}</Text>
                </Section>
              </Column>
            )}
          </Row>
        </Section>
      )}

      <Button href={ctaHref} style={ctaButton}>
        {c.cta}
      </Button>
      <Text style={subtextStyle}>{c.subtext}</Text>
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
  margin: "0 auto 28px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const destinationPanel: React.CSSProperties = {
  backgroundColor: "#0b0f1a",
  backgroundImage:
    "linear-gradient(135deg, #141a2b 0%, #0b0f1a 50%, #12283a 100%)",
  borderRadius: "8px",
  padding: "36px 32px",
  margin: "0 auto 28px",
  maxWidth: "400px",
  textAlign: "center",
};

const teaserLine: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "1px",
  lineHeight: "1.05",
  margin: "0",
};

const dateTableWrapper: React.CSSProperties = {
  maxWidth: "400px",
  margin: "0 auto 32px",
};

const dateCellLeft: React.CSSProperties = {
  width: "50%",
  paddingRight: "8px",
  verticalAlign: "top",
};

const dateCellRight: React.CSSProperties = {
  width: "50%",
  paddingLeft: "8px",
  verticalAlign: "top",
};

const dateCellBox: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "14px 16px",
  textAlign: "left",
  margin: "0",
};

const dateCellLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#9ca3af",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const dateCellValue: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  color: "#111827",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "1",
  margin: "0",
};

const subtextStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "12.5px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "22px auto 0",
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
