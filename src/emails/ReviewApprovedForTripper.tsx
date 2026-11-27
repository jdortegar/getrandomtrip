import * as React from "react";
import { Text } from "@react-email/components";
import { emailColors, emailFonts } from "./components/tokens";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";

interface ReviewApprovedForTripperProps {
  dashboardUrl: string;
  excerpt: string;
  locale: "es" | "en";
  rating: number;
  tripperName: string;
}

const copy = {
  es: {
    preview: "Un cliente dejó una reseña sobre tu viaje. ¡Revisala ahora!",
    eyebrow: "Tus viajeros",
    heading: "Nueva reseña",
    body: (tripperName: string) =>
      `Hola ${tripperName}, el equipo de Randomtrip revisó y aprobó una nueva reseña de uno de tus viajeros. Ya podés verla en tu panel y decidir si la publicás en tu perfil.`,
    excerpt: "Lo que escribió tu viajero",
    stars: (n: number) => `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n}/5)`,
    cta: "Ver mi reseña",
  },
  en: {
    preview: "A client left a review about their trip. Check it out!",
    eyebrow: "Your travelers",
    heading: "New review",
    body: (tripperName: string) =>
      `Hi ${tripperName}, the Randomtrip team reviewed and approved a new review from one of your travelers. You can now view it in your dashboard and choose whether to publish it on your profile.`,
    excerpt: "What your traveler wrote",
    stars: (n: number) => `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n}/5)`,
    cta: "View my review",
  },
};

export const subjects = {
  es: "Tienes una nueva reseña aprobada",
  en: "You have a new approved review",
};

export default function ReviewApprovedForTripper({
  dashboardUrl,
  excerpt,
  locale,
  rating,
  tripperName,
}: ReviewApprovedForTripperProps) {
  const c = copy[locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body(tripperName)}</EmailText>
      <EmailPanel label={c.excerpt}>
        <Text style={stars}>{c.stars(rating)}</Text>
        <Text style={quote}>&ldquo;{excerpt}&rdquo;</Text>
      </EmailPanel>
      <EmailButton href={dashboardUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const stars: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const quote: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "15px",
  fontStyle: "italic",
  lineHeight: "1.65",
  margin: "0",
};
