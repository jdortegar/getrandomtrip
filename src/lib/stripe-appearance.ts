import type { Appearance } from "@stripe/stripe-js";

// Mirrors FormField styles:
//   input  → bg-gray-100 (#f3f4f6), rounded-xl (12px), px-6 py-4, text-base, text-ink
//   label  → text-gray-600 (#4b5563), font-normal, text-base
//   focus  → outline-2 primary (#0f5c60 — brand primary, was #111827)
//   error  → text-red-600 (#dc2626)
//   tabs   → gray-100 unselected / primary selected (matches app's bg-primary Button)
//
// Stripe Elements renders in a sandboxed iframe, so these must stay literal
// hex — CSS custom properties from globals.css (`--color-primary`) don't
// reach it. Keep in sync with `--color-primary` by hand.
export const stripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    // Colors
    colorPrimary: "#0f5c60",
    colorBackground: "#f3f4f6",
    colorText: "#111827",
    colorTextSecondary: "#4b5563",
    colorTextPlaceholder: "#9ca3af",
    colorDanger: "#dc2626",
    colorSuccess: "#16a34a",
    // Icons
    iconColor: "#6b7280",
    iconHoverColor: "#111827",
    // Typography — Barlow loaded explicitly via Elements fonts prop
    fontFamily: "'Barlow', sans-serif",
    fontSizeBase: "16px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "700",
    fontLineHeight: "1.5",
    // Layout
    borderRadius: "12px",
    spacingUnit: "4px",
    gridRowSpacing: "24px",
    gridColumnSpacing: "24px",
    // Focus ring — matches app's focus-visible ring
    focusOutline: "2px solid #0f5c60",
    focusBoxShadow: "none",
  },
  rules: {
    // ─── Inputs ────────────────────────────────────────────────────────────
    ".Input": {
      backgroundColor: "#f3f4f6",
      border: "none",
      boxShadow: "none",
      padding: "16px 24px",
      fontSize: "16px",
      color: "#111827",
      transition: "outline 0.1s ease",
    },
    ".Input::placeholder": {
      color: "#9ca3af",
    },
    ".Input:hover": {
      backgroundColor: "#f3f4f6",
    },
    ".Input:focus": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
      outline: "2px solid #0f5c60",
      outlineOffset: "-2px",
    },
    ".Input--invalid": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
      outline: "2px solid #dc2626",
      outlineOffset: "-2px",
      color: "#111827",
    },
    // ─── Labels ────────────────────────────────────────────────────────────
    ".Label": {
      color: "#4b5563",
      fontWeight: "400",
      fontSize: "16px",
      marginBottom: "8px",
    },
    ".Label--invalid": {
      color: "#dc2626",
    },
    // ─── Errors ────────────────────────────────────────────────────────────
    ".Error": {
      color: "#dc2626",
      fontSize: "14px",
      marginTop: "6px",
    },
    // ─── Payment method tabs ────────────────────────────────────────────────
    ".Tab": {
      // backgroundColor: "#f3f4f6",
      border: "none",
      boxShadow: "none",
      color: "#6b7280",
      fontWeight: "500",
      borderRadius: "12px",
      padding: "10px 16px",
      transition: "background-color 0.15s ease, color 0.15s ease",
    },
    ".Tab:hover": {
      backgroundColor: "#e5e7eb",
      color: "#111827",
    },
    ".Tab--selected": {
      backgroundColor: "#0f5c60",
      color: "#ffffff",
      boxShadow: "none",
    },
    ".Tab:focus": {
      boxShadow: "none",
      outline: "2px solid #0f5c60",
      outlineOffset: "2px",
    },
    ".TabLabel": {
      fontWeight: "500",
    },
    ".TabLabel--selected": {
      color: "#ffffff",
    },
    // ─── Accordion items (layout: "accordion") ─────────────────────────────
    ".AccordionItem": {
      backgroundColor: "#f3f4f6",
      borderRadius: "12px",
      border: "none",
      boxShadow: "none",
    },
    ".AccordionItem--selected": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
    },
    // ─── Block dividers ────────────────────────────────────────────────────
    ".BlockDivider": {
      backgroundColor: "#e5e7eb",
    },
    // ─── Stripe internal buttons (Link "Use this card", etc.) ──────────────
    // Matches app primary Button: bg-primary, text-white, Barlow semibold uppercase
    ".Button": {
      backgroundColor: "#0f5c60",
      color: "#ffffff",
      borderRadius: "3px",
      border: "2px solid #ffffff",
      fontFamily: "'Barlow', sans-serif",
      fontWeight: "600",
      fontSize: "16px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      transition: "background-color 0.15s ease",
    },
    ".Button:hover": {
      backgroundColor: "#0b484b",
    },
    ".Button:focus": {
      boxShadow: "none",
      outline: "2px solid #0f5c60",
      outlineOffset: "2px",
    },
  },
};
