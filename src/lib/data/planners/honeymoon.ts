import type { TypePlannerContent } from '@/types/planner';
import { honeymoonTiers } from '@/lib/data/tiers/honeymoon';
import { HONEYMOON_ALMA_OPTIONS } from '@/components/by-type/honeymoon/honeymoonAlmaOptions';

// Honeymoon has a simplified structure - single tier, goes directly to basic-config
export const honeymoonPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Honeymoon Randomtrip',
  subtitle:
    'Una luna de miel sin coordenadas fijas, diseñada a medida. Nosotros ponemos el escenario; ustedes escriben la historia.',
  tiers: honeymoonTiers,
  almaOptions: HONEYMOON_ALMA_OPTIONS,
  steps: {
    step2Label: 'Luna de Miel',
    presupuesto: {
      title: 'Tu Luna de Miel Premium',
      tagline:
        'Una experiencia única y a medida para el comienzo de su vida juntos.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos',
        'Transporte',
        'Alojamiento',
        'Experiencias únicas',
        'Extras',
        'Perks Exclusivos',
      ],
    },
    laExcusa: {
      title: 'Luna de Miel',
      tagline: 'El primer capítulo de su historia juntos',
      cards: [], // Honeymoon doesn't use step 2
    },
    afinarDetalles: {
      title: 'Detalles Finales',
      tagline: 'Personalizá tu luna de miel',
      ctaLabel: '✨ Crear lo extraordinario →',
    },
  },
};
