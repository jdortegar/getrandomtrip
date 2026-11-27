import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface TripCompletedProps {
  client: string;
  locale: "es" | "en";
  reviewToken: string;
}

const copy = {
  es: {
    preview: "¡Tu viaje fue completado! Esperamos que haya sido increíble.",
    eyebrow: "De vuelta",
    heading: "¡Viaje completado!",
    body: (client: string) =>
      `Hola ${client}, ¡tu aventura llegó a su fin! Esperamos que cada momento haya sido memorable y que hayas disfrutado al máximo tu experiencia Randomtrip.`,
    subtext:
      "Tu opinión nos importa mucho. ¿Qué tal si compartís tu experiencia con otros viajeros dejando una reseña?",
    cta: "Dejar una reseña",
  },
  en: {
    preview: "Your trip is complete! We hope it was incredible.",
    eyebrow: "Back home",
    heading: "Trip completed!",
    body: (client: string) =>
      `Hi ${client}, your adventure has come to an end! We hope every moment was memorable and that you fully enjoyed your Randomtrip experience.`,
    subtext:
      "Your opinion matters to us. How about sharing your experience with other travelers by leaving a review?",
    cta: "Leave a review",
  },
};

export const subjects = {
  es: "¡Tu viaje fue completado!",
  en: "Your trip is complete!",
};

export default function TripCompleted({
  client,
  locale,
  reviewToken,
}: TripCompletedProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/review/${reviewToken}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(client)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref} variant="feature">
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
