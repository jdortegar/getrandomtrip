/**
 * Brand Book 3.1 tokens for email. Emails can't read Tailwind or CSS
 * variables, so the hex values from `src/app/globals.css` are mirrored here.
 * Templates use these instead of one-off hex.
 */
export const emailColors = {
  /** Headings and body text. */
  ink: "#383838",
  /** Secondary text (notes, captions) on white. */
  muted: "#5B5B5B",
  /** Deep Teal: text, eyebrows, links, primary button. Never a large fill. */
  primary: "#0F5C60",
  /** Mineral Sage: footer and containers. Never text. */
  secondary: "#A4B4AA",
  /** Ochre: feature button and highlights only. */
  feature: "#E5A51C",
  /** Canyon Clay: XSED sub-brand only. */
  xsed: "#D97E4A",
  /** Off White: page canvas. */
  ground: "#F3F2ED",
  surface: "#FFFFFF",
  border: "#E5E7EB",
} as const;

export const emailFonts = {
  /** Documentary voice: body and UI. */
  body: "'Barlow', Arial, Helvetica, sans-serif",
  /** Editorial voice: headings and values, Bold 700 uppercase. */
  editorial: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  /** Human voice: handwritten asides. Outlook falls back to a script face. */
  human: "'Nothing You Could Do', 'Segoe Script', Georgia, cursive",
} as const;

/** Public origin for email images; they must resolve outside the app. */
export const EMAIL_ASSET_ORIGIN = "https://getrandomtrip.com";
