import type { TypePlannerContent } from '@/types/planner';
import { groupTiers } from './tiers';
import { GROUP_ALMA_OPTIONS } from './alma-options';

export const groupPlannerContent: TypePlannerContent = {
  title: 'De amigos a equipos: diseñen su Randomtrip',
  subtitle: 'Pasos cortos, para crear la mejor experiencia grupal.',
  tiers: groupTiers,
  almaOptions: GROUP_ALMA_OPTIONS,
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
        'Experiencias grupales',
        'Extras',
        'Destination Decoded',
      ],
    },
    laExcusa: {
      title: 'Viajan en grupo por muchas razones, ¿cuál los mueve hoy?',
      tagline: 'Toda escapada con amigos tiene su "porque sí".',
      cards: [
        {
          key: 'group-adventure',
          title: 'Aventura Grupal',
          img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
          description:
            'Actividades emocionantes para compartir con toda la barra.',
        },
        {
          key: 'party-celebration',
          title: 'Celebración',
          img: 'https://images.unsplash.com/photo-1746559893894-92e3318393bc',
          description:
            'Un cumpleaños, despedida o simplemente la excusa perfecta para juntarse.',
        },
        {
          key: 'food-wine',
          title: 'Gastro & Vinos',
          img: 'https://images.unsplash.com/photo-1663428710477-c7c838be76b5',
          description: 'Rutas gastronómicas y catas para disfrutar en grupo.',
        },
        {
          key: 'urban-nightlife',
          title: 'Vida Urbana',
          img: 'https://images.unsplash.com/photo-1634452584863-e6590064b4d3',
          description:
            'Ciudades vibrantes con la mejor escena nocturna para el grupo.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen los detalles',
      tagline: 'Elijan las opciones que les gustan para crear su viaje grupal.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
