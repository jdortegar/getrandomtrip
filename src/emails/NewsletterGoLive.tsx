import {
  Body,
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
import EmailClientResets from "./components/EmailClientResets";
import EmailButton from "./components/EmailButton";
import EmailFooter from "./components/EmailFooter";
import { emailColors } from "./components/tokens";

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
        <EmailClientResets />
        <Font
          fontFamily="Nothing You Could Do"
          fallbackFontFamily="Georgia"
          webFont={{
            url: "https://fonts.gstatic.com/s/nothingyoucoulddo/v21/oY1B8fbBpaP5OX3DtrRYf_Q2BPB1SnfZb3OOnVsH2pmp.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuYMBYro.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5ynghnQ.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3_-gs51ostz0rdg.woff2",
            format: "woff2",
          }}
          fontWeight={500}
          fontStyle="normal"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3t-4s51ostz0rdg.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        Tu próxima aventura te espera — diseñada especialmente para vos.
      </Preview>
      <Body id="body" style={body}>
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
            <EmailButton align="center" href={BASE_URL} variant="feature">
              GETRANDOMTRIP!
            </EmailButton>
          </Section>

          <EmailFooter locale="es" />
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: emailColors.ground,
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
  backgroundColor: emailColors.ground,
  padding: "36px 40px",
  textAlign: "center",
};

const introText: React.CSSProperties = {
  color: emailColors.muted,
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
  color: emailColors.primary,
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
  color: emailColors.ink,
  margin: "0 0 16px",
  lineHeight: "1.04",
  textTransform: "uppercase",
  textAlign: "center",
};

const sectionDescription: React.CSSProperties = {
  color: emailColors.muted,
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
  backgroundColor: emailColors.ground,
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
  color: emailColors.ink,
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.3",
  textAlign: "center",
};

const stepDescription: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.muted,
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
  color: emailColors.ink,
  fontSize: "20px",
  fontWeight: "400",
  margin: "0 auto 16px",
  lineHeight: "27px",
  maxWidth: "300px",
  textAlign: "center",
};

const closingSubtext: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.muted,
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







