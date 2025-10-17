import type { TypePlannerContent } from '@/types/planner';
import { pawsTiers } from '@/lib/data/tiers/paws';
import { PAWS_ALMA_OPTIONS } from '@/components/by-type/paws/pawsAlmaOptions';

export const pawsPlannerContent: TypePlannerContent = {
  title: 'Diseñen su PAWS Randomtrip',
  subtitle:
    'Tres pasos sencillos para una aventura donde tu mascota es protagonista.',
  tiers: pawsTiers,
  almaOptions: PAWS_ALMA_OPTIONS,
  steps: {
    step2Label: 'Tipo de Viaje',
    presupuesto: {
      title: '¿Cuánto quieren gastar?',
      tagline:
        'Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento (incluyendo a tu compañer@ de 4 patas). Ese será su techo. Del resto… nos ocupamos nosotros.',
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
      title: '¿Qué tipo de escapada buscan?',
      tagline:
        'Viajar con tu mascota tiene su propia alma. Elegí la tuya y armamos el viaje perfecto.',
      cards: [
        {
          key: 'trails-nature',
          title: 'Senderos & Naturaleza 🌲🐾',
          img: 'https://images.unsplash.com/photo-1747133462919-ea91d748a2e2',
          description:
            'Rutas y paisajes pensados para caminar juntos, sin correa al tiempo.',
        },
        {
          key: 'dog-friendly-beaches',
          title: 'Playas Dog-Friendly 🏖️🐕',
          img: 'https://plus.unsplash.com/premium_photo-1671496450445-01c3f9088b8a',
          description:
            'Arena, mar y carreras infinitas. El paraíso también tiene huellas.',
        },
        {
          key: 'pet-lover-cities',
          title: 'Ciudades Pet Lovers 🏙️🐩',
          img: 'https://plus.unsplash.com/premium_photo-1679519057198-81180a5419a8',
          description:
            'Explorar urbes donde cada café, parque y esquina los recibe como locales.',
        },
        {
          key: 'outdoor-adventure',
          title: 'Aventura Outdoor ⛰️🐕‍🦺',
          img: 'https://images.unsplash.com/photo-1629952071864-c7aa7cf93e97',
          description:
            'Trekking, camping y escapadas off-road, con tu compañero de cuatro patas al lado.',
        },
        {
          key: 'relax-wellness',
          title: 'Relax & Bienestar 🛶🐾',
          img: 'https://plus.unsplash.com/premium_photo-1663036405014-3b4f2713633c',
          description:
            'Hoteles pet-friendly, spas con calma y rincones donde el descanso también es compartido.',
        },
        {
          key: 'food-getaways',
          title: 'Escapadas Gastronómicas 🍲🐕',
          img: 'https://plus.unsplash.com/premium_photo-1679503586519-49c94c258b74',
          description:
            'Descubrir sabores locales en destinos donde las mascotas también tienen mesa reservada.',
        },
        {
          key: 'rural-farm',
          title: 'Trips Rurales & Granja 🐓🐶',
          img: 'https://plus.unsplash.com/premium_photo-1666275372016-42a8ad9744c5',
          description:
            'Volver a lo simple: aire puro, espacios abiertos y la alegría de lo natural.',
        },
        {
          key: 'dog-events',
          title: 'Dog Events & Comunidades 🎪🐕',
          img: 'https://images.unsplash.com/photo-1580230273708-4e7b8f6d63c0',
          description:
            'Viajes que giran en torno a festivales, encuentros o actividades caninas.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen sus detalles',
      tagline:
        'Elijan las opciones que les gustan para crear su viaje pet-friendly.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
