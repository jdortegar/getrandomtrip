import { getApplicationOrigin } from "@/lib/deployment";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface WelcomeEmailProps {
  name: string;
  locale: "es" | "en";
}

const copy = {
  es: {
    preview: "¡Bienvenido/a a Randomtrip! Tu próxima aventura te espera.",
    eyebrow: "Tu cuenta",
    heading: "¡Bienvenido/a!",
    body: (name: string) =>
      `Hola ${name}, estamos muy contentos de que te hayas unido a Randomtrip. Somos la plataforma donde el destino es siempre una sorpresa.`,
    subtext:
      "Configurá tu viaje, contanos qué tipo de experiencia buscás, y nosotros nos encargamos del resto. ¡La aventura está a un paso!",
    cta: "Empezar a planificar",
  },
  en: {
    preview: "Welcome to Randomtrip! Your next adventure awaits.",
    eyebrow: "Your account",
    heading: "Welcome!",
    body: (name: string) =>
      `Hi ${name}, we're thrilled to have you join Randomtrip. We're the platform where the destination is always a surprise.`,
    subtext:
      "Set up your trip, tell us what kind of experience you're looking for, and we'll take care of the rest. Adventure is just one step away!",
    cta: "Start planning",
  },
};

export const subjects = {
  es: "¡Bienvenido/a a Randomtrip!",
  en: "Welcome to Randomtrip!",
};

export default function WelcomeEmail({ name, locale }: WelcomeEmailProps) {
  const c = copy[locale];
  const ctaHref = `${getApplicationOrigin()}/${locale}/journey`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(name)}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={ctaHref}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
