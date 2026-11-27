import { getApplicationOrigin } from "@/lib/deployment";
import { Img, Link, Text } from "@react-email/components";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailPanel from "./components/EmailPanel";
import EmailText from "./components/EmailText";
import { EMAIL_ASSET_ORIGIN, emailColors, emailFonts } from "./components/tokens";

interface TripStartVouchersProps {
  client: string;
  /** Documents actually attached to this email (admin-authored label, real mimeType). */
  documents: { label: string; mimeType: string }[];
  /** Count of documents that exist for the trip but were skipped from the attachment
   * because including them would have pushed the email past the safe size budget. */
  skippedCount: number;
  startDate?: Date | null;
  endDate?: Date | null;
  nights: number;
  pax: number;
  tripType: string;
  locale: "es" | "en";
  tripId: string;
}

const WHATSAPP_HREF = "https://wa.me/526241928208";

// ── Copy ─────────────────────────────────────────────────────────────────────

export const travelerTypeLabels: Record<"es" | "en", Record<string, string>> = {
  es: {
    solo: "Solo",
    couple: "Pareja",
    family: "Familia",
    group: "Grupo",
    honeymoon: "Luna de miel",
    paws: "Con mascota",
  },
  en: {
    solo: "Solo",
    couple: "Couple",
    family: "Family",
    group: "Group",
    honeymoon: "Honeymoon",
    paws: "Pet-friendly",
  },
};

const copy = {
  es: {
    preview: "Tus documentos de viaje están listos.",
    heroAlt: "Un camino al amanecer",
    titleLine1: "Tu Randomtrip",
    titleLine2: "arranca hoy",
    greeting: (firstName: string) => `Hola ${firstName},`,
    body: "Ya está todo confirmado y pago. Tus documentos van adjuntos en este mail, así los tenés a mano incluso sin señal — sin imprimir, sin revisar, sin organizar nada. Solo presentate.",
    snapshotDates: "Fechas",
    snapshotNights: "Noches",
    snapshotTravelers: "Viajeros",
    night: "noche",
    nights: "noches",
    attachedLabel: "Documentos adjuntos",
    file: "archivo",
    files: "archivos",
    skippedNotice: (count: number) =>
      count === 1
        ? "Un documento no pudo adjuntarse por su tamaño — podés descargarlo desde tu panel."
        : `${count} documentos no pudieron adjuntarse por su tamaño — podés descargarlos desde tu panel.`,
    cta: "Abrir mi viaje",
    ctaSubtext: "También los vas a encontrar siempre en tu panel.",
    support:
      "¿Algo cambia en el camino? Escribinos por WhatsApp — te responde una persona.",
    preferences: "Preferencias",
    unsubscribe: "Desuscribirse",
  },
  en: {
    preview: "Your travel documents are ready.",
    heroAlt: "A road at first light",
    titleLine1: "Your Randomtrip",
    titleLine2: "starts today",
    greeting: (firstName: string) => `Hi ${firstName},`,
    body: "Everything is confirmed and paid for. Your documents are attached to this email, so you have them on hand even without signal — no printing, no checking, no organizing. Just show up.",
    snapshotDates: "Dates",
    snapshotNights: "Nights",
    snapshotTravelers: "Travelers",
    night: "night",
    nights: "nights",
    attachedLabel: "Attached documents",
    file: "file",
    files: "files",
    skippedNotice: (count: number) =>
      count === 1
        ? "One document couldn't be attached due to its size — you can download it from your dashboard."
        : `${count} documents couldn't be attached due to their size — you can download them from your dashboard.`,
    cta: "Open my trip",
    ctaSubtext: "They also live in your dashboard, always.",
    support:
      "Something shifts on the road? Write us on WhatsApp — a human answers.",
    preferences: "Preferences",
    unsubscribe: "Unsubscribe",
  },
};

export const subjects = {
  es: "Tus documentos de viaje están listos",
  en: "Your travel documents are ready",
};

// ── Formatting helpers ───────────────────────────────────────────────────────

function firstNameOf(client: string): string {
  return client.trim().split(/\s+/)[0] || client;
}

