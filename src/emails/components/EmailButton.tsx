import { Column, Link, Row, Section } from "@react-email/components";
import * as React from "react";
import { emailColors, emailFonts } from "./tokens";

interface EmailButtonProps {
  href: string;
  /**
   * `primary` (Deep Teal) for most emails; `feature` (Ochre) only for
   * moments that need energy, such as the destination reveal; `xsed`
   * (Canyon Clay) only inside the XSED sub-brand.
   */
  variant?: "primary" | "feature" | "xsed";
  /** ButtonV2 sizes: `sm` (44px, the email default) or `default` (58px). */
  size?: "sm" | "default";
  /** Left by default (brand rule); center only inside centred marketing blocks. */
  align?: "left" | "center";
  children: React.ReactNode;
}

/**
 * ButtonV2 in email form: square, sentence case, arrow pushed to the end.
 * The arrow is text so it survives image blocking.
 */
export default function EmailButton({
  href,
  variant = "primary",
  size = "sm",
  align = "left",
  children,
}: EmailButtonProps) {
  const { background, color } = variants[variant];
  const s = sizes[size];

  return (
    // Full-width wrapper aligned with text-align: an align="left" table
    // floats, and the next paragraph would wrap beside the button.
    <Section style={{ ...wrapper, textAlign: align }}>
      <Link
        href={href}
        style={{ ...link, backgroundColor: background, color, padding: s.padding }}
      >
        <Row>
          <Column style={{ ...label, color, fontSize: s.label, paddingRight: s.gap }}>
            {children}
          </Column>
          <Column style={{ ...arrow, color, fontSize: s.arrow }}>&rarr;</Column>
        </Row>
      </Link>
    </Section>
  );
}

const variants = {
  primary: { background: emailColors.primary, color: emailColors.ground },
  feature: { background: emailColors.feature, color: emailColors.ink },
  // White on Canyon Clay matches the XSED badge treatment (below AA, by brand request).
  xsed: { background: emailColors.xsed, color: emailColors.surface },
} as const;

// Mirrors ButtonV2's `sm` (min-h-11 px-[18px] text-sm gap-2.5, 16px icon)
// and `default` (min-h-[58px] px-[25px] text-base gap-[38px], 22px icon).
const sizes = {
  sm: { padding: "11px 18px", label: "14px", gap: "10px", arrow: "16px" },
  default: { padding: "16px 24px", label: "16px", gap: "38px", arrow: "18px" },
} as const;

const wrapper: React.CSSProperties = {
  margin: "0 0 24px",
  width: "100%",
};

const link: React.CSSProperties = {
  display: "inline-block",
  fontFamily: emailFonts.body,
  textDecoration: "none",
};

const label: React.CSSProperties = {
  fontFamily: emailFonts.body,
  fontWeight: "400",
  lineHeight: "1.5",
  whiteSpace: "nowrap",
};

const arrow: React.CSSProperties = {
  fontFamily: emailFonts.body,
  lineHeight: "1.5",
};
