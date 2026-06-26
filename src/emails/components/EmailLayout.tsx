import {
  Body,
  Column,
  Container,
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

interface EmailLayoutProps {
  locale: "es" | "en";
  preview: string;
  children: React.ReactNode;
}

const BASE_URL = "https://getrandomtrip.com";

const footerTaglines = {
  es: "VIAJAR TAMBIÉN ES SOLTAR EL CONTROL.",
  en: "TRAVEL IS ALSO ABOUT LETTING GO.",
};

export default function EmailLayout({
  locale,
  preview,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang={locale} style={{ colorScheme: "light" }}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;700&display=swap"
        />
        <Font
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B43LT1Q.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v12/7cHpv4kjgoGqM7E3b8s8yn4.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* ── Header ── */}
          <Section style={headerSection}>
            <Img
              src={`${BASE_URL}/assets/logos/logo_getrandomtrip_1.png`}
              width={160}
              alt="GetRandomTrip"
              style={{ display: "block", margin: "0 auto" }}
            />
          </Section>

          {/* ── Main ── */}
          <Section style={mainSection}>{children}</Section>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Row>
              <Column align="center">
                <Text style={footerCopyright}>© 2026 RANDOMTRIP</Text>
              </Column>
            </Row>
            <Row>
              <Column align="center">
                <Text style={footerTagline}>{footerTaglines[locale]}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ height: "20px" }} />
            </Row>
            <Row>
              <Column align="center">
                <Link
                  href="https://www.instagram.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={`${BASE_URL}/images/newsletter/social-instagram.png`}
                    width={24}
                    height={24}
                    alt="Instagram"
                  />
                </Link>
                <Link
                  href="https://www.facebook.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={`${BASE_URL}/images/newsletter/social-facebook.png`}
                    width={24}
                    height={24}
                    alt="Facebook"
                  />
                </Link>
                <Link href="https://x.com/getrandomtrip" style={socialLink}>
                  <Img
                    src={`${BASE_URL}/images/newsletter/social-x.png`}
                    width={24}
                    height={24}
                    alt="X"
                  />
                </Link>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  margin: "0",
  padding: "0",
  fontFamily: "'Barlow', Arial, Helvetica, sans-serif",
  colorScheme: "light",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "600px",
  margin: "0 auto",
};

const headerSection: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  padding: "24px 40px",
  textAlign: "center",
};

const mainSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "48px 40px",
  textAlign: "center",
};

const footerSection: React.CSSProperties = {
  marginTop: "20px",
  backgroundColor: "#ffffff",
  padding: "24px 32px 28px",
  textAlign: "center",
};

const footerCopyright: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#626262",
  fontSize: "9px",
  fontWeight: "400",
  letterSpacing: "1px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0 0 10px",
  lineHeight: "1.5",
};

const footerTagline: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#626262",
  fontSize: "9px",
  fontWeight: "400",
  letterSpacing: "1px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0",
  lineHeight: "1.5",
};

const socialLink: React.CSSProperties = {
  display: "inline-block",
  margin: "0 8px",
};
