import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface NewsletterGoLiveProps {
  appUrl?: string;
}

const DEFAULT_URL = "https://getrandomtrip.netlify.app";

export default function NewsletterGoLive({
  appUrl = DEFAULT_URL,
}: NewsletterGoLiveProps) {
  return (
    <Html lang="es">
      <Head>
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
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B6HLT1Q.woff2",
            format: "woff2",
          }}
          fontWeight={800}
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
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3t-4s51os.woff2",
            format: "woff2",
          }}
          fontWeight={500}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3_-Es51os.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        Tu próxima aventura te espera — diseñada especialmente para vos.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* ── Hero ── */}
          <Section
            style={{
              ...heroSection,
              backgroundImage: `linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.52)),url(${appUrl}/images/newsletter/hero-bg.png)`,
            }}
          >
            <Img
              src={`${appUrl}/assets/logos/logo_getrandomtrip_white.png`}
              width="130"
              alt="GetRandomTrip"
              style={logo}
            />
            <Heading style={heroHeading}>SERENDIPIA DISEÑADA</Heading>
            <Text style={heroSubtext}>
              Diseñamos tu viaje y te revelamos el destino desde 48h antes.
            </Text>
            <Button href={appUrl} style={ctaButton}>
              GET RANDOMTRIP
            </Button>
          </Section>

          {/* ── Quote ── */}
          <Section style={quoteSection}>
            <Text style={quoteText}>
              &ldquo;La sorpresa fue un regalo. Me encontré con lugares que no
              esperaba.&rdquo;
              <br />
              <span style={quoteAuthor}>— Camila, viajera</span>
            </Text>
          </Section>

          {/* ── Punto de Partida ── */}
          <Section style={midSection}>
            <Heading style={midHeading}>punto de partida</Heading>
            <Text style={midTagline}>dale forma a tu aventura</Text>
            <Text style={midDescription}>
              ¿Con quién vas a escribir tu próxima historia?
            </Text>
            <Text style={midBodyText}>
              Diseñamos tu escapada según tus preferencias, cuidando destino,
              logística y sorpresa.
            </Text>
          </Section>

          {/* ── Cards: SOLO + EN GRUPO ── */}
          <Row style={{ margin: "0", padding: "0" }}>
            <Column style={cardColumn}>
              <Section
                style={{
                  ...cardSection,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.55)),url(${appUrl}/images/newsletter/card-solo.png)`,
                }}
              >
                <Img
                  src={`${appUrl}/images/newsletter/trustpilot.png`}
                  width="70"
                  alt="Trustpilot 4.6"
                  style={trustpilot}
                />
                <Heading style={cardTitle}>SOLO</Heading>
                <Text style={cardSubtitle}>
                  Aventura personal sin compromisos.
                </Text>
              </Section>
            </Column>
            <Column style={cardColumn}>
              <Section
                style={{
                  ...cardSection,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.55)),url(${appUrl}/images/newsletter/card-grupo.png)`,
                }}
              >
                <Img
                  src={`${appUrl}/images/newsletter/trustpilot.png`}
                  width="70"
                  alt="Trustpilot 4.6"
                  style={trustpilot}
                />
                <Heading style={cardTitle}>EN GRUPO</Heading>
                <Text style={cardSubtitle}>Experiencias compartidas.</Text>
              </Section>
            </Column>
          </Row>

          {/* ── Card: EN PAREJA (full width) ── */}
          <Section
            style={{
              ...parejaCard,
              backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.55)),url(${appUrl}/images/newsletter/card-pareja.png)`,
            }}
          >
            <Img
              src={`${appUrl}/images/newsletter/trustpilot.png`}
              width="70"
              alt="Trustpilot 4.6"
              style={trustpilot}
            />
            <Heading style={cardTitle}>EN PAREJA</Heading>
            <Text style={cardSubtitle}>Escapadas románticas.</Text>
          </Section>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Row style={{ marginBottom: "16px" }}>
              <Column align="center">
                <Link
                  href="https://www.facebook.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={`${appUrl}/images/newsletter/social-facebook.png`}
                    width="24"
                    height="24"
                    alt="Facebook"
                  />
                </Link>
                <Link
                  href="https://www.instagram.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={`${appUrl}/images/newsletter/social-instagram.png`}
                    width="24"
                    height="24"
                    alt="Instagram"
                  />
                </Link>
                <Link href="https://x.com/getrandomtrip" style={socialLink}>
                  <Img
                    src={`${appUrl}/images/newsletter/social-x.png`}
                    width="24"
                    height="24"
                    alt="X"
                  />
                </Link>
              </Column>
            </Row>
            <Text style={footerText}>
              © 2026 Randomtrip · Viajar también es soltar el control.
            </Text>
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
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "600px",
  margin: "0 auto",
};

// Hero
const heroSection: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  textAlign: "center",
  padding: "56px 40px 52px",
};

const logo: React.CSSProperties = {
  margin: "0 auto 36px",
  display: "block",
};

const heroHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Impact, Arial Black, sans-serif",
  fontSize: "52px",
  fontWeight: "800",
  color: "#ffffff",
  margin: "0 0 14px",
  lineHeight: "1",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const heroSubtext: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "500",
  margin: "0 auto 28px",
  lineHeight: "1.6",
  maxWidth: "320px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#172c36",
  padding: "12px 32px",
  borderRadius: "3px",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  textDecoration: "none",
  display: "inline-block",
};

// Quote
const quoteSection: React.CSSProperties = {
  backgroundColor: "#fdf9f9",
  padding: "28px 48px",
  textAlign: "center",
};

const quoteText: React.CSSProperties = {
  color: "#595757",
  fontSize: "12px",
  fontWeight: "500",
  fontStyle: "italic",
  lineHeight: "1.7",
  margin: "0",
};

const quoteAuthor: React.CSSProperties = {
  fontStyle: "normal",
  fontWeight: "400",
};

// Mid section
const midSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "36px 40px 28px",
  textAlign: "center",
};

const midHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Impact, Arial Black, sans-serif",
  fontSize: "44px",
  fontWeight: "700",
  color: "#3f3f3f",
  margin: "0 0 8px",
  lineHeight: "1",
  textTransform: "lowercase",
};

const midTagline: React.CSSProperties = {
  color: "#4f96b6",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 8px",
  lineHeight: "1.5",
};

const midDescription: React.CSSProperties = {
  color: "#888787",
  fontSize: "13px",
  fontWeight: "400",
  margin: "0 0 12px",
  lineHeight: "1.5",
};

const midBodyText: React.CSSProperties = {
  color: "#888787",
  fontSize: "13px",
  fontWeight: "500",
  margin: "0",
  lineHeight: "1.6",
};

// Cards
const cardColumn: React.CSSProperties = {
  width: "50%",
  padding: "0",
};

const cardSection: React.CSSProperties = {
  backgroundColor: "#2a2a2a",
  backgroundSize: "cover",
  backgroundPosition: "center",
  textAlign: "left",
  padding: "20px 20px 24px",
  minHeight: "220px",
};

const parejaCard: React.CSSProperties = {
  backgroundColor: "#2a2a2a",
  backgroundSize: "cover",
  backgroundPosition: "center",
  textAlign: "left",
  padding: "32px 28px 36px",
  minHeight: "180px",
};

const trustpilot: React.CSSProperties = {
  marginBottom: "auto",
  display: "block",
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Impact, Arial Black, sans-serif",
  fontSize: "38px",
  fontWeight: "800",
  color: "#ffffff",
  margin: "16px 0 4px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const cardSubtitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "400",
  margin: "0",
  lineHeight: "1.4",
};

// Footer
const footerSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderTop: "1px solid #ebebeb",
  padding: "24px 32px 28px",
  textAlign: "center",
};

const socialLink: React.CSSProperties = {
  display: "inline-block",
  margin: "0 8px",
};

const footerText: React.CSSProperties = {
  color: "#616161",
  fontSize: "10px",
  fontWeight: "500",
  margin: "8px 0 0",
  lineHeight: "1.5",
};
