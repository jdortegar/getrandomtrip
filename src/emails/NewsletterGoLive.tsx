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

const steps = [
  {
    icon: "/images/newsletter/step-1.png",
    title: "Cuéntanos tu estilo",
    description:
      "Fechas, presupuesto, preferencias, restricciones y el tipo de experiencia que estás buscando.",
  },
  {
    icon: "/images/newsletter/step-2.png",
    title: "Diseñamos tu escapada",
    description:
      "Curamos destino, alojamiento, logística y experiencias según tus preferencias.",
  },
  {
    icon: "/images/newsletter/step-3.png",
    title: "Recibes el reveal",
    description:
      "48h antes te contamos a dónde vas y todo lo que necesitas para viajar sin fricción.",
  },
];

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
                  alt="SERENDIPIA DISEÑADA — Diseñamos tus viajes y escapadas, revelando el destino 48h antes."
                  style={{ display: "block", width: "100%" }}
                />
              </Column>
            </Row>
          </Section>

          {/* ── Intro body ── */}
          <Section style={introSection}>
            <Text style={introText}>
              Diseñamos tu escapada según tus preferencias, cuidando destino,
              logística y sorpresa.
            </Text>
          </Section>

          {/* ── Elige cómo quieres viajar ── */}
          <Section style={chooseSection}>
            <Text style={eyebrow}>DALE FORMA A TU VIAJE</Text>
            <Heading style={sectionHeading}>ELIGE CÓMO QUIERES VIAJAR</Heading>
            <Text style={sectionDescription}>
              Cada Randomtrip empieza con una pregunta simple: ¿con quién te
              quieres escapar?
            </Text>
          </Section>

          {/* ── Cards: SOLO + EN PAREJA ── */}
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
                alt="SOLO — Para viajar a tu ritmo, desconectar y dejar que el destino te sorprenda."
                style={cardImage}
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
                src={img("/images/newsletter/card-pareja.png")}
                width="264"
                alt="EN PAREJA — Para compartir una escapada con misterio, buena compañía y cero logística."
                style={cardImage}
              />
            </Column>
          </Row>

          {/* ── Spacer between card rows ── */}
          <Section style={{ padding: "6px 0" }} />

          {/* ── Card: EN GRUPO (full width) ── */}
          <Row>
            <Column style={{ paddingLeft: "30px", paddingRight: "30px" }}>
              <Img
                src={img("/images/newsletter/card-grupo.png")}
                width="540"
                alt="EN GRUPO — Para convertir una salida pendiente en una historia que nadie vio venir."
                style={cardImage}
              />
            </Column>
          </Row>

          {/* ── Cómo funciona ── */}
          <Section style={howSection}>
            <Heading style={sectionHeading}>CÓMO FUNCIONA</Heading>
            <Text style={sectionDescription}>
              Marcas el rumbo. Nosotros diseñamos la sorpresa.
            </Text>
          </Section>

          {/* ── 3-step infographic ── */}
          <Section style={stepsSection}>
            <Row>
              {steps.map((step) => (
                <Column key={step.title} style={stepColumn}>
                  <Img
                    src={img(step.icon)}
                    width="72"
                    alt={step.title}
                    style={stepIcon}
                  />
                  <Text style={stepTitle}>{step.title}</Text>
                  <Text style={stepDescription}>{step.description}</Text>
                </Column>
              ))}
            </Row>
          </Section>

          {/* ── Closing line ── */}
          <Section style={closingSection}>
            <Text style={closingHeadline}>
              No necesitas saber el destino para empezar el viaje.
            </Text>
            <Text style={closingSubtext}>
              Solo necesitas saber cómo quieres sentirte cuando llegues.
            </Text>
          </Section>

          {/* ── CTA ── */}
          <Section style={ctaSection}>
            <Button href={BASE_URL} style={ctaButton}>
              GETRANDOMTRIP!
            </Button>
          </Section>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Row>
              <Column align="center">
                <Text style={footerTagline}>
                  VIAJAR TAMBIÉN ES SOLTAR EL CONTROL.
                </Text>
              </Column>
            </Row>
            <Row>
              <Column align="center">
                <Text style={footerLogo}>
                  WONDER • WANDER • <span style={footerLogoScript}>REPEAT</span>
                </Text>
              </Column>
            </Row>
            <Row>
              <Column align="center">
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
            <Row>
              <Column align="center">
                <Text style={footerCopyright}>© 2026 RANDOMTRIP</Text>
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

const introSection: React.CSSProperties = {
  backgroundColor: "#f9f8f8",
  padding: "36px 40px",
  textAlign: "center",
};

const introText: React.CSSProperties = {
  color: "#888787",
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto",
  lineHeight: "1.79",
  maxWidth: "360px",
  textAlign: "center",
};

const chooseSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "48px 40px 32px",
  textAlign: "center",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#4f96b6",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "6px",
  textTransform: "uppercase",
  margin: "0 0 12px",
  lineHeight: "1.4",
  textAlign: "center",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "48px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 16px",
  lineHeight: "1.04",
  textTransform: "uppercase",
  textAlign: "center",
};

const sectionDescription: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto",
  lineHeight: "24px",
  maxWidth: "420px",
  textAlign: "center",
};

const cardColumn: React.CSSProperties = {
  width: "50%",
  padding: "0",
  verticalAlign: "top",
};

const cardImage: React.CSSProperties = {
  display: "block",
  width: "100%",
  borderRadius: "12px",
};

const howSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "56px 40px 40px",
  textAlign: "center",
};

const stepsSection: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "48px 40px",
};

const stepColumn: React.CSSProperties = {
  width: "33.33%",
  padding: "0 8px",
  textAlign: "center",
  verticalAlign: "top",
};

const stepIcon: React.CSSProperties = {
  display: "block",
  margin: "0 auto 20px",
};

const stepTitle: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.3",
  textAlign: "center",
};

const stepDescription: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#4b5563",
  fontSize: "12px",
  fontWeight: "400",
  margin: "0",
  lineHeight: "24px",
  textAlign: "center",
};

const closingSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "56px 40px 24px",
  textAlign: "center",
};

const closingHeadline: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#111827",
  fontSize: "20px",
  fontWeight: "400",
  margin: "0 auto 16px",
  lineHeight: "27px",
  maxWidth: "300px",
  textAlign: "center",
};

const closingSubtext: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#888",
  fontSize: "13px",
  fontWeight: "400",
  margin: "0 auto",
  lineHeight: "1.79",
  maxWidth: "380px",
  textAlign: "center",
};

const ctaSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "8px 40px 40px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#ffc500",
  color: "#172c36",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1.2px",
  lineHeight: "24px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "11px 40px",
  borderRadius: "3px",
  display: "inline-block",
};

const footerSection: React.CSSProperties = {
  marginTop: "12px",
  backgroundColor: "#ffffff",
  padding: "24px 32px 32px",
  textAlign: "center",
};

const footerTagline: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#626262",
  fontSize: "9px",
  fontWeight: "400",
  letterSpacing: "0.9px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0 0 16px",
  lineHeight: "1.5",
};

const footerLogo: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#626262",
  fontSize: "16px",
  fontWeight: "400",
  letterSpacing: "2px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0 0 16px",
  lineHeight: "1.4",
};

const footerLogoScript: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  fontSize: "16px",
  fontWeight: "400",
  letterSpacing: "2px",
  textTransform: "uppercase",
  textAlign: "center",
  color: "#ffc500",
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
  letterSpacing: "0.9px",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "16px 0 0",
  lineHeight: "1.5",
};
