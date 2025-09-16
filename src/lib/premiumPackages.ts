export interface PremiumPackage {
  id: string;
  title: string;
  tagline: string;
  budget: number;            // in USD
  nights: string;
  lodging: string;
  transport: string;
  extras: string;
}

export const premiumPackages: PremiumPackage[] = [
  {
    id: 'essenza',
    title: 'Essenza',
    tagline: 'Lo esencial con estilo',
    budget: 350,
    nights: 'Hasta 2 noches',
    lodging: 'Midscale (3★)',
    transport: 'Low-cost',
    extras: 'Guía esencial del destino',
  },
  {
    id: 'modo-explora',
    title: 'Modo Explora',
    tagline: 'Viaje activo y flexible',
    budget: 500,
    nights: 'Hasta 3 noches',
    lodging: 'Mid-to-Upscale',
    transport: 'Multimodal flexible',
    extras: 'Guía curada "Decode"',
  },
  {
    id: 'explora-plus',
    title: 'Explora+',
    tagline: 'Más capas, más detalles',
    budget: 850,
    nights: 'Hasta 4 noches',
    lodging: 'Upscale Garantizado',
    transport: 'Multimodal',
    extras: '1 Experiencia Curada',
  },
  {
    id: 'bivouac',
    title: 'Bivouac',
    tagline: 'Curaduría que se siente artesanal',
    budget: 1200,
    nights: 'Hasta 5 noches',
    lodging: 'Diseño / Boutique',
    transport: 'Multimodal Premium',
    extras: '1 Experiencia Premium',
  },
  {
    id: 'atelier-getaway',
    title: 'Atelier Getaway',
    tagline: 'Distinción, sin esfuerzo',
    budget: 1200,
    nights: 'Customizable',
    lodging: 'Luxury / De Autor',
    transport: 'A medida (privados)',
    extras: '2+ Experiencias Premium',
  },
];