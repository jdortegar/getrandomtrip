import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";
import { getApplicationOrigin } from "@/lib/deployment";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { EMAIL_ASSET_ORIGIN, emailColors, emailFonts } from "./tokens";

interface EmailFooterProps {
  locale: "es" | "en";
}

const socials = [
  { icon: "instagram", label: "ariaInstagram", href: "https://instagram.com/getrandomtrip" },
  { icon: "facebook", label: "ariaFacebook", href: "https://facebook.com/getrandomtrip" },
  { icon: "linkedin", label: "ariaLinkedin", href: "https://www.linkedin.com/company/getrandomtrip" },
] as const;

/**
 * Email version of the app footer (`src/components/layout/Footer.tsx`): same
 * dictionary strings, logo, legal notice, social links and tagline strip.
 */
export default function EmailFooter({ locale }: EmailFooterProps) {
  const dict = locale === "en" ? enDict : esDict;
  const f = dict.footer;
  const origin = getApplicationOrigin();
  const links = [
    { href: "/terms", label: f.termsOfService },
    { href: "/privacy", label: f.privacyPolicy },
    { href: "/contact", label: f.contact },
  ];

  return (
    <Section className="rt-px" style={footer}>
      <Row>
        <Column className="rt-stack" style={{ verticalAlign: "middle" }}>
          <Img
            alt={dict.common.siteName}
            height={45}
            src={`${EMAIL_ASSET_ORIGIN}/assets/logos/logo_tagline_email.png`}
            style={{ display: "block" }}
            width={180}
          />
        </Column>
        <Column align="right" className="rt-stack" style={{ verticalAlign: "middle" }}>
          {socials.map(({ icon, label, href }) => (
            <Link className="rt-social" href={href} key={icon} style={socialLink}>
              <Img
                alt={f[label]}
                height={18}
                src={`${EMAIL_ASSET_ORIGIN}/images/newsletter/social-${icon}-teal.png`}
                style={{ display: "block", margin: "8px" }}
                width={18}
              />
            </Link>
          ))}
        </Column>
      </Row>

      <Text style={notice}>
        {f.entityNotice}
        <br />
        {f.entityAddress}
      </Text>

      <Text style={linkRow}>
        {links.map(({ href, label }, index) => (
          <React.Fragment key={href}>
            {index > 0 && <span style={separator}>·</span>}
            <Link href={`${origin}${pathForLocale(locale, href)}`} style={link}>
              {label}
            </Link>
          </React.Fragment>
        ))}
      </Text>

      <Section style={rule} />

      <Text style={tagline}>{f.tagline}</Text>
      <Text style={copyright}>
        © {new Date().getFullYear()} {dict.common.siteName}. {f.copyright}
      </Text>
    </Section>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const footer: React.CSSProperties = {
  borderTop: `1px solid ${emailColors.border}`,
  padding: "32px 40px 28px",
};

const socialLink: React.CSSProperties = {
  backgroundColor: emailColors.surface,
  border: `1px solid ${emailColors.border}`,
  borderRadius: "50%",
  display: "inline-block",
  marginLeft: "8px",
};

const notice: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "20px 0 12px",
};

const linkRow: React.CSSProperties = {
  fontFamily: emailFonts.body,
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0",
};

const link: React.CSSProperties = {
  color: emailColors.primary,
  fontWeight: "600",
  textDecoration: "underline",
};

const separator: React.CSSProperties = {
  color: emailColors.muted,
  padding: "0 8px",
};

const rule: React.CSSProperties = {
  borderTop: `1px solid ${emailColors.border}`,
  margin: "20px 0 16px",
};

const tagline: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.human,
  fontSize: "18px",
  lineHeight: "1.4",
  margin: "0 0 10px",
};

const copyright: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};
