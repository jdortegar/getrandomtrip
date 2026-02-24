/**
 * Image paths for How it works and Benefits (content comes from dictionary).
 */
export const HOW_IT_WORKS_IMAGE_SRCS = [
  '/images/how-it-works-1.png',
  '/images/how-it-works-2.png',
  '/images/how-it-works-3.png',
] as const;

export const BENEFITS_IMAGE_SRCS = [
  '/images/benefits-1.png',
  '/images/benefits-2.png',
  '/images/benefits-3.png',
] as const;

/** Fallback steps (Spanish) when HomeInfo is used without localized steps (e.g. tripper page). */
export const FALLBACK_HOW_IT_WORKS_STEPS = [
  {
    title: 'PLANIFICÁ',
    description:
      'Elegí fechas, ciudad de origen, duración y presupuesto. Sumá filtros y mood si querés.',
    imageSrc: HOW_IT_WORKS_IMAGE_SRCS[0],
    imageAlt: 'Camino entre bosque verde',
  },
  {
    title: 'RECIBÍ LA SORPRESA',
    description:
      'Confirmá tu viaje. Te revelamos el destino desde 48 h antes y te enviamos la guía para ese mood.',
    imageSrc: HOW_IT_WORKS_IMAGE_SRCS[1],
    imageAlt: 'Interior de avión de noche',
  },
  {
    title: 'VIAJÁ SIN STRESS',
    description:
      'Hacé la valija. Pasajes y alojamiento listos; soporte humano cuando lo necesites.',
    imageSrc: HOW_IT_WORKS_IMAGE_SRCS[2],
    imageAlt: 'Vista desde ventanilla del avión',
  },
];

export const FALLBACK_BENEFITS_STEPS = [
  {
    title: 'sin stress y flexible',
    description:
      'Decís cuánto querés gastar y cuándo; con opciones y filtros para adaptar la sorpresa a vos. Nosotros resolvemos lo demás.',
    imageSrc: BENEFITS_IMAGE_SRCS[0],
    imageAlt: 'Camino entre bosque verde',
  },
  {
    title: 'Todo resuelto',
    description:
      'Pasajes y alojamientos alineados a tu presupuesto y estilo de viaje.',
    imageSrc: BENEFITS_IMAGE_SRCS[1],
    imageAlt: 'Interior de avión de noche',
  },
  {
    title: 'descubrimiento auténtico',
    description:
      'Viví la emoción de lo inesperado con curaduría real, no al azar.',
    imageSrc: BENEFITS_IMAGE_SRCS[2],
    imageAlt: 'Vista desde ventanilla del avión',
  },
];
