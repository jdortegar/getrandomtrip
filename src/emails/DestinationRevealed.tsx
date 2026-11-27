import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

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

const copy = {
  es: {
    preview: "Ya podés descubrir tu destino sorpresa.",
    eyebrow: "Llegó el momento",
    heading: "Tu destino ya está listo",
    body: (client: string) =>
      `Hola ${client}, llegó el momento que tanto esperabas. Tu destino sorpresa ya está cargado en tu panel, esperando a que lo descubras.`,
    departureLabel: "Salida",
    returnLabel: "Regreso",
    subtext:
      "No te lo contamos por acá a propósito: tu destino te espera en tu panel.",
    cta: "Descubrir mi destino",
  },
  en: {
    preview: "You can now uncover your surprise destination.",
    eyebrow: "The moment is here",
    heading: "Your destination is ready",
    body: (client: string) =>
      `Hi ${client}, the moment you've been waiting for has arrived. Your surprise destination is loaded in your dashboard, waiting for you to uncover it.`,
    departureLabel: "Departure",
    returnLabel: "Return",
    subtext:
      "We're deliberately not saying it here — it's waiting for you in your dashboard.",
    cta: "Uncover my destination",
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
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/trips/${tripId}/destination`;

  const dates = [
    ...(departureDate ? [{ label: c.departureLabel, value: departureDate }] : []),
    ...(returnDate ? [{ label: c.returnLabel, value: returnDate }] : []),
  ];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(client)}</EmailText>
      {dates.length > 0 && <EmailDetailList items={dates} />}
      <EmailButton href={ctaHref} variant="feature">
        {c.cta}
      </EmailButton>
      <EmailText variant="note">{c.subtext}</EmailText>
    </EmailLayout>
  );
}
