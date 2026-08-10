import { Button, Heading, Link, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface XsedDropNotificationProps {
  locale: "es" | "en";
}

const SITE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Tu XSED abre en 30 minutos.",
    eyebrow: "XSED · Drop semanal",
    heading: "La ventana abre en 30 minutos.",
    body: "Los lugares se agotan rápido. Este domingo de 16 a 20hs podés reservar tu XSED — 1 noche, destino sorpresa, experiencia local.",
    cta: "IR AL DROP",
    href: `${SITE_URL}/es/xsed`,
    unsubscribeIntro:
      "Te enviamos este email porque te anotaste para recibir novedades de XSED.",
    unsubscribeLabel: "Desuscribirse",
  },
  en: {
    preview: "Your XSED opens in 30 minutes.",
    eyebrow: "XSED · Weekly Drop",
    heading: "The window opens in 30 minutes.",
    body: "Spots go fast. This Sunday from 4pm to 8pm you can book your XSED — 1 night, surprise destination, local experience.",
    cta: "GO TO THE DROP",
    href: `${SITE_URL}/en/xsed`,
    unsubscribeIntro: "You received this email because you signed up for XSED notifications.",
    unsubscribeLabel: "Unsubscribe",
  },
};

export const subjects = {
  es: "¡Tu XSED abre en 30 minutos!",
  en: "Your XSED opens in 30 minutes!",
};

export default function XsedDropNotification({
  locale,
}: XsedDropNotificationProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Text style={eyebrow}>{c.eyebrow}</Text>
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body}</Text>
      <Button href={c.href} style={ctaButton}>
        {c.cta}
      </Button>
      <Text style={unsubscribeText}>
        {c.unsubscribeIntro}
        <br />
        <Link href={c.href} style={unsubscribeLink}>
          {c.unsubscribeLabel}
        </Link>
      </Text>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#D97E4A",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "3px",
  textTransform: "uppercase",
  margin: "0 0 12px",
  lineHeight: "1.4",
};

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "36px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 20px",
  lineHeight: "1.05",
  textTransform: "uppercase",
};

const bodyText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "15px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 32px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#D97E4A",
  color: "#ffffff",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "1px",
  lineHeight: "24px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "4px",
  display: "inline-block",
};

const unsubscribeText: React.CSSProperties = {
  color: "#999999",
  fontSize: "12px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "40px 0 0",
  lineHeight: "1.6",
  textAlign: "center",
};

const unsubscribeLink: React.CSSProperties = {
  color: "#999999",
  textDecoration: "underline",
};
