import type { TypePlannerContent } from '@/types/planner';
import { familyTiers } from './tiers';
import { FAMILY_ALMA_OPTIONS } from './alma-options';

export const familyPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Randomtrip en familia',
  subtitle: '3 pasos cortos, para que comencemos a crear la mejor experiencia.',
  tiers: familyTiers,
  almaOptions: FAMILY_ALMA_OPTIONS,
  steps: {
    step2Label: 'La Excusa',
    presupuesto: {
      title: '¿Cuánto quieren invertir?',
      tagline:
        'Definan el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos',
        'Transporte',
        'Alojamiento',
        'Experiencias familiares',
        'Extras',
        'Destination Decoded',
      ],
    },
    laExcusa: {
      title: 'Viajan en familia por muchas razones, ¿cuál los mueve hoy?',
      tagline: 'Toda escapada familiar tiene su "porque sí".',
      cards: [
        {
          key: 'family-adventure',
          title: 'Aventura Familiar',
          img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
          description:
            'Experiencias que todos disfrutarán, desde los más chicos hasta los abuelos.',
        },
        {
          key: 'nature-exploration',
          title: 'Exploración Natural',
          img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
          description:
            'Conectar con la naturaleza en familia, aprendiendo y disfrutando juntos.',
        },
        {
          key: 'cultural-discovery',
          title: 'Descubrimiento Cultural',
          img: 'https://images.unsplash.com/photo-1717801556175-3a22bd4a0360',
          description:
            'Museos, tradiciones y costumbres para que toda la familia aprenda.',
        },
        {
          key: 'beach-relaxation',
          title: 'Relax en Playa',
          img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          description: 'Sol, arena y diversión para toda la familia.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen los detalles',
      tagline:
        'Elijan las opciones que les gustan para crear su viaje familiar.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
