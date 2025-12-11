export const EXPLORATION_CONSTANTS = {
  EYEBROW: 'Dale forma a tu aventura',
  TITLE: 'Puntos de Partida',
  SUBTITLE: 'Elige cómo quieres empezar a dar forma a tu aventura.',
  TABS: [
    {
      id: 'By Traveller',
      label: 'By Traveller',
      description: '¿Con quién vas a escribir tu próxima historia?',
      disabled: false,
    },
    {
      id: 'Top Trippers',
      label: 'Top Trippers',
      description: 'Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?',
      href: '/trippers',
      disabled: false,
    },
    // {
    //   id: 'Roadtrips',
    //   label: 'Roadtrips',
    //   description: 'Libertad sobre ruedas. Tú eliges el ritmo.',
    //   disabled: true,
    // },
    // {
    //   id: 'Trippers Decode',
    //   label: 'Destination Decode',
    //   description:
    //     'Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.',
    //   href: '/trippers-decode',
    //   disabled: true,
    // },
  ],

  TAB_DESCRIPTIONS: {
    'By Traveller': '¿Con quién vas a escribir tu próxima historia?',
    'Top Trippers':
      'Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?',
    Roadtrips: 'Libertad sobre ruedas. Tú eliges el ritmo.',
    'Trippers Decode':
      'Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.',
  },
};
