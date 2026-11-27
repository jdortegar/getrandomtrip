import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
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

const BASE_URL = "https://getrandomtrip.com";
const XSED_URL = `${BASE_URL}/es/xsed`;

const img = (path: string) => `${BASE_URL}${path}`;

export default function XsedCampaign() {
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
        <style>{`
          @media only screen and (max-width: 480px) {
            .col-half {
              display: block !important;
              width: 100% !important;
              padding-left: 20px !important;
              padding-right: 20px !important;
              margin-bottom: 16px !important;
            }
          }
        `}</style>
        <Font
          fallbackFontFamily="Arial"
          fontFamily="Barlow Condensed"
          fontStyle="normal"
          fontWeight={300}
          webFont={{
            url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47rxz3bWuYMBYro.woff2",
            format: "woff2",
          }}
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
        Tu próximo XSED te está esperando. Solo 10 cupos. Cada domingo, sin
        aviso previo.
      </Preview>
      <Body id="body" style={body}>
        <Container style={container}>
          {/* ── 1. Hero ── */}
          <Section style={{ padding: "0", margin: "0" }}>
            <Row>
              <Column>
                <Img
                  src={img("/images/newsletter/xsed-hero-composed.png")}
                  width="600"
                  alt="Unite y recibí escapadas sorpresa cada fin de semana — XSED"
                  style={{ display: "block", width: "100%" }}
                />
              </Column>
            </Row>
          </Section>

          {/* ── 2. CTA / Waitlist ── */}
          <Section style={ctaSection}>
            <EmailButton align="center" href={XSED_URL} variant="xsed">
              Unite a la lista de espera
            </EmailButton>
            <Text style={ctaBody}>
              Te avisaremos 10 minutos antes de que se abra la pasarela cada
              domingo.
              <br />
              Si parpadeás, te quedás fuera.
            </Text>
          </Section>

          {/* ── 3. Bitácora de Escapadas ── */}
          <Section style={bitacoraHeaderSection}>
            <Text style={eyebrowLabel}>drops anteriores</Text>
            <Heading as="h2" style={sectionHeading}>
              Bitácora de Escapadas
              <br />
              by <span style={headingAccent}>XSED</span>
            </Heading>
            <Text style={sectionSubtitle}>
              Lo que otros vivieron. Lo que tú podrías vivir.
            </Text>
          </Section>

          {/* ── Featured drop: Mendoza ── */}
          <Section style={dropFeaturedSection}>
            <Row>
              <Column>
                <Img
                  src={img("/images/newsletter/xsed-drop-mendoza.png")}
                  width="540"
                  alt="Mendoza desde arriba — XSED Nº5"
                  style={{
                    display: "block",
                    width: "100%",
                    borderRadius: "4px",
                  }}
                />
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={dropDate}>20 febrero 2026</Text>
                <Text style={dropTitle}>Mendoza desde arriba</Text>
                <Hr style={dropDivider} />
              </Column>
            </Row>
          </Section>

          {/* ── Two smaller drops ── */}
          <Row style={{ margin: "0", padding: "0 0 16px" }}>
            <Column style={smallDropColumnLeft}>
              <Img
                src={img("/images/newsletter/xsed-drop-formosa.png")}
                width="264"
                alt="Formosa tiene un secreto — XSED Nº4"
                style={{ display: "block", width: "100%", borderRadius: "4px" }}
              />
              <Text style={dropDate}>20 marzo 2026</Text>
              <Text style={dropTitle}>Formosa tiene un secreto</Text>
              <Hr style={dropDivider} />
            </Column>
            <Column style={smallDropColumnRight}>
              <Img
                src={img("/images/newsletter/xsed-drop-tucuman.png")}
                width="264"
                alt="Tucumán star night — XSED Nº3"
                style={{ display: "block", width: "100%", borderRadius: "4px" }}
              />
              <Text style={dropDate}>2 enero 2026</Text>
              <Text style={dropTitle}>Tucumán star night</Text>
              <Hr style={dropDivider} />
            </Column>
          </Row>

          {/* ── "ver todas" button ── */}
          <Section style={verTodasSection}>
            <EmailButton align="center" href={XSED_URL} variant="xsed">
              Ver todas
            </EmailButton>
          </Section>

          {/* ── 4. El Veredicto ── */}
          <Section style={veredictoSection}>
            <Text style={eyebrowLabel}>OPINIONES DE VIAJEROS</Text>
            <Heading as="h2" style={sectionHeading}>
              EL VEREDICTO
            </Heading>
            <Text style={sectionSubtitle}>
              Tu próximo XSED está a un solo click de distancia. No lo pienses
              más.
            </Text>
          </Section>

          {/* ── Testimonials ── */}
          <Row style={testimonialsRow}>
            <Column style={testimonialColumn} className="col-half">
              <Section style={testimonialCard}>
                <Text style={testimonialQuote}>
                  Compré el Drop el domingo. El sábado estaba tomando vino en un
                  viñedo que ni sabía que existía a 2 horas de mi casa. Mateo,
                  28 años.
                </Text>
                <Section style={avatarRowWrapper}>
                  <Row>
                    <Column style={avatarCell}>
                      <Section style={avatarCircle}>
                        <Text style={avatarInitial}>M</Text>
                      </Section>
                    </Column>
                    <Column>
                      <Text style={testimonialName}>Mateo</Text>
                      <Text style={testimonialCountry}>🇦🇷 Argentina</Text>
                    </Column>
                  </Row>
                </Section>
                <Link href={XSED_URL} style={verOpinionLink}>
                  Ver opinión completa
                </Link>
              </Section>
            </Column>
            <Column style={testimonialColumn} className="col-half">
              <Section style={testimonialCard}>
                <Text style={testimonialQuote}>
                  La adrenalina de abrir el WhatsApp 48 horas antes para ver a
                  dónde íbamos fue increíble. El hotel fue un 10/10. Sofía &amp;
                  Carlos.
                </Text>
                <Section style={avatarRowWrapper}>
                  <Row>
                    <Column style={avatarCell}>
                      <Section style={avatarCircle}>
                        <Text style={avatarInitial}>L</Text>
                      </Section>
                    </Column>
                    <Column>
                      <Text style={testimonialName}>Sofita</Text>
                      <Text style={testimonialCountry}>🇦🇷 Argentina</Text>
                    </Column>
                  </Row>
                </Section>
                <Link href={XSED_URL} style={verOpinionLink}>
                  Ver opinión completa
                </Link>
              </Section>
            </Column>
          </Row>

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

// CTA
const ctaSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "40px 40px 32px",
  textAlign: "center",
};


