import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import type { AccessInviteKind } from "@prisma/client";
import EmailLayout from "./components/EmailLayout";

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
  Record<"es" | "en", { preview: string; heading: string; body: string; subtext: string; cta: string }>
> = {
  TRIPPER: {
    es: {
      preview: "Te invitamos a ser Tripper en Randomtrip.",
      heading: "Te invitamos a ser Tripper",
      body: "Un admin de Randomtrip te invitó a convertirte en Tripper: vas a poder crear y gestionar tus propios paquetes de viaje.",
      subtext: "Este enlace vence en 7 días.",
      cta: "ACEPTAR INVITACIÓN",
    },
    en: {
      preview: "You've been invited to become a Tripper on Randomtrip.",
      heading: "You're invited to become a Tripper",
      body: "A Randomtrip admin invited you to become a Tripper: you'll be able to create and manage your own trip packages.",
      subtext: "This link expires in 7 days.",
      cta: "ACCEPT INVITATION",
    },
  },
  SITE_ACCESS: {
    es: {
      preview: "Te invitamos a sumarte a Randomtrip.",
      heading: "Te invitamos a Randomtrip",
      body: "Un admin de Randomtrip te invitó a sumarte a la plataforma: vas a poder acceder al sitio y armar tu próximo viaje sorpresa.",
      subtext: "Este enlace vence en 7 días.",
      cta: "ACEPTAR INVITACIÓN",
    },
    en: {
      preview: "You've been invited to join Randomtrip.",
      heading: "You're invited to Randomtrip",
      body: "A Randomtrip admin invited you to join the platform: you'll be able to access the site and set up your next surprise trip.",
      subtext: "This link expires in 7 days.",
      cta: "ACCEPT INVITATION",
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
      <Heading style={heading}>{c.heading}</Heading>
      <Text style={bodyText}>{c.body}</Text>
      <Text style={subtextStyle}>{c.subtext}</Text>
      <Button href={inviteUrl} style={ctaButton}>
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
  margin: "0 auto 16px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
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
