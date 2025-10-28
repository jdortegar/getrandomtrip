import type { AlmaSpec } from '@/types/planner';

// Paws has a unique structure - pet configurator first, then escape type
// For the sake of TypePlanner, we'll use escape types as the "alma" options
export const PAWS_EXCUSE_OPTIONS: Record<string, AlmaSpec> = {
  'trails-nature': {
    title: 'Senderos & Naturaleza',
    core: 'Rutas y paisajes pensados para caminar juntos, sin correa al tiempo.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-green-900/30',
    heroImg: 'https://images.unsplash.com/photo-1747133462919-ea91d748a2e2',
    options: [
      {
        key: 'mountain-trails',
        label: 'Senderos de Montaña',
        desc: 'Caminatas con vistas panorámicas y aire puro.',
        img: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
      },
      {
        key: 'forest-walks',
        label: 'Bosques & Caminatas',
        desc: 'Explorar la naturaleza entre árboles y senderos.',
        img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      },
      {
        key: 'lake-trails',
        label: 'Rutas junto a Lagos',
        desc: 'Caminar al borde del agua con tu mascota.',
        img: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000',
      },
    ],
  },
  'dog-friendly-beaches': {
    title: 'Playas Dog-Friendly',
    core: 'Arena, mar y carreras infinitas. El paraíso también tiene huellas.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-blue-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1671496450445-01c3f9088b8a',
    options: [
      {
        key: 'coastal-beaches',
        label: 'Playas Costeras',
        desc: 'Arena fina y olas suaves para correr y jugar.',
        img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      },
      {
        key: 'quiet-coves',
        label: 'Calas Tranquilas',
        desc: 'Rincones de playa sin multitudes.',
        img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
      },
    ],
  },
  'pet-lover-cities': {
    title: 'Ciudades Pet Lovers',
    core: 'Explorar urbes donde cada café, parque y esquina los recibe como locales.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-gray-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1679519057198-81180a5419a8',
    options: [
      {
        key: 'pet-cafes',
        label: 'Cafés & Restaurantes Pet-Friendly',
        desc: 'Lugares donde ambos son bienvenidos.',
        img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      },
      {
        key: 'urban-parks',
        label: 'Parques Urbanos',
        desc: 'Espacios verdes en medio de la ciudad.',
        img: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f',
      },
    ],
  },
  'outdoor-adventure': {
    title: 'Aventura Outdoor',
    core: 'Trekking, camping y escapadas off-road, con tu compañero de cuatro patas al lado.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-amber-900/30',
    heroImg: 'https://images.unsplash.com/photo-1629952071864-c7aa7cf93e97',
    options: [
      {
        key: 'camping-trips',
        label: 'Camping & Naturaleza',
        desc: 'Acampar bajo las estrellas con tu mascota.',
        img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d',
      },
      {
        key: 'adventure-trails',
        label: 'Rutas de Aventura',
        desc: 'Senderos desafiantes para disfrutar juntos.',
        img: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
      },
    ],
  },
  'relax-wellness': {
    title: 'Relax & Bienestar',
    core: 'Hoteles pet-friendly, spas con calma y rincones donde el descanso también es compartido.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-emerald-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1663036405014-3b4f2713633c',
    options: [
      {
        key: 'pet-spa',
        label: 'Spa & Wellness Pet-Friendly',
        desc: 'Relajación para ambos.',
        img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
      },
      {
        key: 'quiet-retreats',
        label: 'Retiros Tranquilos',
        desc: 'Espacios de paz y descanso compartido.',
        img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      },
    ],
  },
  'food-getaways': {
    title: 'Escapadas Gastronómicas',
    core: 'Descubrir sabores locales en destinos donde las mascotas también tienen mesa reservada.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-orange-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1679503586519-49c94c258b74',
    options: [
      {
        key: 'pet-restaurants',
        label: 'Restaurantes Pet-Friendly',
        desc: 'Gastronomía para compartir.',
        img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      },
    ],
  },
  'rural-farm': {
    title: 'Trips Rurales & Granja',
    core: 'Volver a lo simple: aire puro, espacios abiertos y la alegría de lo natural.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-yellow-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1666275372016-42a8ad9744c5',
    options: [
      {
        key: 'farm-stays',
        label: 'Estadías en Granjas',
        desc: 'Experiencias rurales auténticas.',
        img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
      },
      {
        key: 'countryside',
        label: 'Campo Abierto',
        desc: 'Espacios para correr y explorar libremente.',
        img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
      },
    ],
  },
  'dog-events': {
    title: 'Dog Events & Comunidades',
    core: 'Viajes que giran en torno a festivales, encuentros o actividades caninas.',
    ctaLabel: 'Continuar al diseño →',
    tint: 'bg-purple-900/30',
    heroImg: 'https://images.unsplash.com/photo-1580230273708-4e7b8f6d63c0',
    options: [
      {
        key: 'dog-festivals',
        label: 'Festivales Caninos',
        desc: 'Eventos y encuentros para perros.',
        img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
      },
      {
        key: 'pet-communities',
        label: 'Comunidades Pet',
        desc: 'Conocer otros viajeros con mascotas.',
        img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
      },
    ],
  },
};
