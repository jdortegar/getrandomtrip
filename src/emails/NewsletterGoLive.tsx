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

const BASE_URL = "https://getrandomtrip.com";

const img = (path: string) => `${BASE_URL}${path}`;

export default function NewsletterGoLive({
  appUrl: _appUrl = BASE_URL,
}: NewsletterGoLiveProps) {
  return (
    <Html lang="es">
      <Head>
        {/* Google Fonts link — loaded by browsers and Gmail/Apple Mail */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;700&family=Nothing+You+Could+Do&display=swap"
        />
        <Font
          fontFamily="Nothing You Could Do"
          fallbackFontFamily="Georgia"
          webFont={{
            url: "https://fonts.gstatic.com/s/nothingyoucoulddo/v20/oY1B8fbBpaP5OX3DtrRYf_Q2BPB1SnfZb0OJ.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
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
          <Section style={heroSection}>
            <Row>
              <Column>
                <Img
                  src={img("/images/newsletter/hero-bg.png")}
                  width="600"
                  alt="SERENDIPIA DISEÑADA — Diseñamos tu viaje y te revelamos el destino desde 48h antes."
                  style={{ display: "block", width: "100%" }}
                />
              </Column>
            </Row>
          </Section>

          {/* ── CTA ── */}
          <Section style={ctaSection}>
            <Text style={ctaBodyText}>
              Diseñamos tu escapada según tus preferencias, cuidando destino,
              logística y sorpresa.
            </Text>
            <Button href={BASE_URL} style={ctaButton}>
              GETRANDOMTRIP!
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
            <Text style={midTagline}>DALE FORMA A TU AVENTURA</Text>
            <Heading style={midHeading}>PUNTO DE PARTIDA</Heading>
            <Text style={midDescription}>
              ¿Con quién vas a escribir tu próxima historia?
            </Text>
          </Section>

          {/* ── Cards: SOLO + EN GRUPO ── */}
          <Row style={{ margin: "0", padding: "0" }}>
            <Column
              style={{
                ...cardColumn,
                paddingLeft: "30px",
                paddingRight: "6px",
              }}
            >
              <Img
                src={img("/images/newsletter/card-solo.png")}
                width="264"
                alt="SOLO — Aventura personal sin compromisos."
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: "12px",
                }}
              />
            </Column>
            <Column
              style={{
                ...cardColumn,
                paddingLeft: "6px",
                paddingRight: "30px",
              }}
            >
              <Img
                src={img("/images/newsletter/card-grupo.png")}
                width="264"
                alt="EN GRUPO — Experiencias compartidas."
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: "12px",
                }}
              />
            </Column>
          </Row>

          {/* ── Spacer between card rows ── */}
          <Section style={{ padding: "6px 0" }} />

          {/* ── Card: EN PAREJA (full width) ── */}
          <Row>
            <Column style={{ paddingLeft: "30px", paddingRight: "30px" }}>
              <Img
                src={img("/images/newsletter/card-pareja.png")}
                width="540"
                alt="EN PAREJA — Escapadas románticas."
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: "12px",
                }}
              />
            </Column>
          </Row>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Row>
              <Column align="center">
                <Text style={footerCopyright}>© 2026 RANDOMTRIP</Text>
              </Column>
            </Row>
            <Row>
              <Column align="center">
                <Text style={footerTagline}>
                  VIAJAR TAMBIÉN ES SOLTAR EL CONTROL.
                </Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ height: "60px" }} />
            </Row>
            <Row>
              <Column align="center">
                <Link
                  href="https://www.instagram.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={img("/images/newsletter/social-instagram.png")}
                    width="24"
                    height="24"
                    alt="Instagram"
                  />
                </Link>
                <Link
                  href="https://www.facebook.com/getrandomtrip"
                  style={socialLink}
                >
                  <Img
                    src={img("/images/newsletter/social-facebook.png")}
                    width="24"
                    height="24"
                    alt="Facebook"
                  />
                </Link>
                <Link href="https://x.com/getrandomtrip" style={socialLink}>
                  <Img
                    src={img("/images/newsletter/social-x.png")}
                    width="24"
                    height="24"
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
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "600px",
  margin: "0 auto",
};

const heroSection: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
};

const ctaSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "48px 40px",
  textAlign: "center",
};

const ctaBodyText: React.CSSProperties = {
  color: "#888787",
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 32px",
  lineHeight: "1.7",
  maxWidth: "340px",
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

const quoteSection: React.CSSProperties = {
  backgroundColor: "#fdf9f9",
  padding: "28px 48px",
  textAlign: "center",
};

const quoteText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "12px",
  fontFamily: "'Barlow', Arial, sans-serif",
  textAlign: "left",
  fontWeight: "400",
  fontStyle: "italic",
  lineHeight: "3",
  margin: "0",
};

const quoteAuthor: React.CSSProperties = {
  fontStyle: "normal",
  fontWeight: "400",
};

const midSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "48px 40px 40px",
  textAlign: "center",
};

const midTagline: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#4f96b6",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "6px",
  textTransform: "uppercase",
  margin: "0 0 12px",
  lineHeight: "1.4",
};

const midHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "48px",
  fontWeight: "800",
  color: "#3f3f3f",
  margin: "0 0 20px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const midDescription: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
  fontWeight: "400",
  margin: "0",
  lineHeight: "1.6",
};

const cardColumn: React.CSSProperties = {
  width: "50%",
  padding: "0",
};

const footerSection: React.CSSProperties = {
  marginTop: "20px",
  backgroundColor: "#ffffff",
  padding: "24px 32px 28px",
  textAlign: "center",
};

const socialLink: React.CSSProperties = {
  display: "inline-block",
  margin: "0 15px",
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
