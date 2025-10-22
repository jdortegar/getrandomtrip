export interface TierFeature {
  label: string;
  text: string;
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

export interface AlmaCard {
  key: string;
  title: string;
  img: string;
  description: string;
}

export interface AlmaOption {
  key: string;
  label: string;
  desc?: string;
  img?: string;
}

export interface AlmaSpec {
  title: string;
  core: string;
  options: AlmaOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
}

export interface PresupuestoContent {
  title: string;
  tagline: string;
  categoryLabels?: string[]; // Optional now - defaults to hardcoded values
}

export interface LaExcusaContent {
  title: string;
  tagline: string;
  cards: AlmaCard[];
}

export interface AfinarDetallesContent {
  title: string;
  tagline: string;
  ctaLabel: string;
}

export interface TypePlannerContent {
  title: string;
  subtitle: string;
  tiers: Tier[];
  almaOptions: Record<string, AlmaSpec>;
  steps: {
    step2Label: string;
    presupuesto: PresupuestoContent;
    laExcusa: LaExcusaContent;
    afinarDetalles: AfinarDetallesContent;
  };
}
