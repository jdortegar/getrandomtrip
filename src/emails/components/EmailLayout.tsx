import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Img,
  Preview,
  Section,
} from "@react-email/components";
import * as React from "react";
import EmailClientResets from "./EmailClientResets";
import EmailFooter from "./EmailFooter";
import { EMAIL_ASSET_ORIGIN, emailColors, emailFonts } from "./tokens";

interface EmailLayoutProps {
  locale: "es" | "en";
  preview: string;
  children: React.ReactNode;
}

// Clients that honour <style> stack the footer and drop the card edge on phones.
const responsiveCss = `
@media (max-width: 480px) {
  .rt-px { padding-left: 24px !important; padding-right: 24px !important; }
  .rt-card-body { padding: 32px 24px 28px !important; }
  .rt-detail-value { font-size: 18px !important; }
  .rt-stack { display: block !important; width: 100% !important; text-align: left !important; }
  .rt-stack + .rt-stack { padding-top: 14px !important; }
  .rt-social { margin-left: 0 !important; margin-right: 8px !important; }
}`;

export default function EmailLayout({
  locale,
  preview,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang={locale} style={{ colorScheme: "light" }}>
      <Head>
        <EmailClientResets />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {/* Barlow 400 last: each <Font> sets the global family, last one wins. */}
        <Font
          fallbackFontFamily="Georgia"
          fontFamily="Nothing You Could Do"
          fontStyle="normal"
          fontWeight={400}
          webFont={{
            url: "https://fonts.gstatic.com/s/nothingyoucoulddo/v21/oY1B8fbBpaP5OX3DtrRYf_Q2BPB1SnfZb3OOnVsH2pmp.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow Condensed"
          fontStyle="normal"
          fontWeight={700}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuYMBYro.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow"
          fontStyle="normal"
          fontWeight={500}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3_-gs51ostz0rdg.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow"
          fontStyle="normal"
          fontWeight={600}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E30-8s51ostz0rdg.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow"
          fontStyle="normal"
          fontWeight={700}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3t-4s51ostz0rdg.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow"
          fontStyle="normal"
          fontWeight={400}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5ynghnQ.woff2",
            format: "woff2",
          }}
        />
        <style>{responsiveCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body id="body" style={body}>
        <Container style={container}>
          {/* ── Header: colour lockup on Off White ── */}
          <Section className="rt-px" style={header}>
            <Img
              // PNG, not SVG: Gmail and Outlook don't render SVG images.
              alt="Randomtrip"
              height={40}
              src={`${EMAIL_ASSET_ORIGIN}/assets/logos/logo_color_email.png`}
              style={{ display: "block" }}
              width={160}
            />
          </Section>

          {/* ── Card ── */}
          {/* Side margins match the logo and footer padding, so the box's
              edges line up with their text. */}
          <Section className="rt-px" style={cardWrapper}>
            <Section style={card}>
              <Section className="rt-card-body" style={cardBody}>
                {children}
              </Section>
            </Section>
          </Section>

          <EmailFooter locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: emailColors.ground,
  colorScheme: "light",
  fontFamily: emailFonts.body,
  margin: "0",
  padding: "0",
};

const container: React.CSSProperties = {
  backgroundColor: emailColors.ground,
  margin: "0 auto",
  maxWidth: "600px",
};

const header: React.CSSProperties = {
  padding: "32px 40px 28px",
};

const cardWrapper: React.CSSProperties = {
  padding: "0 40px 40px",
};

const card: React.CSSProperties = {
  backgroundColor: emailColors.surface,
  border: `1px solid ${emailColors.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
};

const cardBody: React.CSSProperties = {
  padding: "40px 32px 32px",
  textAlign: "left",
};
