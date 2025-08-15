// src/content/trippers.ts

/** ---- Tipos ---- */
export type TripperTier = {
  id: "essenza" | "modo-explora" | "explora-plus" | "bivouac" | "atelier-getaway";
  name: string;
  subtitle?: string;
  tagline: string;
  priceLabel?: string;
  priceFootnote?: string;
  bullets?: string[];
  features?: string[];
  ctaLabel?: string;
};

export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
};

export type Tripper = {
  slug: string;
  name: string;
  metaTitle?: string;
  tiers?: TripperTier[]; // opcional: si falta, usamos BASE_TIERS
  // ...otros campos que ya uses
  travellerType?: 'couples' | 'solo' | 'family' | 'group' | 'honeymoons';
  images?: { 
    avatar?: string;
    hero?: string;
  };
  palette: Palette;
  tiersSource?: 'base' | 'custom';
};

/** ---- Tiers base, reutilizables en todas las landings ---- */
export const BASE_TIERS: TripperTier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    tagline: 'Lo esencial con estilo',
    priceLabel: 'Hasta $350 USD por persona',
    priceFootnote: 'Presupuesto por persona en base doble.',
    features: [
      'Noches: Hasta 2 noches',
      'Alojamiento: Midscale (3★)',
      'Transporte: Low-cost',
      'Extras: Guía esencial del destino',
    ],
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    tagline: 'Viaje activo y flexible',
    priceLabel: 'Hasta $500 USD por persona',
    priceFootnote: 'Presupuesto por persona en base doble.',
    features: [
      'Noches: Hasta 3 noches',
      'Alojamiento: Mid-to-Upscale',
      'Transporte: Multimodal flexible',
      'Extras: Guía curada “Decode”',
    ],
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más detalles',
    tagline: 'Más capas, más detalles',
    priceLabel: 'Hasta $850 USD por persona',
    priceFootnote: 'Presupuesto por persona en base doble.',
    features: [
      'Noches: Hasta 4 noches',
      'Alojamiento: Upscale garantizado',
      'Transporte: Multimodal',
      'Extras: 1 Experiencia curada',
    ],
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal',
    tagline: 'Curaduría que se siente artesanal',
    priceLabel: 'Hasta $1,200 USD por persona',
    priceFootnote: 'Presupuesto por persona en base doble.',
    features: [
      'Noches: Hasta 5 noches',
      'Alojamiento: Diseño / Boutique',
      'Transporte: Multimodal Premium',
      'Extras: 1 Experiencia Premium',
    ],
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo',
    tagline: 'Distinción, sin esfuerzo',
    priceLabel: 'Desde $1,200 USD por persona',
    priceFootnote: 'Customizable. Presupuesto por persona en base doble.',
    features: [
      'Noches: Customizable',
      'Alojamiento: Luxury / De Autor',
      'Transporte: A medida (privados)',
      'Extras: 2+ Experiencias Premium',
    ],
  },
];

/** ---- Trippers (5 landings) ---- */
const DEFAULT_PALETTE: Palette = {
  primary: '#FFFFFF',
  secondary: '#0A2240',
  accent: '#2463EB',
  text: '#212121',
};

export const TRIPPERS: Tripper[] = [
  {
    slug: 'ale-ramirez',
    name: 'Alejandra Ramírez',
    metaTitle: 'Alejandra Ramírez | Randomtrip',
    travellerType: 'couples',
    images: { 
      avatar: '/images/trippers/ale.jpg',
      hero: '/images/trippers/ale-hero.jpg'
    },
    palette: DEFAULT_PALETTE,
    tiersSource: 'base',
  },
  {
    slug: 'ilse-seaman',
    name: 'Ilse Seaman',
    metaTitle: 'Ilse Seaman | Randomtrip',
    travellerType: 'family',
    images: { 
      avatar: '/images/trippers/ilse.jpg',
      hero: '/images/trippers/ilse-hero.jpg'
    },
    palette: DEFAULT_PALETTE,
    tiersSource: 'base',
  },
  {
    slug: 'cinthya-chavez',
    name: 'Cinthya Chávez',
    metaTitle: 'Cinthya Chávez | Randomtrip',
    travellerType: 'solo',
    images: { 
      avatar: '/images/trippers/cinthya.jpg',
      hero: '/images/trippers/cinthya-hero.jpg'
    },
    palette: DEFAULT_PALETTE,
    tiersSource: 'base',
  },
  {
    slug: 'horacio-teran',
    name: 'Horacio Terán',
    metaTitle: 'Horacio Terán | Randomtrip',
    travellerType: 'couples',
    images: { 
      avatar: '/images/trippers/horacio.jpg',
      hero: '/images/trippers/horacio-hero.jpg'
    },
    palette: DEFAULT_PALETTE,
    tiersSource: 'base',
  },
  {
    slug: 'sara-sanchez',
    name: 'Sara Sánchez',
    metaTitle: 'Sara Sánchez | Randomtrip',
    travellerType: 'honeymoons',
    images: { 
      avatar: '/images/trippers/sara.jpg',
      hero: '/images/trippers/sara-hero.jpg'
    },
    palette: DEFAULT_PALETTE,
    tiersSource: 'base',
  },
];

// === Helpers públicos para páginas de Tripper ===
export function getAllTripperSlugs(): string[] {
  return TRIPPERS.map(t => t.slug);
}

export function getTripperBySlug(slug: string): Tripper | undefined {
  return TRIPPERS.find(t => t.slug === slug);
}

export function getTripperTiers(tripperOrSlug: Tripper | string): TripperTier[] {
  const t = typeof tripperOrSlug === 'string'
    ? TRIPPERS.find(x => x.slug === tripperOrSlug)
    : tripperOrSlug;
  return (t?.tiers && t.tiers.length > 0) ? t.tiers : BASE_TIERS;
}