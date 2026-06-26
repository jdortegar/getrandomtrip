import {
  Body,
  Button,
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

const BASE_URL = "https://getrandomtrip.com";
const XSED_URL = `${BASE_URL}/es/xsed`;

const img = (path: string) => `${BASE_URL}${path}`;

export default function XsedCampaign() {
  return (
    <Html lang="es">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;700;800&family=Barlow:wght@400;500;600;700&display=swap"
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
        Tu próximo XSED te está esperando. Solo 10 cupos. Cada domingo, sin
        aviso previo.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* ── 1. Hero ── */}
          <Section style={{ padding: "0", margin: "0" }}>
            <Row>
              <Column>
                <Img
                  src={img("/images/newsletter/xsed-hero-composed.png")}
                  width="600"
                  alt="Unite y recibí escapadas sorpresa cada domingo — XSED"
                  style={{ display: "block", width: "100%" }}
                />
              </Column>
            </Row>
          </Section>

          {/* ── 2. CTA / Waitlist ── */}
          <Section style={ctaSection}>
            <Button href={XSED_URL} style={ctaButton}>
              UNITE A LA LISTA DE ESPERA
            </Button>
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
            <Button href={XSED_URL} style={verTodasButton}>
              VER TODAS
            </Button>
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

          {/* ── 5. Footer ── */}
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

// CTA
const ctaSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "40px 40px 32px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#d97e4a",
  color: "#ffffff",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1px",
  textTransform: "uppercase",
  lineHeight: "24px",
  textDecoration: "none",
  padding: "12px 32px",
  borderRadius: "2px",
  display: "inline-block",
};

const ctaBody: React.CSSProperties = {
  color: "#979797",
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
  color: "#d97e4a",
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
  color: "#111827",
  margin: "0 0 12px",
  lineHeight: "1.05",
  textTransform: "uppercase",
  textAlign: "center",
};

const headingAccent: React.CSSProperties = {
  color: "#d97e4a",
  fontFamily: "'Barlow Condensed', Impact, 'Arial Narrow', Arial, sans-serif",
  fontWeight: "700",
};

const sectionSubtitle: React.CSSProperties = {
  color: "#888787",
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
  color: "#d97e4a",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "3px",
  textTransform: "uppercase",
  margin: "12px 0 4px",
  lineHeight: "1.4",
};

const dropTitle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  color: "#888787",
  fontSize: "25px",
  fontWeight: "300",
  margin: "0 0 8px",
  lineHeight: "1.2",
};

const dropDivider: React.CSSProperties = {
  borderTop: "1px solid #d97e4a",
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

const verTodasButton: React.CSSProperties = {
  backgroundColor: "#d97e4a",
  color: "#ffffff",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "12px 40px",
  borderRadius: "2px",
  display: "inline-block",
};

// El Veredicto
const veredictoSection: React.CSSProperties = {
  backgroundColor: "#fbfafa",
  padding: "40px 30px 20px",
  textAlign: "center",
};

const testimonialsRow: React.CSSProperties = {
  backgroundColor: "#fbfafa",
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
  backgroundColor: "#282828",
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
  color: "#282828",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 2px",
  lineHeight: "1.2",
};

const testimonialCountry: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#888787",
  fontSize: "12px",
  fontWeight: "300",
  margin: "0",
  lineHeight: "1.4",
};

const testimonialQuote: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#888787",
  fontSize: "13px",
  fontWeight: "400",
  textAlign: "center",
  margin: "0 0 20px",
  lineHeight: "1.7",
};

const verOpinionLink: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#d97e4a",
  fontSize: "12px",
  fontWeight: "300",
  letterSpacing: "1.2px",
  textDecoration: "none",
  display: "block",
  textAlign: "center",
  marginTop: "16px",
};

// Footer
const footerSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "24px 32px 28px",
  textAlign: "center",
  marginTop: "20px",
};

const footerCopyright: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#616161",
  fontSize: "9px",
  fontWeight: "500",
  letterSpacing: "1px",
  textAlign: "center",
  margin: "0",
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
  margin: "0 15px",
};
