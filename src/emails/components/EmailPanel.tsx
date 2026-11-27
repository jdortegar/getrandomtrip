import { Section, Text } from "@react-email/components";
import * as React from "react";
import { emailColors, emailFonts } from "./tokens";

interface EmailPanelProps {
  /** Teal eyebrow above the content (e.g. "Notas del revisor"). */
  label?: string;
  children: React.ReactNode;
}

/**
 * Off White block for quoted or supporting content: review notes, failure
 * details, messages. Plain strings render as a paragraph; elements pass
 * through as-is.
 */
export default function EmailPanel({ label, children }: EmailPanelProps) {
  return (
    <Section style={panel}>
      {label && <Text style={labelStyle}>{label}</Text>}
      {typeof children === "string" ? (
        <Text style={content}>{children}</Text>
      ) : (
        children
      )}
    </Section>
  );
}

const panel: React.CSSProperties = {
  backgroundColor: emailColors.ground,
  borderCollapse: "separate",
  borderRadius: "12px",
  margin: "0 0 24px",
  padding: "20px 24px",
};

const labelStyle: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.18em",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const content: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "14px",
  lineHeight: "1.65",
  margin: "0",
  whiteSpace: "pre-wrap",
};
