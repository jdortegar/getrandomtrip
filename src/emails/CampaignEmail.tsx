import { Hr, Link, Section, Text } from "@react-email/components";
import * as React from "react";

import {
  parseCampaignMarkdown,
  type MarkdownBlock,
  type MarkdownInline,
} from "@/lib/email-campaigns/markdown";
import type { CampaignEmailPromo, CampaignLocale } from "@/types/emailCampaign";
import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import { emailColors, emailFonts } from "./components/tokens";

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
    return <EmailText key={index}>{renderInline(block.children)}</EmailText>;
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
      <EmailHeading>{title}</EmailHeading>
      {parseCampaignMarkdown(bodyMarkdown).map(renderBlock)}

      {promo && (
        <Section style={promoSection}>
          <Text style={promoLabel}>{c.promoLabel}</Text>
          <Text style={promoCode}>{promo.code}</Text>
          <Text style={promoDiscount}>{promo.discountLabel}</Text>
          {expiry && <Text style={promoExpiry}>{c.validUntil(expiry)}</Text>}
        </Section>
      )}

      {cta && <EmailButton href={cta.url}>{cta.label}</EmailButton>}

      <Hr style={divider} />
      <EmailText variant="note">
        {c.footer}{" "}
        <Link href={unsubscribeUrl} style={inlineLink}>
          {c.unsubscribe}
        </Link>
      </EmailText>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const list: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 24px",
  paddingLeft: "22px",
};

const listItem: React.CSSProperties = {
  margin: "0 0 6px",
};

const inlineLink: React.CSSProperties = {
  color: emailColors.primary,
  textDecoration: "underline",
};

// Coupon: dashed Teal outline, centred for emphasis.
const promoSection: React.CSSProperties = {
  border: `2px dashed ${emailColors.primary}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  margin: "0 0 24px",
  padding: "20px 16px",
  textAlign: "center",
};

const promoLabel: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.18em",
  lineHeight: "1.4",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const promoCode: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.editorial,
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "4px",
  lineHeight: "1.1",
  margin: "0 0 8px",
};

const promoDiscount: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "15px",
  fontWeight: "700",
  lineHeight: "1.5",
  margin: "0",
};

const promoExpiry: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "4px 0 0",
};

const divider: React.CSSProperties = {
  borderColor: emailColors.border,
  margin: "8px 0 20px",
};
