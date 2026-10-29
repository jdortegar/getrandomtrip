import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

export interface LevelFeature {
  title: string;
  description: string;
  footnote?: string;
}

export interface ExcuseOption {
  key: string;
  label: string;
  img?: string;
  desc?: string;
}

export interface ExcuseDetails {
  title: string;
  core: string;
  options: ExcuseOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
}

export interface Excuse {
  key: string;
  title: string;
  description: string;
  img: string;
  details: ExcuseDetails;
}

/** Transport icon ids on an experience card (lucide icon names). */
export type ExperienceCardTransportMode =
  | "bus-front"
  | "car-front"
  | "plane"
  | "ship"
  | "train-front";

/** CTA treatment: Deep Teal (regular levels), Ochre (XSED) or outline (Atelier). */
export type ExperienceCardCtaStyle = "feature" | "outline" | "primary";

export interface ExperienceCardDetail {
  /** `transport` rows render the card's transport icons instead of the plain value. */
  kind?: "transport";
  label: string;
  value: string;
}

export interface ExperienceCardTransport {
  modes: ExperienceCardTransportMode[];
  /** Modes listed after a "+" separator (e.g. plane + boat, train or car). */
  optionalModes?: ExperienceCardTransportMode[];
}

/** Locale-specific copy of an experience card. */
export interface ExperienceCardCopy {
  /** Scarcity/schedule line shown above the reveal note (XSED drops). */
  availabilityNote?: string;
  ctaLabel: string;
  description: string;
  details: ExperienceCardDetail[];
  footnotes: string[];
  /** Line shown under the name (e.g. "Lo esencial con estilo"). */
  kicker: string;
  name: string;
  photoAlt: string;
  revealNote: string;
  /** Photo tag chip (e.g. "SOLUM™ · EXPRESS"). */
  tag: string;
  /** Short note next to the transport icons (e.g. "Según la ruta"). */
  transportNote?: string;
}

/** Card content source for one traveler type × level (both locales). */
export interface ExperienceCardSource {
  copy: { en: ExperienceCardCopy; es: ExperienceCardCopy };
  ctaStyle?: ExperienceCardCtaStyle;
  /** CSS object-position for the header photo. */
  photoPosition: string;
  /** Traveler type whose photo folder to use when this pair has no photo of its own. */
  photoType?: TravelerTypeSlug;
  transport?: ExperienceCardTransport;
}

/** Resolved, single-locale content rendered by ExperienceCard. */
export interface ExperienceCardContent extends ExperienceCardCopy {
  ctaStyle: ExperienceCardCtaStyle;
  photoPosition: string;
  photoSrc: string;
  transport?: ExperienceCardTransport;
}

export interface Level {
  id: string;
  maxNights: number;
  name: string;
  subtitle: string;
  price: number;
  priceLabel: string;
  priceFootnote: string;
  features: LevelFeature[];
  closingLine: string;
  ctaLabel: string;
  excuses: Excuse[];
  /** Photo-header card content (ExperienceCard); falls back to the fields above when missing. */
  card?: ExperienceCardContent;
}

export interface PresupuestoContent {
  title: string;
  tagline: string;
  categoryLabels: string[];
}

export interface ExcuseContent {
  title: string;
  tagline: string;
}

export interface DetailsContent {
  title: string;
  tagline: string;
  ctaLabel: string;
}

export interface TypePlannerContent {
  eyebrow?: string;
  subtitle: string;
  title: string;
  levels: Level[];
}

// Legacy types for backward compatibility
export interface ExcuseCard {
  key: string;
  title: string;
  img: string;
  description: string;
}

export interface ExcuseSpec {
  title: string;
  core: string;
  options: ExcuseOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
}
