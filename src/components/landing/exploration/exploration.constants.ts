export const EXPLORATION_CONSTANTS = {
  TITLE: 'Puntos de Partida',
  SUBTITLE: 'Elige cómo quieres empezar a dar forma a tu aventura.',
  TABS: [
    {
      id: 'By Traveller',
      label: 'By Traveller',
      description: '¿Con quién vas a escribir tu próxima historia?',
    },
    {
      id: 'Top Trippers',
      label: 'Top Trippers',
      description: 'Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?',
      href: '/trippers',
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
      href: '/trippers-decode',
    },
  ] as const,

  TAB_DESCRIPTIONS: {
    'By Traveller': '¿Con quién vas a escribir tu próxima historia?',
    'Top Trippers':
      'Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?',
    Roadtrips: 'Libertad sobre ruedas. Tú eliges el ritmo.',
    'Trippers Decode':
      'Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.',
  } as const,
} as const;
