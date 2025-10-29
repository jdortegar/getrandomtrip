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

export interface Level {
  id: string;
  name: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: LevelFeature[];
  closingLine: string;
  ctaLabel: string;
  excuses: Excuse[];
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
  title: string;
  subtitle: string;
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
