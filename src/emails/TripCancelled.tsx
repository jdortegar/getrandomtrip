import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface TripCancelledProps {
  client: string;
  tripRequestId: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Tu viaje fue cancelado. Estamos aquí para ayudarte.",
    eyebrow: "Tu reserva",
    heading: "Viaje cancelado",
    body: (client: string) =>
      `Hola ${client}, lamentamos informarte que tu viaje fue cancelado. Entendemos que esto puede ser decepcionante.`,
    subtext:
      "Si tenés preguntas o necesitás asistencia, nuestro equipo de soporte está disponible para ayudarte.",
    cta: "Contactar soporte",
  },
  en: {
    preview: "Your trip has been cancelled. We're here to help.",
    eyebrow: "Your booking",
    heading: "Trip cancelled",
    body: (client: string) =>
      `Hi ${client}, we're sorry to inform you that your trip has been cancelled. We understand this can be disappointing.`,
    subtext:
      "If you have questions or need assistance, our support team is available to help you.",
    cta: "Contact support",
  },
};

export const subjects = {
  es: "Tu viaje fue cancelado",
  en: "Your trip has been cancelled",
};

export default function TripCancelled({ client, locale }: TripCancelledProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/contact`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(client)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
