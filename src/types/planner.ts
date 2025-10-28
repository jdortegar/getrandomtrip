export interface TierFeature {
  title: string;
  description: string;
  footnote?: string;
}

export interface Tier {
  id: string;
  name: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: TierFeature[];
  closingLine: string;
  ctaLabel: string;
}

export interface ExcuseCard {
  key: string;
  title: string;
  img: string;
  description: string;
}

export interface ExcuseOption {
  key: string;
  label: string;
  desc?: string;
  img?: string;
}

export interface ExcuseSpec {
  title: string;
  core: string;
  options: ExcuseOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
}

export interface PresupuestoContent {
  title: string;
  tagline: string;
  categoryLabels?: string[]; // Optional now - defaults to hardcoded values
}

export interface ExcuseContent {
  title: string;
  tagline: string;
  cards: ExcuseCard[];
}

export interface DetailsContent {
  title: string;
  tagline: string;
  ctaLabel: string;
}

export interface TypePlannerContent {
  title: string;
  subtitle: string;
  tiers: Tier[];
  excuseOptions: Record<string, ExcuseSpec>;
  steps: {
    step2Label: string;
    presupuesto: PresupuestoContent;
    excuse: ExcuseContent;
    details: DetailsContent;
  };
}
