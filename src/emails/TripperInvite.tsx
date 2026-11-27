import * as React from "react";
import type { AccessInviteKind } from "@prisma/client";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface TripperInviteProps {
  inviteUrl: string;
  locale: "es" | "en";
  kind: AccessInviteKind;
}

/**
 * Copy is kind-aware (design ADR 6): `TRIPPER` invites still pitch the
 * Tripper role; `SITE_ACCESS` invites (waitlist-originated) must never claim
 * a Tripper role — the invitee is only getting into the site. One template,
 * both kinds — only these strings differ.
 */
const copy: Record<
  AccessInviteKind,
  Record<
    "es" | "en",
    {
      preview: string;
      eyebrow: string;
      heading: string;
      body: string;
      subtext: string;
      cta: string;
    }
  >
> = {
  TRIPPER: {
    es: {
      preview: "Te invitamos a ser Tripper en Randomtrip.",
      eyebrow: "Tu acceso",
      heading: "Te invitamos a ser Tripper",
      body: "Un admin de Randomtrip te invitó a convertirte en Tripper: vas a poder crear y gestionar tus propios paquetes de viaje.",
      subtext: "Este enlace vence en 7 días.",
      cta: "Aceptar invitación",
    },
    en: {
      preview: "You've been invited to become a Tripper on Randomtrip.",
      eyebrow: "Your access",
      heading: "You're invited to become a Tripper",
      body: "A Randomtrip admin invited you to become a Tripper: you'll be able to create and manage your own trip packages.",
      subtext: "This link expires in 7 days.",
      cta: "Accept invitation",
    },
  },
  SITE_ACCESS: {
    es: {
      preview: "Te invitamos a sumarte a Randomtrip.",
      eyebrow: "Tu acceso",
      heading: "Te invitamos a Randomtrip",
      body: "Un admin de Randomtrip te invitó a sumarte a la plataforma: vas a poder acceder al sitio y armar tu próximo viaje sorpresa.",
      subtext: "Este enlace vence en 7 días.",
      cta: "Aceptar invitación",
    },
    en: {
      preview: "You've been invited to join Randomtrip.",
      eyebrow: "Your access",
      heading: "You're invited to Randomtrip",
      body: "A Randomtrip admin invited you to join the platform: you'll be able to access the site and set up your next surprise trip.",
      subtext: "This link expires in 7 days.",
      cta: "Accept invitation",
    },
  },
};

export const subjects: Record<AccessInviteKind, Record<"es" | "en", string>> = {
  TRIPPER: {
    es: "Te invitamos a ser Tripper en Randomtrip",
    en: "You're invited to become a Tripper on Randomtrip",
  },
  SITE_ACCESS: {
    es: "Te invitamos a Randomtrip",
    en: "You're invited to Randomtrip",
  },
};

export default function TripperInvite({
  inviteUrl,
  locale,
  kind,
}: TripperInviteProps) {
  const c = copy[kind][locale];

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <EmailHeading eyebrow={c.eyebrow}>{c.heading}</EmailHeading>
      <EmailText>{c.body}</EmailText>
      <EmailText variant="note">{c.subtext}</EmailText>
      <EmailButton href={inviteUrl}>
        {c.cta}
      </EmailButton>
    </EmailLayout>
  );
}
