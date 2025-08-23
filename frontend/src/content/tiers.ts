export type TierKey = 'essenza' | 'explora' | 'exploraPlus' | 'bivouac' | 'atelier';

export const TRIPPER_TIERS: {
  key: TierKey;
  title: string;
  cta: string;
  bullets: string[];
  testid: string;
}[] = [
  {
    key: 'essenza',
    title: 'Essenza — Lo esencial, curado.',
    cta: '👉 Activa Essenza →',
    bullets: [
      'Hasta 350 USD · por persona',
      'Duración: Máx 2 noches',
      'Alojamiento: Midscale (3★)',
      'Extras: guía esencial + recomendaciones simples',
    ],
    testid: 'cta-tier-essenza',
  },
  {
    key: 'explora',
    title: 'Modo Explora — Activo y flexible.',
    cta: '👉 Activa Explora →',
    bullets: [
      'Hasta 500 USD · por persona',
      'Duración: hasta 3 noches',
      'Alojamiento: Mid-to-Upscale',
      'Extras: Decode + actividades sugeridas',
    ],
    testid: 'cta-tier-explora',
  },
  {
    key: 'exploraPlus',
    title: 'Explora+ — Más capas, más momentos.',
    cta: '👉 Activa Explora+ →',
    bullets: [
      'Hasta 850 USD · por persona',
      'Duración: hasta 4 noches',
      'Alojamiento: Upscale asegurado',
      'Extras: Decode personalizado + 1 experiencia curada',
    ],
    testid: 'cta-tier-exploraplus',
  },
  {
    key: 'bivouac',
    title: 'Bivouac — Curaduría artesanal.',
    cta: '👉 Activa Bivouac →',
    bullets: [
      'Hasta 1200 USD · por persona',
      'Duración: hasta 5 noches',
      'Alojamiento: Upper-Upscale',
      'Extras: Concierge Advisor + perks',
    ],
    testid: 'cta-tier-bivouac',
  },
  {
    key: 'atelier',
    title: 'Atelier — Distinción a medida.',
    cta: '👉 Activa Atelier →',
    bullets: [
      'Desde 1200 USD · por persona',
      'Duración: custom',
      'Alojamiento: Luxury / de autor',
      'Extras: co-creación con Luxury Advisor',
    ],
    testid: 'cta-tier-atelier',
  },
];
