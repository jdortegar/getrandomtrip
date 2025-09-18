/**
 * Typography System - Inspired by Black Tomato & Modern Design
 *
 * This file provides typography utilities and constants for consistent
 * text styling across the application.
 *
 * Fonts (defined in globals.css):
 * - Headers: Jost (friendly, readable Google font) - uses --font-jost CSS variable
 * - Body: Jost (friendly, readable Google font) - uses --font-jost CSS variable
 * - Display: Caveat (handwritten, casual Google font) - uses --font-caveat CSS variable
 * - Mono: JetBrains Mono (code)
 */

export const TYPOGRAPHY = {
  // Font Families - Using CSS Variables from globals.css
  FONTS: {
    HEADING: 'font-jost', // Uses --font-jost CSS variable
    BODY: 'font-jost', // Uses --font-jost CSS variable
    DISPLAY: 'font-caveat', // Uses --font-caveat CSS variable
    MONO: 'font-mono',
  },

  // Text Sizes (matching CSS variables)
  SIZES: {
    XS: 'text-xs', // 12px
    SM: 'text-sm', // 14px
    BASE: 'text-base', // 16px
    LG: 'text-lg', // 18px
    XL: 'text-xl', // 20px
    '2XL': 'text-2xl', // 24px
    '3XL': 'text-3xl', // 30px
    '4XL': 'text-4xl', // 36px
    '5XL': 'text-5xl', // 48px
    '6XL': 'text-6xl', // 60px
    '7XL': 'text-7xl', // 72px
    '8XL': 'text-8xl', // 96px
    '9XL': 'text-9xl', // 128px
  },

  // Line Heights
  LEADING: {
    TIGHT: 'leading-tight', // 1.25
    SNUG: 'leading-snug', // 1.375
    NORMAL: 'leading-normal', // 1.5
    RELAXED: 'leading-relaxed', // 1.625
    LOOSE: 'leading-loose', // 2
  },

  // Font Weights
  WEIGHTS: {
    THIN: 'font-thin', // 100
    EXTRALIGHT: 'font-extralight', // 200
    LIGHT: 'font-light', // 300
    NORMAL: 'font-normal', // 400
    MEDIUM: 'font-medium', // 500
    SEMIBOLD: 'font-semibold', // 600
    BOLD: 'font-bold', // 700
    EXTRABOLD: 'font-extrabold', // 800
    BLACK: 'font-black', // 900
  },

  // Letter Spacing
  TRACKING: {
    TIGHTER: 'tracking-tighter', // -0.05em
    TIGHT: 'tracking-tight', // -0.025em
    NORMAL: 'tracking-normal', // 0em
    WIDE: 'tracking-wide', // 0.025em
    WIDER: 'tracking-wider', // 0.05em
    WIDEST: 'tracking-widest', // 0.1em
  },
} as const;

/**
 * Typography Presets - Common combinations
 */
export const TYPOGRAPHY_PRESETS = {
  // Headers - Only font family, no size or color
  H1: `${TYPOGRAPHY.FONTS.HEADING}`,
  H2: `${TYPOGRAPHY.FONTS.HEADING}`,
  H3: `${TYPOGRAPHY.FONTS.HEADING}`,
  H4: `${TYPOGRAPHY.FONTS.HEADING}`,
  H5: `${TYPOGRAPHY.FONTS.HEADING}`,
  H6: `${TYPOGRAPHY.FONTS.HEADING}`,

  // Body Text
  BODY_LARGE: `${TYPOGRAPHY.FONTS.BODY} ${TYPOGRAPHY.SIZES.LG} ${TYPOGRAPHY.WEIGHTS.NORMAL} ${TYPOGRAPHY.LEADING.RELAXED}`,
  BODY: `${TYPOGRAPHY.FONTS.BODY} ${TYPOGRAPHY.SIZES.BASE} ${TYPOGRAPHY.WEIGHTS.NORMAL} ${TYPOGRAPHY.LEADING.NORMAL}`,
  BODY_SMALL: `${TYPOGRAPHY.FONTS.BODY} ${TYPOGRAPHY.SIZES.SM} ${TYPOGRAPHY.WEIGHTS.NORMAL} ${TYPOGRAPHY.LEADING.NORMAL}`,

  // Display Text (for hero sections, etc.)
  DISPLAY_LARGE: `${TYPOGRAPHY.FONTS.DISPLAY} ${TYPOGRAPHY.SIZES['7XL']} ${TYPOGRAPHY.WEIGHTS.BOLD} ${TYPOGRAPHY.LEADING.TIGHT}`,
  DISPLAY: `${TYPOGRAPHY.FONTS.DISPLAY} ${TYPOGRAPHY.SIZES['6XL']} ${TYPOGRAPHY.WEIGHTS.BOLD} ${TYPOGRAPHY.LEADING.TIGHT}`,
  DISPLAY_SMALL: `${TYPOGRAPHY.FONTS.DISPLAY} ${TYPOGRAPHY.SIZES['5XL']} ${TYPOGRAPHY.WEIGHTS.BOLD} ${TYPOGRAPHY.LEADING.SNUG}`,

  // Special Text
  CAPTION: `${TYPOGRAPHY.FONTS.BODY} ${TYPOGRAPHY.SIZES.XS} ${TYPOGRAPHY.WEIGHTS.NORMAL} ${TYPOGRAPHY.LEADING.NORMAL}`,
  LABEL: `${TYPOGRAPHY.FONTS.BODY} ${TYPOGRAPHY.SIZES.SM} ${TYPOGRAPHY.WEIGHTS.MEDIUM} ${TYPOGRAPHY.LEADING.NORMAL}`,
  BUTTON: `${TYPOGRAPHY.FONTS.HEADING} ${TYPOGRAPHY.SIZES.BASE} ${TYPOGRAPHY.WEIGHTS.SEMIBOLD} ${TYPOGRAPHY.LEADING.NORMAL}`,
} as const;

/**
 * Utility function to combine typography classes
 */
export function combineTypography(
  font: keyof typeof TYPOGRAPHY.FONTS,
  size: keyof typeof TYPOGRAPHY.SIZES,
  weight: keyof typeof TYPOGRAPHY.WEIGHTS,
  leading: keyof typeof TYPOGRAPHY.LEADING,
  tracking?: keyof typeof TYPOGRAPHY.TRACKING,
): string {
  const classes: string[] = [
    TYPOGRAPHY.FONTS[font],
    TYPOGRAPHY.SIZES[size],
    TYPOGRAPHY.WEIGHTS[weight],
    TYPOGRAPHY.LEADING[leading],
  ];

  if (tracking) {
    classes.push(TYPOGRAPHY.TRACKING[tracking]);
  }

  return classes.join(' ');
}
