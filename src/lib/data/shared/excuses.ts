// Centralized excuse data - single source of truth
export interface ExcuseData {
  key: string;
  title: string;
  description: string;
  img: string;
  details: {
    title: string;
    core: string;
    ctaLabel: string;
    tint: string;
    heroImg: string;
    options: Array<{
      key: string;
      label: string;
      desc: string;
      img: string;
    }>;
  };
}

// Solo traveler excuses
export const soloExcuses: ExcuseData[] = [
  {
    key: 'solo-adventure',
    title: 'Aventura en Solitario',
    description: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    details: {
      title: 'Aventura en Solitario',
      core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
      ctaLabel: 'Aventúrate solo →',
      tint: 'bg-blue-900/30',
      heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      options: [
        {
          key: 'hiking-trekking',
          label: 'Senderismo & Trekking',
          desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'water-sports',
          label: 'Deportes Acuáticos',
          desc: 'Sumergirse en aventuras que te mantengan a flote.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'extreme-sports',
          label: 'Deportes Extremos',
          desc: 'Adrenalina pura que te haga sentir vivo.',
          img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
        },
      ],
    },
  },
  {
    key: 'cultural-immersion',
    title: 'Inmersión Cultural',
    description: 'Sumergirse en tradiciones, sabores y costumbres locales.',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    details: {
      title: 'Inmersión Cultural',
      core: 'Sumergirse en tradiciones, sabores y costumbres locales.',
      ctaLabel: 'Sumérgete en la cultura →',
      tint: 'bg-amber-900/30',
      heroImg: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      options: [
        {
          key: 'local-traditions',
          label: 'Tradiciones Locales',
          desc: 'Participar en ceremonias y festividades auténticas.',
          img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        },
        {
          key: 'culinary-tours',
          label: 'Tours Culinarios',
          desc: 'Saborear la gastronomía local con chefs y familias.',
          img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
        },
        {
          key: 'art-galleries',
          label: 'Arte & Galerías',
          desc: 'Explorar el arte local y las expresiones culturales.',
          img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
        },
      ],
    },
  },
  {
    key: 'wellness-retreat',
    title: 'Retiro de Bienestar',
    description:
      'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
    img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
    details: {
      title: 'Retiro de Bienestar',
      core: 'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
      ctaLabel: 'Renueva tu energía →',
      tint: 'bg-green-900/30',
      heroImg: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
      options: [
        {
          key: 'spa-treatments',
          label: 'Tratamientos de Spa',
          desc: 'Relajación y rejuvenecimiento en un ambiente de lujo.',
          img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
        },
        {
          key: 'meditation-yoga',
          label: 'Meditación & Yoga',
          desc: 'Encuentra tu centro a través de la práctica consciente.',
          img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        },
        {
          key: 'nature-immersion',
          label: 'Inmersión en la Naturaleza',
          desc: 'Conecta con el entorno natural para encontrar paz interior.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
      ],
    },
  },
];

// Couple traveler excuses
export const coupleExcuses: ExcuseData[] = [
  {
    key: 'romantic-getaway',
    title: 'Escapada Romántica',
    description:
      'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
    img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
    details: {
      title: 'Escapada Romántica',
      core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
      ctaLabel: 'Enciendan la chispa →',
      tint: 'bg-rose-900/30',
      heroImg: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
      options: [
        {
          key: 'culture-traditions',
          label: 'Cultura Local & Paseos Tranquilos',
          desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
          img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
        },
        {
          key: 'spa-day',
          label: 'Wellness & Spa',
          desc: 'Detox. Retox. Repeat.',
          img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
        },
        {
          key: 'wine-tasting',
          label: 'Experiencias Gastronómicas & Vinos',
          desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
          img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
        },
      ],
    },
  },
  {
    key: 'adventure-couple',
    title: 'Aventura en Pareja',
    description: 'Descubrir juntos lugares que los desafíen y los unan más.',
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    details: {
      title: 'Aventura en Pareja',
      core: 'Descubrir juntos lugares que los desafíen y los unan más.',
      ctaLabel: 'Aventúrense juntos →',
      tint: 'bg-emerald-900/30',
      heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      options: [
        {
          key: 'hiking-trekking',
          label: 'Senderismo & Trekking',
          desc: 'Caminar juntos hacia lugares que solo se alcanzan a pie.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'water-sports',
          label: 'Deportes Acuáticos',
          desc: 'Sumergirse en aventuras que los mantengan a flote.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'extreme-sports',
          label: 'Deportes Extremos',
          desc: 'Adrenalina compartida que los haga sentir vivos.',
          img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
        },
      ],
    },
  },
];

// Family traveler excuses
export const familyExcuses: ExcuseData[] = [
  {
    key: 'family-adventure',
    title: 'Aventura Familiar',
    description: 'Crear recuerdos inolvidables para toda la familia.',
    img: 'https://images.unsplash.com/photo-1506905925346-14b1e3dba71b',
    details: {
      title: 'Aventura Familiar',
      core: 'Crear recuerdos inolvidables para toda la familia.',
      ctaLabel: 'Aventúrense en familia →',
      tint: 'bg-orange-900/30',
      heroImg: 'https://images.unsplash.com/photo-1506905925346-14b1e3dba71b',
      options: [
        {
          key: 'theme-parks',
          label: 'Parques Temáticos',
          desc: 'Diversión garantizada para todas las edades.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'nature-exploration',
          label: 'Exploración Natural',
          desc: 'Descubrir la naturaleza juntos como familia.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
        {
          key: 'cultural-learning',
          label: 'Aprendizaje Cultural',
          desc: 'Enseñar a los niños sobre diferentes culturas.',
          img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        },
      ],
    },
  },
];

// Group traveler excuses
export const groupExcuses: ExcuseData[] = [
  {
    key: 'group-adventure',
    title: 'Aventura Grupal',
    description: 'Compartir experiencias únicas con tus amigos más cercanos.',
    img: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318',
    details: {
      title: 'Aventura Grupal',
      core: 'Compartir experiencias únicas con tus amigos más cercanos.',
      ctaLabel: 'Aventúrense juntos →',
      tint: 'bg-purple-900/30',
      heroImg: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318',
      options: [
        {
          key: 'team-building',
          label: 'Actividades de Equipo',
          desc: 'Fortalecer lazos a través de desafíos compartidos.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'nightlife',
          label: 'Vida Nocturna',
          desc: 'Disfrutar de la noche con tus mejores amigos.',
          img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
        },
        {
          key: 'sports-activities',
          label: 'Actividades Deportivas',
          desc: 'Competir y divertirse en actividades deportivas.',
          img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
        },
      ],
    },
  },
];

// Honeymoon traveler excuses
export const honeymoonExcuses: ExcuseData[] = [
  {
    key: 'honeymoon-luxury',
    title: 'Luna de Miel de Lujo',
    description:
      'El comienzo perfecto de su vida juntos con experiencias únicas.',
    img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
    details: {
      title: 'Luna de Miel de Lujo',
      core: 'El comienzo perfecto de su vida juntos con experiencias únicas.',
      ctaLabel: 'Celebren su amor →',
      tint: 'bg-pink-900/30',
      heroImg: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
      options: [
        {
          key: 'romantic-dinners',
          label: 'Cenas Románticas',
          desc: 'Momentos íntimos con la mejor gastronomía.',
          img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
        },
        {
          key: 'luxury-spa',
          label: 'Spa de Lujo',
          desc: 'Relajación y bienestar en el más alto nivel.',
          img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
        },
        {
          key: 'private-tours',
          label: 'Tours Privados',
          desc: 'Experiencias exclusivas solo para ustedes dos.',
          img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
        },
      ],
    },
  },
];

// Paws traveler excuses
export const pawsExcuses: ExcuseData[] = [
  {
    key: 'paws-adventure',
    title: 'Aventura con Mascotas',
    description: 'Incluir a tu mejor amigo peludo en la aventura.',
    img: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
    details: {
      title: 'Aventura con Mascotas',
      core: 'Incluir a tu mejor amigo peludo en la aventura.',
      ctaLabel: 'Aventúrense juntos →',
      tint: 'bg-yellow-900/30',
      heroImg: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
      options: [
        {
          key: 'pet-friendly-parks',
          label: 'Parques Pet-Friendly',
          desc: 'Espacios donde tu mascota puede correr libremente.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
        {
          key: 'beach-activities',
          label: 'Actividades en la Playa',
          desc: 'Disfrutar del sol y la arena con tu compañero peludo.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'hiking-trails',
          label: 'Senderos para Caminar',
          desc: 'Explorar la naturaleza juntos en senderos pet-friendly.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
      ],
    },
  },
];

// All excuses combined
export const allExcuses: ExcuseData[] = [
  ...soloExcuses,
  ...coupleExcuses,
  ...familyExcuses,
  ...groupExcuses,
  ...honeymoonExcuses,
  ...pawsExcuses,
];

// Helper function to get excuses by traveler type
export function getExcusesByTravelerType(travelerType: string): ExcuseData[] {
  switch (travelerType) {
    case 'solo':
      return soloExcuses;
    case 'couple':
      return coupleExcuses;
    case 'family':
      return familyExcuses;
    case 'group':
      return groupExcuses;
    case 'honeymoon':
      return honeymoonExcuses;
    case 'paws':
      return pawsExcuses;
    default:
      return [];
  }
}

// Helper function to get excuse by key
export function getExcuseByKey(key: string): ExcuseData | null {
  return allExcuses.find((excuse) => excuse.key === key) || null;
}
