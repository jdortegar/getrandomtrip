import { Column, Row, Section } from "@react-email/components";
import * as React from "react";
import { emailColors, emailFonts } from "./tokens";

interface EmailDetail {
  label: string;
  value: React.ReactNode;
}

interface EmailDetailListProps {
  items: EmailDetail[];
}

/** Bordered key/value block: Teal eyebrow label, Barlow Condensed value. */
export default function EmailDetailList({ items }: EmailDetailListProps) {
  return (
    <Section style={box}>
      {items.map(({ label, value }, index) => {
        // Borders on <tr> don't render in separate-border tables; draw on cells.
        const rule = index ? divider : undefined;
        return (
          <Row key={label}>
            <Column style={{ ...labelCell, ...rule }}>{label}</Column>
            <Column
              align="right"
              className="rt-detail-value"
              style={{ ...valueCell, ...rule }}
            >
              {value}
            </Column>
          </Row>
        );
      })}
    </Section>
  );
}

const box: React.CSSProperties = {
  border: `1px solid ${emailColors.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  margin: "0 0 28px",
};

const divider: React.CSSProperties = {
  borderTop: `1px solid ${emailColors.border}`,
};

const labelCell: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.18em",
  padding: "14px 0 14px 20px",
  textTransform: "uppercase",
};

const valueCell: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.editorial,
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "1.1",
  // Long values (emails, IDs) wrap instead of widening the card on phones.
  overflowWrap: "anywhere",
  padding: "14px 20px 14px 12px",
  wordBreak: "break-word",
};
