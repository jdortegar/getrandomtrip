import type { AlmaSpec } from '@/types/planner';

// Honeymoon uses a simplified structure - single tier only
// No alma selection needed, just goes directly to basic-config
export const HONEYMOON_ALMA_OPTIONS: Record<string, AlmaSpec> = {
  'atelier-honeymoon': {
    title: 'Luna de Miel Premium',
    core: 'Una luna de miel sin coordenadas fijas, diseñada a medida. Nosotros ponemos el escenario; ustedes escriben la historia.',
    ctaLabel: '✨ Crear lo extraordinario →',
    tint: 'bg-rose-900/30',
    heroImg: '/images/journey-types/honeymoon-same-sex.jpg',
    options: [],
  },
};
