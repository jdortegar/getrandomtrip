import { Link } from "@react-email/components";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import { emailColors, emailFonts } from "./components/tokens";

interface XsedDropNotificationProps {
  locale: "es" | "en";
}

const SITE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: "Tu XSED abre en 10 minutos.",
    eyebrow: "XSED · Drop semanal",
    heading: "La ventana abre en 10 minutos.",
    body: "Los lugares se agotan rápido. Este domingo de 18:00 a 22:00 hs podés reservar tu XSED — 1 noche, destino sorpresa, experiencia local.",
    cta: "Ir al drop",
    href: `${SITE_URL}/es/xsed`,
    unsubscribeIntro:
      "Te enviamos este email porque te anotaste para recibir novedades de XSED.",
    unsubscribeLabel: "Desuscribirse",
  },
  en: {
    preview: "Your XSED opens in 10 minutes.",
    eyebrow: "XSED · Weekly Drop",
    heading: "The window opens in 10 minutes.",
    body: "Spots go fast. This Sunday from 18:00 to 22:00 you can book your XSED — 1 night, surprise destination, local experience.",
    cta: "Go to the drop",
    href: `${SITE_URL}/en/xsed`,
    unsubscribeIntro:
      "You received this email because you signed up for XSED notifications.",
    unsubscribeLabel: "Unsubscribe",
  },
};

export const subjects = {
  es: "¡Tu XSED abre en 10 minutos!",
  en: "Your XSED opens in 10 minutes!",
};

export default function XsedDropNotification({
  locale,
}: XsedDropNotificationProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body}</EmailText>
      <EmailButton href={c.href} variant="xsed">
        {c.cta}
      </EmailButton>
      <EmailText variant="note">
        {c.unsubscribeIntro}
        <br />
        <Link href={c.href} style={unsubscribeLink}>
          {c.unsubscribeLabel}
        </Link>
      </EmailText>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const unsubscribeLink: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  textDecoration: "underline",
};
