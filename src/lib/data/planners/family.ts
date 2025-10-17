import type { TypePlannerContent } from '@/types/planner';
import { familyTiers } from '@/lib/data/tiers/family';
import { FAMILY_ALMA_OPTIONS } from '@/components/by-type/family/familyAlmaOptions';

export const familyPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Randomtrip en familia',
  subtitle: '3 pasos cortos, para que comencemos a crear la mejor experiencia.',
  tiers: familyTiers,
  almaOptions: FAMILY_ALMA_OPTIONS,
  steps: {
    step2Label: 'Tipo de Familia',
    presupuesto: {
      title: '¿Cuánto quieren gastar?',
      tagline:
        'Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos',
        'Transporte',
        'Alojamiento',
        'Experiencias únicas',
        'Extras',
        'Destination Decoded',
      ],
    },
    laExcusa: {
      title: '¿Con quién viajan?',
      tagline: 'De flotadores a tablas de surf: el viaje crece con tu familia.',
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
    afinarDetalles: {
      title: 'Afinen sus detalles',
      tagline: 'Elijan el tipo de escapada que quieren vivir.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
