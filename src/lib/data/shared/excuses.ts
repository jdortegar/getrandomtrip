// Centralized excuse data - single source of truth
// Which levels show excuse + refine-details is defined in @/lib/constants/product-config (hasExcuseStep):
// e.g. BOND/KIN/CREW/SOLUM/PAWS → Explora+ and Bivouac only; NUPTIA (honeymoon) → none; Atelier never.
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
          img: 'https://images.unsplash.com/photo-1733185396898-2da8b2fe7b36',
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
          img: 'https://images.unsplash.com/photo-1732798068339-4a686b74589f',
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

// Couple traveler excuses (EN PAREJA – only for levels with excuse step)
export const coupleExcuses: ExcuseData[] = [
  {
    key: 'escapada-romantica',
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
          key: 'cultura-local-paseos',
          label: 'Cultura Local & Paseos Tranquilos',
          desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
          img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
        },
        {
          key: 'wellness-spa',
          label: 'Wellness & Spa',
          desc: 'Detox. Retox. Repeat.',
          img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
        },
        {
          key: 'gastronomia-vinos',
          label: 'Experiencias Gastronómicas & Vinos',
          desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
          img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
        },
        {
          key: 'atardeceres-momentos',
          label: 'Atardeceres & Momentos Íntimos',
          desc: 'Lo simple que se vuelve eterno: mirarse en silencio frente a un horizonte compartido.',
          img: 'https://images.unsplash.com/photo-1519046904884-53103a34bed6',
        },
      ],
    },
  },
  {
    key: 'duo-aventura',
    title: 'Dúo de Aventura',
    description:
      'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    details: {
      title: 'Dúo de Aventura',
      core: 'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
      ctaLabel: 'Aventúrense juntos →',
      tint: 'bg-emerald-900/30',
      heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      options: [
        {
          key: 'trekking-naturaleza',
          label: 'Trekking & Naturaleza',
          desc: 'Subir juntos, descubrir juntos, conquistar juntos.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'aventura-acuatica',
          label: 'Aventura Acuática',
          desc: 'Ríos, lagos o mares: dejarse llevar por la corriente y la adrenalina compartida.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'exploracion-fauna',
          label: 'Exploración de Fauna',
          desc: 'La emoción de observar la vida salvaje como testigos privilegiados.',
          img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
        },
        {
          key: 'desierto-dunas',
          label: 'Desierto & Dunas',
          desc: 'La vastedad dorada donde cada paso es un acto de complicidad.',
          img: 'https://images.unsplash.com/photo-1509316785399-283f1850ccaf',
        },
      ],
    },
  },
  {
    key: 'foodie-lovers',
    title: 'Foodie Lovers',
    description:
      'Para quienes creen que el amor también entra por el paladar.',
    img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
    details: {
      title: 'Foodie Lovers',
      core: 'Para quienes creen que el amor también entra por el paladar.',
      ctaLabel: 'Saboreen juntos →',
      tint: 'bg-amber-900/30',
      heroImg: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
      options: [
        {
          key: 'talleres-cocina',
          label: 'Talleres & Experiencias de Cocina',
          desc: 'Cocinar juntos: un caos divertido que se transforma en complicidad.',
          img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
        },
        {
          key: 'street-food-mercados',
          label: 'Street Food & Mercados',
          desc: 'Descubrir el alma de un lugar en un bocado callejero.',
          img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        },
        {
          key: 'fine-dining-gourmet',
          label: 'Fine Dining & Experiencias Gourmet',
          desc: 'Una mesa donde cada plato se vuelve parte de la celebración.',
          img: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        },
        {
          key: 'rutas-vino-bodegas',
          label: 'Rutas de Vino & Bodegas',
          desc: 'Brindar en paisajes que saben a historia y terroir.',
          img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
        },
      ],
    },
  },
  {
    key: 'cultura-tradicion',
    title: 'Cultura & Tradición',
    description:
      'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    details: {
      title: 'Cultura & Tradición',
      core: 'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
      ctaLabel: 'Descubran juntos →',
      tint: 'bg-amber-900/30',
      heroImg: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      options: [
        {
          key: 'museos-patrimonio',
          label: 'Museos & Patrimonio',
          desc: 'El arte y la historia como excusa para caminar más lento.',
          img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
        },
        {
          key: 'pueblos-caminatas',
          label: 'Pueblos & Caminatas',
          desc: 'Calles pequeñas, historias grandes: el encanto de lo cotidiano.',
          img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        },
        {
          key: 'artesania-diseno-local',
          label: 'Artesanía & Diseño Local',
          desc: 'Objetos que cuentan historias hechas a mano, para llevarlas con ustedes.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        },
        {
          key: 'festivales-locales',
          label: 'Festivales Locales',
          desc: 'La magia de compartir costumbres que se viven con alegría colectiva.',
          img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
        },
      ],
    },
  },
  {
    key: 'wellness-retreat',
    title: 'Wellness Retreat',
    description:
      'Un respiro compartido: spa, silencio y bienestar en pareja.',
    img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
    details: {
      title: 'Wellness Retreat',
      core: 'Un respiro compartido: spa, silencio y bienestar en pareja.',
      ctaLabel: 'Renueven su energía →',
      tint: 'bg-green-900/30',
      heroImg: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
      options: [
        {
          key: 'spa-termas',
          label: 'Spa & Termas',
          desc: 'Agua, calma y el lujo de no tener que hacer nada más.',
          img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
        },
        {
          key: 'yoga-mindfulness',
          label: 'Yoga & Mindfulness',
          desc: 'Respirar al unísono y reconectar con la esencia compartida.',
          img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        },
        {
          key: 'naturaleza-silenciosa',
          label: 'Naturaleza Silenciosa',
          desc: 'El poder de escuchar el bosque en silencio, juntos.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
        {
          key: 'detox-retox',
          label: 'Detox. Retox. Repeat',
          desc: 'Cuidarse como ritual compartido: lo que entra nutre cuerpo y vínculo.',
          img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
        },
      ],
    },
  },
  {
    key: 'celebraciones',
    title: 'Celebraciones',
    description:
      'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
    img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    details: {
      title: 'Celebraciones',
      core: 'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
      ctaLabel: 'Brinden juntos →',
      tint: 'bg-rose-900/30',
      heroImg: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
      options: [
        {
          key: 'escapada-aniversario',
          label: 'Escapada de Aniversario',
          desc: 'Un viaje que celebra el tiempo compartido, con nuevos recuerdos por sumar.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
        },
        {
          key: 'milestones-logros',
          label: 'Milestones & Logros',
          desc: 'Porque los grandes pasos de la vida merecen más que un brindis: merecen un viaje.',
          img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
        },
        {
          key: 'luces-ciudad',
          label: 'Luces de Ciudad',
          desc: 'Rooftops, neones y la vibra de una noche que se recuerda por siempre.',
          img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
        },
        {
          key: 'veladas-musica',
          label: 'Veladas con Música',
          desc: 'Un soundtrack en vivo para ponerle ritmo al festejo y a la complicidad.',
          img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        },
      ],
    },
  },
  {
    key: 'playa-dunas',
    title: 'Playa & Dunas',
    description:
      'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    details: {
      title: 'Playa & Dunas',
      core: 'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
      ctaLabel: 'Disfruten la arena →',
      tint: 'bg-sky-900/30',
      heroImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      options: [
        {
          key: 'relax-arena',
          label: 'Relax & Arena',
          desc: 'El mar como telón de fondo y el tiempo suspendido entre olas.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'deportes-acuaticos',
          label: 'Deportes Acuáticos',
          desc: 'Compartir la emoción del movimiento y el agua salada en la piel.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'paseos-escenicos',
          label: 'Paseos Escénicos',
          desc: 'Caminar al borde del mar, donde cada paso se acompaña con brisa y luz.',
          img: 'https://images.unsplash.com/photo-1519046904884-53103a34bed6',
        },
        {
          key: 'vida-nocturna-musica',
          label: 'Vida Nocturna & Música',
          desc: 'El sonido del mar mezclado con música y luces: fiesta sin relojes.',
          img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
        },
      ],
    },
  },
  {
    key: 'escapada-urbana',
    title: 'Escapada Urbana',
    description:
      'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
    img: 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
    details: {
      title: 'Escapada Urbana',
      core: 'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
      ctaLabel: 'Piérdanse en la ciudad →',
      tint: 'bg-slate-900/30',
      heroImg: 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
      options: [
        {
          key: 'arte-arquitectura',
          label: 'Arte & Arquitectura',
          desc: 'Descubrir cómo la ciudad respira a través de sus formas y colores.',
          img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
        },
        {
          key: 'gastronomia-cocteleria',
          label: 'Gastronomía & Coctelería',
          desc: 'Bares escondidos y mesas vibrantes: el pulso de la ciudad en cada copa.',
          img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
        },
        {
          key: 'cultura-shows',
          label: 'Cultura & shows',
          desc: 'Salir a perderse en la ciudad que nunca duerme.',
          img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        },
        {
          key: 'compras-diseno',
          label: 'Compras & Diseño',
          desc: 'Buscar tesoros modernos en cada esquina creativa.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
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
