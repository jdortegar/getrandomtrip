import {
  Body,
  Button,
  Column,
  Font,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

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

const BASE_URL = "https://getrandomtrip.com";
const WHATSAPP_HREF = "https://wa.me/526241928208";
const INSTAGRAM_HREF = "https://www.instagram.com/getrandomtrip";
const FACEBOOK_HREF = "https://www.facebook.com/getrandomtrip";
const X_HREF = "https://x.com/getrandomtrip";

// ── Design tokens (resolved to literal hex per handoff) ─────────────────────────

const ink = "#111827";
const ink50 = "#f0f4f8";
const ink100 = "#d9e2ec";
const ink500 = "#627d98";
const feature = "#e5a51c";
const textOnSun = "#1f2937";
const neutral50 = "#fafafa";
const neutral100 = "#f5f5f5";
const neutral200 = "#e5e5e5";
const neutral400 = "#a3a3a3";
const neutral500 = "#737373";
const neutral600 = "#525252";
const neutral700 = "#404040";
const desk = "#ededeb";

// ── Copy ─────────────────────────────────────────────────────────────────────

const travelerTypeLabels: Record<"es" | "en", Record<string, string>> = {
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
    tagline: "WONDER • WANDER • REPEAT",
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
    support: "¿Algo cambia en el camino? Escribinos por WhatsApp — te responde una persona.",
    footerBrand: "Vive lo inesperado sin improvisar",
    designedSerendipity: "SERENDIPIA DISEÑADA",
    preferences: "Preferencias",
    unsubscribe: "Desuscribirse",
  },
  en: {
    preview: "Your travel documents are ready.",
    heroAlt: "A road at first light",
    tagline: "WONDER • WANDER • REPEAT",
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
    support: "Something shifts on the road? Write us on WhatsApp — a human answers.",
    footerBrand: "Live the unexpected without improvising",
    designedSerendipity: "DESIGNED SERENDIPITY",
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
  const dayFmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric", timeZone: "UTC" });
  const monthFmt = new Intl.DateTimeFormat(intlLocale, { month: "short", timeZone: "UTC" });
  const startDay = dayFmt.format(start);
  const endDay = dayFmt.format(end);
  const startMonth = monthFmt.format(start).replace(/\.$/, "");
  const endMonth = monthFmt.format(end).replace(/\.$/, "");
  return startMonth === endMonth
    ? `${startDay} – ${endDay} ${endMonth}`
    : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

// ── Icon pucks ───────────────────────────────────────────────────────────────
// Table-based circular badges, not inline <svg> — Gmail and several other
// clients strip inline SVG markup entirely, which silently renders as blank
// space. Referenced <Img> assets survive everywhere.

function IconPuck({
  content,
  background,
  size = 34,
}: {
  content: React.ReactNode;
  background: string;
  size?: number;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: size, height: size }}>
      <tbody>
        <tr>
          <td
            align="center"
            valign="middle"
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              backgroundColor: background,
              textAlign: "center",
              verticalAlign: "middle",
              fontSize: 16,
              lineHeight: `${size}px`,
            }}
          >
            {content}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SocialLink({ href, src, alt }: { href: string; src: string; alt: string }) {
  return (
    <Link href={href} className="rt-social" style={{ display: "inline-block" }}>
      <IconPuck
        background="rgba(255,255,255,0.1)"
        content={
          <Img
            src={src}
            width={18}
            height={18}
            alt={alt}
            style={{ display: "inline-block", verticalAlign: "middle" }}
          />
        }
      />
    </Link>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ink}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-3.3-.6L3 21l1.7-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  );
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
  const ctaHref = `${BASE_URL}/${locale}/dashboard/trips/${tripId}/reveal`;
  const settingsHref = `${BASE_URL}/${locale}/dashboard/traveler/settings`;
  const year = new Date().getFullYear();

  const showSnapshot = Boolean(startDate && endDate);
  const nightsValue = `${nights} ${nights === 1 ? c.night : c.nights}`;
  const travelerTypeLabel = travelerTypeLabels[locale][tripType] ?? tripType;
  const travelersValue = `${pax} · ${travelerTypeLabel}`;

  const allPdf = documents.length > 0 && documents.every((d) => d.mimeType === "application/pdf");
  const filesWord = documents.length === 1 ? c.file : c.files;
  const attachedCountText = allPdf
    ? `${documents.length} ${filesWord} · PDF`
    : `${documents.length} ${filesWord}`;

  return (
    <Html lang={locale} style={{ colorScheme: "light" }}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;600;700&display=swap"
        />
        <Font
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47b1z3bWuYMBYro.woff2",
            format: "woff2",
          }}
          fontWeight={800}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E30-8s51ostz0rdg.woff2",
            format: "woff2",
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <style>{`
          a.rt-cta:hover { background-color: #eab308 !important; border-color: #eab308 !important; }
          a.rt-social:hover { opacity: 0.8; }
          a.rt-legal-link:hover { color: #ffffff !important; }
        `}</style>
      </Head>
      <Preview>{c.preview}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: desk, colorScheme: "light" }}>
        <Section style={{ backgroundColor: desk, padding: "48px 0" }}>
          <Section
            width={600}
            style={{
              width: 600,
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#ffffff",
              border: `1px solid ${neutral200}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* ── Header bar ── */}
            <Section style={{ backgroundColor: ink }}>
              <Row>
                <Column style={{ padding: "20px 0 20px 32px", width: "50%" }}>
                  <Img
                    src={`${BASE_URL}/assets/logos/logo_getrandomtrip_white.png`}
                    width={104}
                    height={26}
                    alt="Randomtrip"
                    style={{ display: "block" }}
                  />
                </Column>
                <Column align="right" style={{ padding: "20px 32px 20px 0", width: "50%", textAlign: "right" }}>
                  <Text style={taglineStyle}>{c.tagline}</Text>
                </Column>
              </Row>
            </Section>

            {/* ── Hero photo (no text over it) ── */}
            <Img
              src={`${BASE_URL}/images/emails/trip-start-hero.jpg`}
              width={600}
              height={260}
              alt={c.heroAlt}
              style={{ display: "block", width: "100%", maxWidth: 600, height: 260 }}
            />

            {/* ── Title panel ── */}
            <Section style={{ backgroundColor: ink, padding: "32px" }}>
              <Text style={eyebrowStyle}>
                {startDate ? formatEyebrow(startDate, locale) : ""}
              </Text>
              <Text style={titleStyle}>
                {c.titleLine1}
                <br />
                {c.titleLine2}
              </Text>
            </Section>

            {/* ── Greeting + body ── */}
            <Section style={{ padding: "32px 32px 8px" }}>
              <Text style={greetingStyle}>{c.greeting(firstName)}</Text>
              <Text style={bodyStyle}>{c.body}</Text>
            </Section>

            {/* ── Trip snapshot ── */}
            {showSnapshot && (
              <Section style={{ padding: "0 32px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    borderCollapse: "collapse",
                    border: `1px solid ${neutral200}`,
                    borderRadius: 12,
                    backgroundColor: ink50,
                    marginTop: 28,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={snapshotCellStyle}>
                        <Text style={snapshotLabelStyle}>{c.snapshotDates}</Text>
                        <Text style={snapshotValueStyle}>
                          {formatDateRange(startDate as Date, endDate as Date, locale)}
                        </Text>
                      </td>
                      <td style={{ width: 1, backgroundColor: ink100 }} />
                      <td style={snapshotCellStyle}>
                        <Text style={snapshotLabelStyle}>{c.snapshotNights}</Text>
                        <Text style={snapshotValueStyle}>{nightsValue}</Text>
                      </td>
                      <td style={{ width: 1, backgroundColor: ink100 }} />
                      <td style={snapshotCellStyle}>
                        <Text style={snapshotLabelStyle}>{c.snapshotTravelers}</Text>
                        <Text style={snapshotValueStyle}>{travelersValue}</Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            )}

            {/* ── Attached documents ── */}
            {documents.length > 0 && (
              <Section style={{ padding: "28px 32px 0" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    borderCollapse: "collapse",
                    border: `1px solid ${neutral200}`,
                    borderRadius: 12,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={docHeaderLeftStyle}>{c.attachedLabel}</td>
                      <td style={docHeaderRightStyle}>{attachedCountText}</td>
                    </tr>
                    {documents.map((doc, i) => (
                      <tr key={`${doc.label}-${i}`}>
                        <td
                          style={{
                            ...docNameCellStyle,
                            borderTop: i > 0 ? `1px solid ${neutral100}` : "none",
                          }}
                        >
                          {doc.label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {skippedCount > 0 && (
              <Text style={skippedNoticeStyle}>{c.skippedNotice(skippedCount)}</Text>
            )}

            {/* ── CTA ── */}
            <Section style={{ padding: "28px 32px 36px", textAlign: "center" }}>
              <Button href={ctaHref} className="rt-cta" style={ctaButtonStyle}>
                {c.cta}
              </Button>
              <Text style={ctaSubtextStyle}>{c.ctaSubtext}</Text>
            </Section>

            {/* ── Support band ── */}
            <Section style={{ backgroundColor: ink50, borderTop: `1px solid ${neutral200}`, padding: "22px 32px" }}>
              <Row>
                <Column style={{ width: 34, verticalAlign: "middle" }}>
                  <WhatsAppIcon />
                </Column>
                <Column style={{ verticalAlign: "middle" }}>
                  <Link href={WHATSAPP_HREF} style={supportTextStyle}>
                    {c.support}
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* ── Footer ── */}
            <Section style={{ backgroundColor: ink, padding: "32px", textAlign: "center" }}>
              <Text style={footerBrandStyle}>{c.footerBrand}</Text>
              <table role="presentation" align="center" cellPadding={0} cellSpacing={0} style={{ margin: "0 auto" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "0 6px" }}>
                      <SocialLink
                        href={INSTAGRAM_HREF}
                        src={`${BASE_URL}/images/newsletter/social-instagram.png`}
                        alt="Instagram"
                      />
                    </td>
                    <td style={{ padding: "0 6px" }}>
                      <SocialLink
                        href={FACEBOOK_HREF}
                        src={`${BASE_URL}/images/newsletter/social-facebook.png`}
                        alt="Facebook"
                      />
                    </td>
                    <td style={{ padding: "0 6px" }}>
                      <SocialLink
                        href={X_HREF}
                        src={`${BASE_URL}/images/newsletter/social-x.png`}
                        alt="X"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "16px 0" }}>
                <tbody>
                  <tr>
                    <td style={{ height: 1, backgroundColor: "rgba(255,255,255,0.12)", fontSize: 1, lineHeight: "1px" }}>
                      &nbsp;
                    </td>
                  </tr>
                </tbody>
              </table>
              <Text style={legalStyle}>
                © {year} RANDOMTRIP · {c.designedSerendipity}
                <br />
                <Link href={settingsHref} className="rt-legal-link" style={legalLinkStyle}>
                  {c.preferences}
                </Link>{" "}
                · {" "}
                <Link href={settingsHref} className="rt-legal-link" style={legalLinkStyle}>
                  {c.unsubscribe}
                </Link>
              </Text>
            </Section>
          </Section>
        </Section>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const taglineStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  fontWeight: 600,
  margin: 0,
  textAlign: "right",
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: feature,
  fontWeight: 600,
  margin: "0 0 10px",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  fontSize: "44px",
  lineHeight: "0.96",
  color: "#ffffff",
  letterSpacing: "-0.01em",
  margin: 0,
};

const greetingStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  fontSize: "26px",
  lineHeight: "1",
  color: ink,
  margin: "0 0 14px",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "17px",
  lineHeight: "1.55",
  color: neutral700,
  margin: "0 0 24px",
};

const snapshotCellStyle: React.CSSProperties = {
  padding: "18px 20px",
  verticalAlign: "top",
};

const snapshotLabelStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: ink500,
  fontWeight: 700,
  margin: "0 0 6px",
};

const snapshotValueStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  fontSize: "22px",
  lineHeight: "1",
  color: ink,
  margin: 0,
};

const docHeaderLeftStyle: React.CSSProperties = {
  padding: "14px 20px",
  backgroundColor: neutral50,
  borderBottom: `1px solid ${neutral200}`,
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: neutral600,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const docHeaderRightStyle: React.CSSProperties = {
  padding: "14px 20px",
  backgroundColor: neutral50,
  borderBottom: `1px solid ${neutral200}`,
  textAlign: "right",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.06em",
  color: neutral400,
  fontWeight: 600,
  width: "100%",
  whiteSpace: "nowrap",
};

const docNameCellStyle: React.CSSProperties = {
  padding: "13px 20px",
  textAlign: "left",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  color: ink,
  verticalAlign: "middle",
};

const skippedNoticeStyle: React.CSSProperties = {
  color: "#9a6b00",
  fontSize: "12.5px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: 400,
  margin: "16px 32px 0",
  lineHeight: "1.6",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textAlign: "center",
  backgroundColor: feature,
  border: `2px solid ${feature}`,
  borderRadius: 6,
  padding: "15px 40px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: textOnSun,
  textDecoration: "none",
};

const ctaSubtextStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "14px",
  lineHeight: "1.5",
  color: neutral500,
  textAlign: "center",
  margin: "12px 0 0",
};

const supportTextStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "14px",
  lineHeight: "1.5",
  color: neutral700,
  textDecoration: "none",
};

const footerBrandStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  fontSize: "15px",
  letterSpacing: "0.06em",
  color: feature,
  textAlign: "center",
  margin: "0 0 16px",
};

const legalStyle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  textAlign: "center",
  lineHeight: "1.8",
  margin: 0,
};

const legalLinkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  textDecoration: "none",
};