function formatEyebrow(date: Date, locale: "es" | "en"): string {
  const intlLocale = locale === "en" ? "en-US" : "es-AR";
  const full = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${full} · ${locale === "en" ? "Day 1" : "Día 1"}`;
}

function formatDateRange(start: Date, end: Date, locale: "es" | "en"): string {
  const intlLocale = locale === "en" ? "en-US" : "es-AR";
  const dayFmt = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    timeZone: "UTC",
  });
  const monthFmt = new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    timeZone: "UTC",
  });
  const startDay = dayFmt.format(start);
  const endDay = dayFmt.format(end);
  const startMonth = monthFmt.format(start).replace(/\.$/, "");
  const endMonth = monthFmt.format(end).replace(/\.$/, "");
  return startMonth === endMonth
    ? `${startDay} – ${endDay} ${endMonth}`
    : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TripStartVouchers({
  client,
  documents,
  skippedCount,
  startDate,
  endDate,
  nights,
  pax,
  tripType,
  locale,
  tripId,
}: TripStartVouchersProps) {
  const c = copy[locale];
  const firstName = firstNameOf(client);
  const ctaHref = `${getApplicationOrigin()}/${locale}/dashboard/trips/${tripId}/destination`;
  const settingsHref = `${getApplicationOrigin()}/${locale}/dashboard/traveler/settings`;

  const nightsValue = `${nights} ${nights === 1 ? c.night : c.nights}`;
  const travelerTypeLabel = travelerTypeLabels[locale][tripType] ?? tripType;
  const snapshot =
    startDate && endDate
      ? [
          { label: c.snapshotDates, value: formatDateRange(startDate, endDate, locale) },
          { label: c.snapshotNights, value: nightsValue },
          { label: c.snapshotTravelers, value: `${pax} · ${travelerTypeLabel}` },
        ]
      : [];

  const allPdf =
    documents.length > 0 &&
    documents.every((d) => d.mimeType === "application/pdf");
  const filesWord = documents.length === 1 ? c.file : c.files;
  const attachedCountText = allPdf
    ? `${documents.length} ${filesWord} · PDF`
    : `${documents.length} ${filesWord}`;

  return (
    <EmailLayout locale={locale} preview={c.preview}>
      <Img
        alt={c.heroAlt}
        height={220}
        src={`${EMAIL_ASSET_ORIGIN}/images/emails/trip-start-hero.jpg`}
        style={hero}
        width={520}
      />
      <EmailHeading eyebrow={startDate ? formatEyebrow(startDate, locale) : undefined}>
        {c.titleLine1}
        <br />
        {c.titleLine2}
      </EmailHeading>
      <EmailText>
        {c.greeting(firstName)}
        <br />
        {c.body}
      </EmailText>

      {snapshot.length > 0 && <EmailDetailList items={snapshot} />}

      {documents.length > 0 && (
        <EmailPanel label={`${c.attachedLabel} · ${attachedCountText}`}>
          {documents.map((doc, i) => (
            <Text key={`${doc.label}-${i}`} style={docName}>
              {doc.label}
            </Text>
          ))}
        </EmailPanel>
      )}

      {skippedCount > 0 && (
        <EmailText variant="note">{c.skippedNotice(skippedCount)}</EmailText>
      )}

      <EmailButton href={ctaHref} variant="feature">
        {c.cta}
      </EmailButton>
      <EmailText variant="note">{c.ctaSubtext}</EmailText>

      <EmailText>
        <Link href={WHATSAPP_HREF} style={link}>
          {c.support}
        </Link>
      </EmailText>

      <Text style={legal}>
        <Link href={settingsHref} style={link}>
          {c.preferences}
        </Link>
        {" · "}
        <Link href={settingsHref} style={link}>
          {c.unsubscribe}
        </Link>
      </Text>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const hero: React.CSSProperties = {
  borderRadius: "8px",
  display: "block",
  height: "auto",
  margin: "0 0 28px",
  maxWidth: "100%",
  width: "100%",
};

const docName: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: "4px 0 0",
};

const link: React.CSSProperties = {
  color: emailColors.primary,
  fontWeight: "600",
  textDecoration: "underline",
};

const legal: React.CSSProperties = {
  color: emailColors.muted,
  fontFamily: emailFonts.body,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};
