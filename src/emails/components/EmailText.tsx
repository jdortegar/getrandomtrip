import { Text } from "@react-email/components";
import * as React from "react";
import { emailColors, emailFonts } from "./tokens";

interface EmailTextProps {
  /** `body` for the main message, `note` for secondary small print. */
  variant?: "body" | "note";
  children: React.ReactNode;
}

/** Left-aligned Barlow paragraph in the documentary voice. */
export default function EmailText({ variant = "body", children }: EmailTextProps) {
  return <Text style={variant === "note" ? note : body}>{children}</Text>;
}

const body: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "15px",
  fontWeight: "400",
  lineHeight: "1.65",
  margin: "0 0 24px",
};

const note: React.CSSProperties = {
  ...body,
  color: emailColors.muted,
  fontSize: "13px",
  lineHeight: "1.6",
};
