import type { TypePlannerContent } from '@/types/planner';
import { groupTiers } from '@/lib/data/groupTiers';
import { GROUP_ALMA_OPTIONS } from '@/components/by-type/group/groupAlmaOptions';

export const groupPlannerContent: TypePlannerContent = {
  title: 'De amigos a equipos: diseñen su Randomtrip',
  subtitle: 'Pasos cortos, para crear la mejor experiencia.',
  tiers: groupTiers,
  almaOptions: GROUP_ALMA_OPTIONS,
  steps: {
    step2Label: 'Grupo & Alma',
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
      title: '¿Qué tipo de grupo son?',
      tagline:
        'Cada grupo tiene su propia alma. Contanos la tuya y armamos el Destination Decoded perfecto.',
      cards: [
        {
          key: 'visual-storytellers',
          title: 'Narradores Visuales',
          img: 'https://images.unsplash.com/photo-1483721310020-03333e577078',
          description:
            'De la cámara al drone: viajes para quienes miran el mundo a través de una lente. Nosotros armamos el escenario; ustedes capturan la historia.',
        },
        {
          key: 'yoga-wellness',
          title: 'Yoga & Bienestar',
          img: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d',
          description:
            'De la esterilla al amanecer: escapadas para reconectar cuerpo y mente. Nosotros diseñamos el espacio; ustedes encuentran la calma.',
        },
        {
          key: 'spiritual',
          title: 'Religioso o Espiritual',
          img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
          description:
            'Del silencio al canto: viajes para quienes buscan lo trascendente. Nosotros marcamos el camino; ustedes viven la fe y la conexión.',
        },
        {
          key: 'foodies',
          title: 'Gastronómico',
          img: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b',
          description:
            'De la cocina callejera al banquete local: escapadas para paladares curiosos. Nosotros preparamos la mesa; ustedes descubren el sabor.',
        },
        {
          key: 'stories-fantasy',
          title: 'Historias & Fantasía',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          description:
            'De pantallas y libros al viaje: vivan sus sagas y escenarios favoritos. Nosotros creamos la trama; ustedes son protagonistas.',
        },
        {
          key: 'nature-adventure',
          title: 'Naturaleza & Aventura',
          img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          description:
            'De la cima al río: para quienes buscan sudar, respirar y conquistar. Nosotros trazamos la ruta; ustedes se lanzan.',
        },
        {
          key: 'friends',
          title: 'Amigos',
          img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38',
          description:
            'De las risas al brindis: viajes para celebrar la amistad en cada kilómetro. Nosotros armamos el plan; ustedes las anécdotas.',
        },
        {
          key: 'business',
          title: 'Negocios',
          img: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6',
          description:
            'De la sala de juntas al destino sorpresa: escapadas que mezclan estrategia con conexión real.',
        },
        {
          key: 'students',
          title: 'Estudiantes',
          img: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b',
          description:
            'De la teoría al terreno: viajes que convierten el aprendizaje en aventura.',
        },
        {
          key: 'music-festivals',
          title: 'Música & Festivales',
          img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
          description:
            'Del backstage al campamento: viajes para quienes viven a ritmo de canciones.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen sus detalles',
      tagline: 'Elijan las opciones que les gustan para crear su viaje grupal.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
