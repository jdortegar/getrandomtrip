import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import {
  parseCampaignMarkdown,
  type MarkdownBlock,
  type MarkdownInline,
} from "@/lib/email-campaigns/markdown";
import type { CampaignEmailPromo, CampaignLocale } from "@/types/emailCampaign";
import EmailLayout from "./components/EmailLayout";

interface CampaignEmailProps {
  locale: CampaignLocale;
  preheader?: string | null;
  title: string;
  bodyMarkdown: string;
  cta?: { label: string; url: string } | null;
  promo?: CampaignEmailPromo | null;
  /** Signed per-recipient link, or the bare page for previews and tests. */
  unsubscribeUrl: string;
}

const copy = {
  es: {
    promoLabel: "Tu código",
    validUntil: (date: string) => `Válido hasta el ${date}`,
    footer: "Recibís este email porque te sumaste a la lista de Randomtrip.",
    unsubscribe: "Darme de baja",
  },
  en: {
    promoLabel: "Your code",
    validUntil: (date: string) => `Valid until ${date}`,
    footer:
      "You're receiving this email because you joined the Randomtrip list.",
    unsubscribe: "Unsubscribe",
  },
};

export function formatPromoExpiry(
  expiresAt: string,
  locale: CampaignLocale,
): string | null {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function renderInline(nodes: MarkdownInline[]): React.ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return <React.Fragment key={index}>{node.value}</React.Fragment>;
      case "break":
        return <br key={index} />;
      case "strong":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "em":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "link":
        return (
          <Link href={node.href} key={index} style={inlineLink}>
            {renderInline(node.children)}
          </Link>
        );
    }
  });
}

function renderBlock(block: MarkdownBlock, index: number): React.ReactNode {
  if (block.type === "paragraph") {
    return (
      <Text key={index} style={bodyText}>
        {renderInline(block.children)}
      </Text>
    );
  }
  const items = block.items.map((item, itemIndex) => (
    <li key={itemIndex} style={listItem}>
      {renderInline(item)}
    </li>
  ));
  return block.ordered ? (
    <ol key={index} style={list}>
      {items}
    </ol>
  ) : (
    <ul key={index} style={list}>
      {items}
    </ul>
  );
}

export default function CampaignEmail({
  locale,
  preheader,
  title,
  bodyMarkdown,
  cta,
  promo,
  unsubscribeUrl,
}: CampaignEmailProps) {
  const c = copy[locale];
  const expiry = promo?.expiresAt
    ? formatPromoExpiry(promo.expiresAt, locale)
    : null;

  return (
    <EmailLayout locale={locale} preview={preheader?.trim() || title}>
      <Heading style={heading}>{title}</Heading>
      <Section style={bodySection}>
        {parseCampaignMarkdown(bodyMarkdown).map(renderBlock)}
      </Section>

      {promo && (
        <Section style={promoSection}>
          <Text style={promoLabel}>{c.promoLabel}</Text>
          <Text style={promoCode}>{promo.code}</Text>
          <Text style={promoDiscount}>{promo.discountLabel}</Text>
          {expiry && <Text style={promoExpiry}>{c.validUntil(expiry)}</Text>}
        </Section>
      )}

      {cta && (
        <Section style={ctaSection}>
          <Button href={cta.url} style={ctaButton}>
            {cta.label}
          </Button>
        </Section>
      )}

      <Hr style={divider} />
      <Text style={footerText}>
        {c.footer}{" "}
        <Link href={unsubscribeUrl} style={unsubscribeLink}>
          {c.unsubscribe}
        </Link>
      </Text>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "42px",
  fontWeight: "800",
  color: "#383838", // Ink
  margin: "0 0 24px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const bodySection: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  textAlign: "left",
};

const bodyText: React.CSSProperties = {
  color: "#383838", // Ink
  fontSize: "15px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 0 16px",
  lineHeight: "1.7",
  textAlign: "left",
};

const list: React.CSSProperties = {
  ...bodyText,
  paddingLeft: "22px",
};

const listItem: React.CSSProperties = {
  margin: "0 0 6px",
};

const inlineLink: React.CSSProperties = {
  color: "#0F5C60", // Deep Teal (brand primary),
  textDecoration: "underline",
};

const promoSection: React.CSSProperties = {
  border: "2px dashed #0F5C60",
  borderRadius: "8px",
  margin: "16px auto 8px",
  maxWidth: "360px",
  padding: "20px 16px",
  textAlign: "center",
};

const promoLabel: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#0F5C60",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "3px",
  textTransform: "uppercase",
  margin: "0 0 8px",
  lineHeight: "1.4",
};

const promoCode: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  color: "#383838", // Ink
  fontSize: "36px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0 0 8px",
  lineHeight: "1.1",
};

const promoDiscount: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#383838", // Ink
  fontSize: "15px",
  fontWeight: "700",
  margin: "0",
  lineHeight: "1.5",
};

const promoExpiry: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#383838", // Ink
  fontSize: "13px",
  margin: "4px 0 0",
  lineHeight: "1.5",
};

const ctaSection: React.CSSProperties = {
  margin: "24px 0 8px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#E5A51C", // Ochre (brand feature/CTA)
  color: "#383838", // Ink
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

const divider: React.CSSProperties = {
  borderTop: "1px solid #E5E7EB",
  margin: "32px 0 16px",
};

const footerText: React.CSSProperties = {
  fontFamily: "'Barlow', Arial, sans-serif",
  color: "#383838", // Ink
  fontSize: "12px",
  margin: "0",
  lineHeight: "1.6",
  textAlign: "center",
};

const unsubscribeLink: React.CSSProperties = {
  color: "#0F5C60", // Deep Teal (brand primary)
  textDecoration: "underline",
};
