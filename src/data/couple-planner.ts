import type { TypePlannerContent } from '@/types/planner';
import { coupleTiers } from '@/lib/data/coupleTiers';
import { COUPLE_ALMA_OPTIONS } from '@/components/by-type/couple/coupleAlmaOptions';

export const couplePlannerContent: TypePlannerContent = {
  title: 'Diseñen su Randomtrip en pareja',
  subtitle:
    'Tres pasos sencillos para vivir una historia que nadie más podrá contar.',
  tiers: coupleTiers,
  almaOptions: COUPLE_ALMA_OPTIONS,
  steps: {
    step2Label: 'La Excusa',
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
      title: 'Viajamos por muchas razones, ¿cuál los mueve hoy?',
      tagline:
        'Toda escapada tiene su "porque sí". Armando el Destination Decoded.',
      cards: [
        {
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          img: 'https://images.unsplash.com/photo-1639748399660-734ae9ec2f8a',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
        },
        {
          key: 'adventure-duo',
          title: 'Dúo de Aventura',
          img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
          description:
            'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
        },
        {
          key: 'foodie-lovers',
          title: 'Foodie Lovers',
          img: 'https://images.unsplash.com/photo-1663428710477-c7c838be76b5',
          description:
            'Para quienes creen que el amor también entra por el paladar.',
        },
        {
          key: 'culture-tradition',
          title: 'Cultura & Tradición',
          img: 'https://images.unsplash.com/photo-1717801556175-3a22bd4a0360',
          description:
            'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
        },
        {
          key: 'wellness-retreat',
          title: 'Wellness Retreat',
          img: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da',
          description:
            'Un respiro compartido: spa, silencio y bienestar en pareja.',
        },
        {
          key: 'celebrations',
          title: 'Celebraciones',
          img: 'https://images.unsplash.com/photo-1746559893894-92e3318393bc',
          description:
            'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
        },
        {
          key: 'beach-dunes',
          title: 'Playa & Dunas',
          img: 'https://images.unsplash.com/photo-1756506606876-e0ed2a999616',
          description:
            'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
        },
        {
          key: 'urban-getaway',
          title: 'Escapada Urbana',
          img: 'https://images.unsplash.com/photo-1634452584863-e6590064b4d3',
          description:
            'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen sus detalles',
      tagline: 'Elijan las opciones que les gustan para crear su viaje.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
