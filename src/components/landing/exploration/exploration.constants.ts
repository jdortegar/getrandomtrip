export const EXPLORATION_CONSTANTS = {
  TITLE: 'Start your Journey',
  SUBTITLE:
    'El mundo es vasto, lleno de maravillas. Pero la información nos abruma. Nosotros te preguntamos cómo quieres sentirte.',

  TABS: [
    {
      id: 'By Traveller',
      label: 'By Traveller',
      description: '¿Con quién vas a escribir tu próxima historia?',
    },
    {
      id: 'Top Trippers',
      label: 'Top Trippers',
      description: 'Nuestros expertos más destacados',
    },
    {
      id: 'Roadtrips',
      label: 'Roadtrips',
      description: 'Libertad sobre ruedas. Tú eliges el ritmo.',
    },
    {
      id: 'Trippers Decode',
      label: 'Trippers Decode',
      description:
        'Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.',
    },
  ] as const,

  TAB_DESCRIPTIONS: {
    'By Traveller': '¿Con quién vas a escribir tu próxima historia?',
    'Top Trippers': 'Nuestros expertos más destacados',
    Roadtrips: 'Libertad sobre ruedas. Tú eliges el ritmo.',
    'Trippers Decode':
      'Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.',
  } as const,
} as const;
