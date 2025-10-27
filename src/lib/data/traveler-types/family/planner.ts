import type { TypePlannerContent } from '@/types/planner';
import { familyTiers } from './tiers';
import { FAMILY_ALMA_OPTIONS } from './alma-options';

export const familyPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Randomtrip en familia',
  subtitle: '3 pasos cortos, para que comencemos a crear la mejor experiencia.',
  tiers: familyTiers,
  almaOptions: FAMILY_ALMA_OPTIONS,
  steps: {
    step2Label: 'Composición Familiar',
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
    excuse: {
      title: '¿Con quién viajan?',
      tagline:
        'Elijan la composición familiar para personalizar su experiencia.',
      cards: [
        {
          key: 'toddlers',
          title: 'Con los más chicos',
          img: '/images/placeholder/Toddlers.svg',
          description:
            'Cuando todavía hay cochecitos, mamaderas y siestas obligadas, todo cuenta… lo transformamos en juego y calma.',
        },
        {
          key: 'teens',
          title: 'Con adolescentes',
          img: '/images/placeholder/Teens.svg',
          description:
            'Secretos para que dejen el celular: primero viven, después publican.',
        },
        {
          key: 'adults',
          title: 'Con hijos grandes',
          img: '/images/placeholder/Adult.svg',
          description: 'Aventuras más intensas: trekking, surf, cultura local.',
        },
        {
          key: 'multigen',
          title: 'Con toda la familia',
          img: '/images/placeholder/Multi-Gen.svg',
          description:
            'Nadie queda afuera. Logística y actividades para cada edad.',
        },
      ],
    },
    details: {
      title: 'Afinen los detalles',
      tagline:
        'Elijan las opciones que les gustan para crear su viaje familiar.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
