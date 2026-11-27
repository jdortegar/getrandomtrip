import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { emailColors, emailFonts } from "./tokens";

interface EmailHeadingProps {
  /** Short context line above the heading (e.g. "Tu viaje"). */
  eyebrow?: string;
  children: React.ReactNode;
}

/** Eyebrow + editorial heading, the design system's section header. */
export default function EmailHeading({ eyebrow, children }: EmailHeadingProps) {
  return (
    <>
      {eyebrow && <Text style={eyebrowStyle}>{eyebrow}</Text>}
      <Heading as="h1" style={headingStyle}>
        {children}
      </Heading>
    </>
  );
}

const eyebrowStyle: React.CSSProperties = {
  color: emailColors.primary,
  fontFamily: emailFonts.body,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.18em",
  lineHeight: "1.4",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const headingStyle: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.editorial,
  fontSize: "40px",
  fontWeight: "700",
  lineHeight: "0.95",
  margin: "0 0 20px",
  textTransform: "uppercase",
};
