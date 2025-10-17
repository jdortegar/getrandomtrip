import type { TypePlannerContent } from '@/types/planner';
import { soloTiers } from '@/lib/data/tiers/solo';
import { SOLO_ALMA_OPTIONS } from '@/components/by-type/solo/soloAlmaOptions';

export const soloPlannerContent: TypePlannerContent = {
  title: 'Diseña tu Randomtrip en solitario',
  subtitle: 'Tres pasos sencillos para una aventura que solo tú podrás contar.',
  tiers: soloTiers,
  almaOptions: SOLO_ALMA_OPTIONS,
  steps: {
    step2Label: 'Tu Alma',
    presupuesto: {
      title: '¿Cuánto quieres gastar?',
      tagline:
        'Lo único que defines acá es el presupuesto por persona para pasaje y alojamiento. Ese será tu techo. Del resto… nos ocupamos nosotros.',
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
      title: '¿Qué tipo de viaje en solitario buscas?',
      tagline:
        'Viajar solo tiene su propia alma. Elegí la tuya y armamos el Destination Decoded perfecto.',
      cards: [
        {
          key: 'get-lost',
          title: 'Get Lost',
          img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          description:
            'Apagar el mundo para conectarse con uno mismo. El bosque como compañía, el río como soundtrack.',
        },
        {
          key: 'urban-nomad',
          title: 'Urban Nomad',
          img: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
          description:
            'Explorar ciudades a tu ritmo, perderte en sus calles y encontrarte en sus rincones.',
        },
        {
          key: 'work-travel',
          title: 'Work & Travel',
          img: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546',
          description:
            'Trabajar desde cualquier lugar, descubrir nuevos espacios y vivir como local.',
        },
        {
          key: 'foodie-journey',
          title: 'Foodie Journey',
          img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
          description:
            'Un viaje gastronómico donde cada plato cuenta una historia que solo tú descubres.',
        },
        {
          key: 'wellness-solo',
          title: 'Wellness Solo',
          img: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
          description:
            'Un retiro personal: yoga, meditación y el lujo de reconectarte contigo.',
        },
        {
          key: 'adventure-solo',
          title: 'Adventure Solo',
          img: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
          description:
            'La libertad de explorar montañas, senderos y paisajes sin depender de nadie más.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afiná tus detalles',
      tagline: 'Elegí las opciones que te gustan para crear tu viaje.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