const ctaBody: React.CSSProperties = {
  color: emailColors.muted,
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "20px auto 0",
  lineHeight: "1.7",
  maxWidth: "420px",
  textAlign: "center",
};

// Bitácora header
const bitacoraHeaderSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "40px 30px 20px",
  textAlign: "center",
};

const eyebrowLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.xsed,
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "4px",
  textTransform: "uppercase",
  margin: "0 0 8px",
  lineHeight: "1.4",
  textAlign: "center",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', Impact, 'Arial Narrow', Arial, sans-serif",
  fontSize: "48px",
  fontWeight: "700",
  color: emailColors.ink,
  margin: "0 0 12px",
  lineHeight: "1.05",
  textTransform: "uppercase",
  textAlign: "center",
};

const headingAccent: React.CSSProperties = {
  color: emailColors.xsed,
  fontFamily: "'Barlow Condensed', Impact, 'Arial Narrow', Arial, sans-serif",
  fontWeight: "700",
};

const sectionSubtitle: React.CSSProperties = {
  color: emailColors.muted,
  fontSize: "12px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0",
  lineHeight: "1.6",
  textAlign: "center",
};

// Drop cards
const dropFeaturedSection: React.CSSProperties = {
  padding: "20px 30px 0",
  marginBottom: "40px",
};

const dropDate: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.xsed,
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "3px",
  textTransform: "uppercase",
  margin: "12px 0 4px",
  lineHeight: "1.4",
};

const dropTitle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: emailColors.muted,
  fontSize: "25px",
  fontWeight: "300",
  margin: "0 0 8px",
  lineHeight: "1.2",
};

const dropDivider: React.CSSProperties = {
  borderTop: `1px solid ${emailColors.xsed}`,
  margin: "8px 0 0",
};

const smallDropColumnLeft: React.CSSProperties = {
  width: "50%",
  paddingLeft: "30px",
  paddingRight: "6px",
  verticalAlign: "top",
};

const smallDropColumnRight: React.CSSProperties = {
  width: "50%",
  paddingLeft: "6px",
  paddingRight: "30px",
  verticalAlign: "top",
};

const verTodasSection: React.CSSProperties = {
  textAlign: "center",
  padding: "16px 30px 40px",
};


// El Veredicto
const veredictoSection: React.CSSProperties = {
  backgroundColor: emailColors.ground,
  padding: "40px 30px 20px",
  textAlign: "center",
};

const testimonialsRow: React.CSSProperties = {
  backgroundColor: emailColors.ground,
  margin: "0",
  padding: "0 20px 40px",
};

const testimonialColumn: React.CSSProperties = {
  width: "50%",
  padding: "0 6px",
  verticalAlign: "top",
};

const testimonialCard: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "24px 20px 20px",
  borderRadius: "8px",
};

const avatarRowWrapper: React.CSSProperties = {
  width: "auto",
  margin: "0 auto",
  padding: "0",
};

const avatarCell: React.CSSProperties = {
  width: "44px",
  paddingRight: "10px",
  verticalAlign: "middle",
};

const avatarCircle: React.CSSProperties = {
  backgroundColor: emailColors.ink,
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  textAlign: "center",
  padding: "0",
};

const avatarInitial: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
  lineHeight: "44px",
  textAlign: "center",
};

const testimonialName: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.ink,
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 2px",
  lineHeight: "1.2",
};

const testimonialCountry: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.muted,
  fontSize: "12px",
  fontWeight: "300",
  margin: "0",
  lineHeight: "1.4",
};

const testimonialQuote: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.muted,
  fontSize: "13px",
  fontWeight: "400",
  textAlign: "center",
  margin: "0 0 20px",
  lineHeight: "1.7",
};

const verOpinionLink: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: emailColors.xsed,
  fontSize: "12px",
  fontWeight: "300",
  letterSpacing: "1.2px",
  textDecoration: "none",
  display: "block",
  textAlign: "center",
  marginTop: "16px",
};

// Footer



