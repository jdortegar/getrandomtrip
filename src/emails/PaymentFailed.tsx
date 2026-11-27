import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

interface PaymentFailedProps {
  client: string;
  tripRequestId: string;
  failureReason?: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "Hubo un problema con tu pago. Por favor, intentalo nuevamente.",
    eyebrow: "Tu reserva",
    heading: "Problema con el pago",
    body: (client: string) =>
      `Hola ${client}, lamentablemente hubo un inconveniente al procesar tu pago. Tu reserva no pudo confirmarse.`,
    failureLabel: "Detalle del error",
    subtext:
      "Podés reintentar el pago desde tu panel. Si el problema persiste, contactate con nuestro soporte.",
    cta: "Reintentar pago",
  },
  en: {
    preview: "There was a problem with your payment. Please try again.",
    eyebrow: "Your booking",
    heading: "Payment failed",
    body: (client: string) =>
      `Hi ${client}, unfortunately there was an issue processing your payment. Your booking could not be confirmed.`,
    failureLabel: "Error detail",
    subtext:
      "You can retry the payment from your dashboard. If the problem persists, please contact our support team.",
    cta: "Retry payment",
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
  const ctaHref = `${getApplicationOrigin()}/${locale}/journey`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(client)}</EmailText>
      {failureReason && (
        <EmailPanel label={c.failureLabel}>{failureReason}</EmailPanel>
      )}
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
