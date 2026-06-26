import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface PaymentFailedProps {
  client: string;
  tripRequestId: string;
  failureReason?: string;
  locale: "es" | "en";
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Hubo un problema con tu pago. Por favor, intentalo nuevamente.",
    heading: "Problema con el pago",
    body: (client: string) =>
      `Hola ${client}, lamentablemente hubo un inconveniente al procesar tu pago. Tu reserva no pudo confirmarse.`,
    failureLabel: "Detalle del error:",
    subtext:
      "Podés reintentar el pago desde tu panel. Si el problema persiste, contactate con nuestro soporte.",
    cta: "REINTENTAR PAGO",
  },
  en: {
    preview: "There was a problem with your payment. Please try again.",
    heading: "Payment failed",
    body: (client: string) =>
      `Hi ${client}, unfortunately there was an issue processing your payment. Your booking could not be confirmed.`,
    failureLabel: "Error detail:",
    subtext:
      "You can retry the payment from your dashboard. If the problem persists, please contact our support team.",
    cta: "RETRY PAYMENT",
  },
};

export const subjects = {
  es: "Hubo un problema con tu pago",
  en: "There was a problem with your payment",
};

export default function PaymentFailed({
  client,
  failureReason,
  locale,
}: PaymentFailedProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/journey`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body(client)}</Text>

      {failureReason && (
        <Section style={failurePanel}>
          <Text style={failureLabel}>{c.failureLabel}</Text>
          <Text style={failureText}>{failureReason}</Text>
        </Section>
      )}

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

const failurePanel: React.CSSProperties = {
  backgroundColor: "#fff5f5",
  borderRadius: "8px",
  padding: "20px 32px",
  margin: "0 auto 24px",
  maxWidth: "400px",
  textAlign: "left",
};

const failureLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#888",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const failureText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  lineHeight: "1.7",
  margin: "0",
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
