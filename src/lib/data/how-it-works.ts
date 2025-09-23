export const HOW_IT_WORKS_CONSTANTS = {
  TITLE: '¿Cómo funciona?',
  SUBTITLE: 'Tres pasos. Cero estrés. Más descubrimiento.',
  NOTE: '* El destino se revela 48 horas antes para preservar la sorpresa. Se envía guía y checklist.',

  STEPS: [
    {
      num: '1',
      title: 'Planificá',
      description:
        'Elegí fechas, ciudad de origen, duración y presupuesto. Sumá filtros y mood si querés.',
      iconKey: 'calendar',
    },
    {
      num: '2',
      title: 'Recibí la sorpresa',
      description:
        'Confirmá tu viaje. Te revelamos el destino 48 h antes y te enviamos la guía para ese mood.',
      iconKey: 'question',
    },
    {
      num: '3',
      title: 'Viajá sin estrés',
      description:
        'Hacé la valija. Pasajes y alojamiento listos; soporte humano cuando lo necesites.',
      iconKey: 'luggage',
    },
  ] as const,

  BADGES: [
    'Confiado por viajeros',
    'Atención humana 24/7',
    'Pagos seguros',
    'Pet-friendly ready',
  ] as const,

  // Accessibility
  SECTION_ARIA_LABEL: 'Cómo funciona Random Trip - Proceso de 3 pasos',
} as const;

export type HowItWorksConstants = typeof HOW_IT_WORKS_CONSTANTS;
