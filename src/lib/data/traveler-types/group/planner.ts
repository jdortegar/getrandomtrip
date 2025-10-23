import type { TypePlannerContent } from '@/types/planner';
import { groupTiers } from './tiers';
import { GROUP_ALMA_OPTIONS } from './alma-options';

export const groupPlannerContent: TypePlannerContent = {
  title: 'De amigos a equipos: diseñen su Randomtrip',
  subtitle: 'Pasos cortos, para crear la mejor experiencia grupal.',
  tiers: groupTiers,
  almaOptions: GROUP_ALMA_OPTIONS,
  steps: {
    step2Label: 'Tipo de Experiencia',
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
      title: '¿Qué tipo de experiencia buscan?',
      tagline: 'Elijan el estilo de viaje que más los representa como grupo.',
      cards: [
        {
          key: 'visual-storytellers',
          title: 'Narradores Visuales',
          img: 'https://images.unsplash.com/photo-1527499354222-c3975b69f669?auto=format&fit=crop&w=800&q=80',
          description:
            'Viajes diseñados para quienes buscan mirar el mundo a través de un lente, capturar historias y volver con memorias que son también obras visuales.',
        },
        {
          key: 'yoga-wellness',
          title: 'Yoga & Bienestar',
          img: 'https://images.unsplash.com/photo-1475444239989-05b09b5453c2?auto=format&fit=crop&w=800&q=80',
          description:
            'Escapadas pensadas para reconectar cuerpo, mente y espíritu en entornos que invitan a bajar el ritmo.',
        },
        {
          key: 'spiritual',
          title: 'Religioso o Espiritual',
          img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
          description:
            'Viajes para quienes buscan lo trascendente, con espacios de silencio, comunidad y sentido.',
        },
        {
          key: 'foodies',
          title: 'Gastronómico',
          img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
          description:
            'Viajes que exploran culturas a través de sabores, aromas y experiencias culinarias únicas.',
        },
        {
          key: 'stories-fantasy',
          title: 'Historias & Fantasía',
          img: 'https://images.unsplash.com/photo-1534685785742-43a2539a215a?auto=format&fit=crop&w=800&q=80',
          description:
            'Viajes que transforman libros, sagas y películas en escenarios reales donde todo se siente posible.',
        },
        {
          key: 'nature-adventure',
          title: 'Naturaleza & Aventura',
          img: 'https://images.unsplash.com/photo-1505521216430-8b73b2067359?auto=format&fit=crop&w=800&q=80',
          description:
            'Escapadas que retan cuerpo y espíritu, donde cada kilómetro recorrido es un logro compartido.',
        },
        {
          key: 'friends',
          title: 'Amigos',
          img: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=800&q=80',
          description:
            'Viajes que celebran la amistad, las risas compartidas y los momentos que después se cuentan mil veces.',
        },
        {
          key: 'business',
          title: 'Negocios',
          img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
          description:
            'Experiencias que combinan estrategia, networking y conexión real fuera de la oficina.',
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
