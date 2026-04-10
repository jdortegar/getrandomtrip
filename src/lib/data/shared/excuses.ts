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

// Solo traveler excuses (SOLUM© — alineado a mapa de producto: 8 motivaciones + afinar detalles)
export const soloExcuses: ExcuseData[] = [
  {
    key: 'solo-get-lost',
    title: 'Get Lost',
    description:
      'Desconectar del ruido, caminar sin prisa y dejar que el destino hable bajito.',
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    details: {
      title: 'Get Lost',
      core: 'Menos pantallas, más horizonte: un viaje para perderse a propósito.',
      ctaLabel: 'Perdéte con intención →',
      tint: 'bg-slate-900/30',
      heroImg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      options: [
        {
          key: 'sl-gl-naturaleza-silenciosa',
          label: 'Naturaleza silenciosa',
          desc: 'Bosques, valles y miradores donde el silencio es parte del itinerario.',
          img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
        {
          key: 'sl-gl-digital-detox',
          label: 'Digital Detox',
          desc: 'Pausa real de notificaciones: el mundo puede esperar.',
          img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        },
        {
          key: 'sl-gl-retiro-minimal',
          label: 'Retiro Minimal',
          desc: 'Espacios esenciales, pocas cosas y mucha claridad mental.',
          img: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85',
        },
        {
          key: 'sl-gl-senderos-lentos',
          label: 'Senderos Lentos',
          desc: 'Caminar sin cronómetro: el ritmo lo ponés vos.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
      ],
    },
  },
  {
    key: 'solo-busqueda-interior',
    title: 'Búsqueda Interior',
    description:
      'Volver adentro con prácticas que ordenan cabeza y cuerpo en el camino.',
    img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    details: {
      title: 'Búsqueda Interior',
      core: 'Un viaje para escucharte: mindfulness, movimiento y sabiduría local.',
      ctaLabel: 'Buscá adentro →',
      tint: 'bg-teal-900/30',
      heroImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
      options: [
        {
          key: 'sl-bi-meditacion-mindfulness',
          label: 'Meditación & Mindfulness',
          desc: 'Respiración, presencia y pausas que cambian el ritmo del viaje.',
          img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
        },
        {
          key: 'sl-bi-journaling-escritura',
          label: 'Journaling & Escritura',
          desc: 'Libreta, café y la libertad de ordenar lo que pasa por la cabeza.',
          img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
        },
        {
          key: 'sl-bi-yoga-movimiento',
          label: 'Yoga & Movimiento',
          desc: 'Cuerpo activo, mente más liviana: saludos al sol donde sea.',
          img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        },
        {
          key: 'sl-bi-sabidurias-locales',
          label: 'Sabidurías Locales',
          desc: 'Encuentros con maestrxs, rituales y enseñanzas del lugar.',
          img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        },
      ],
    },
  },
  {
    key: 'solo-aventura-desafio',
    title: 'Aventura & Desafío',
    description:
      'Subir la apuesta: terreno, agua o altura para sentir que estás vivo.',
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    details: {
      title: 'Aventura & Desafío',
      core: 'Desafíos físicos que te recuerdan de qué sos capaz, solo o acompañado por el paisaje.',
      ctaLabel: 'Subí el desafío →',
      tint: 'bg-emerald-900/30',
      heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      options: [
        {
          key: 'sl-ad-trekking-hiking',
          label: 'Trekking & Hiking',
          desc: 'Picos, refugios y jornadas que exigen y regalan perspectiva.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'sl-ad-aventura-acuatica',
          label: 'Aventura Acuática',
          desc: 'Kayak, snorkel o lo que el agua te proponga.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'sl-ad-deportes-extremos',
          label: 'Deportes Extremos',
          desc: 'Adrenalina medida para quien no viaja para dormir tranquilo.',
          img: 'https://images.unsplash.com/photo-1733185396898-2da8b2fe7b36',
        },
        {
          key: 'sl-ad-terrenos-inexplorados',
          label: 'Terrenos Inexplorados',
          desc: 'Rutas menos marcadas: el mapa todavía tiene bordes en blanco.',
          img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35',
        },
      ],
    },
  },
  {
    key: 'solo-exploracion-cultural',
    title: 'Exploración Cultural',
    description:
      'Ciudades, museos y vida cotidiana: entender el lugar desde adentro.',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    details: {
      title: 'Exploración Cultural',
      core: 'Historias, arquitectura y mercados: cultura con los cinco sentidos.',
      ctaLabel: 'Explorá la cultura →',
      tint: 'bg-amber-900/30',
      heroImg: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      options: [
        {
          key: 'sl-ec-ciudades-arquitectura',
          label: 'Ciudades & Arquitectura',
          desc: 'Barrios, fachadas y plazas que cuentan siglos en un paseo.',
          img: 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
        },
        {
          key: 'sl-ec-museos-patrimonio',
          label: 'Museos & Patrimonio',
          desc: 'Colecciones y sitios que merecen tiempo, no solo una foto.',
          img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
        },
        {
          key: 'sl-ec-mercados-locales',
          label: 'Mercados Locales',
          desc: 'Sabores, olores y charlas con quienes hacen girar el barrio.',
          img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
        },
        {
          key: 'sl-ec-festividades-rituales',
          label: 'Festividades & Rituales',
          desc: 'Calendario vivo: ferias, celebraciones y costumbres que te invitan.',
          img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7d6f4',
        },
      ],
    },
  },
  {
    key: 'solo-fotografia-narrativa-visual',
    title: 'Fotografía & Narrativa Visual',
    description:
      'Encuadrar el viaje: paisaje, calle, fauna o altura para contar tu historia.',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    details: {
      title: 'Fotografía & Narrativa Visual',
      core: 'Ojo curioso y memoria en imágenes: cada disparo es una página del diario.',
      ctaLabel: 'Dispará tu relato →',
      tint: 'bg-violet-900/30',
      heroImg: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
      options: [
        {
          key: 'sl-fn-paisajes-panoramicas',
          label: 'Paisajes & Panorámicas',
          desc: 'Horizontes amplios y luz que pide trípode o paciencia.',
          img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
        {
          key: 'sl-fn-street-photography',
          label: 'Street Photography',
          desc: 'Gente, gestos y esquinas que no están en la guía.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        },
        {
          key: 'sl-fn-fauna-wildlife',
          label: 'Fauna & Wildlife',
          desc: 'Vida salvaje con respeto y teleobjetivo (o binoculares).',
          img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
        },
        {
          key: 'sl-fn-drone-alturas',
          label: 'Drone & Alturas',
          desc: 'Perspectivas desde arriba cuando las normas lo permiten.',
          img: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f',
        },
      ],
    },
  },
  {
    key: 'solo-literatura-arte-talleres',
    title: 'Literatura, Arte & Talleres Locales',
    description:
      'Libros, murales y manos en la masa: crear y leer el destino.',
    img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
    details: {
      title: 'Literatura, Arte & Talleres Locales',
      core: 'Talleres, rutas de lectura y arte urbano para viajar con las manos ocupadas.',
      ctaLabel: 'Creá en el camino →',
      tint: 'bg-orange-900/30',
      heroImg: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
      options: [
        {
          key: 'sl-la-talleres-creativos',
          label: 'Talleres Creativos',
          desc: 'Cerámica, tinta, textiles: llevarte algo hecho por vos.',
          img: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b',
        },
        {
          key: 'sl-la-rutas-literarias',
          label: 'Rutas Literarias',
          desc: 'Lugares que ya fueron escenario en una novela o un poema.',
          img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f',
        },
        {
          key: 'sl-la-arte-urbano',
          label: 'Arte Urbano',
          desc: 'Murales, galerías alternativas y firmas locales.',
          img: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
        },
        {
          key: 'sl-la-artesania-diseno',
          label: 'Artesanía & Diseño',
          desc: 'Objetos con historia y oficios que enseñan el alma del lugar.',
          img: 'https://images.unsplash.com/photo-1566127444979-b3d2b335d3c5',
        },
      ],
    },
  },
  {
    key: 'solo-musica-sonidos',
    title: 'Música & Sonidos',
    description:
      'Escuchar el viaje: escenas locales, ritmos tradicionales y noches que suenan.',
    img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    details: {
      title: 'Música & Sonidos',
      core: 'Del escenario al auricular: música como brújula del destino.',
      ctaLabel: 'Seguí el ritmo →',
      tint: 'bg-pink-900/30',
      heroImg: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
      options: [
        {
          key: 'sl-ms-escenas-locales',
          label: 'Escenas Locales',
          desc: 'Bares, peñas y venues donde suena lo auténtico.',
          img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        },
        {
          key: 'sl-ms-ritmos-tradicionales',
          label: 'Ritmos Tradicionales',
          desc: 'Folklore, instrumentos y danzas que cuentan identidades.',
          img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
        },
        {
          key: 'sl-ms-festivales-musica',
          label: 'Festivales',
          desc: 'Calendario de festivales para planear la escapada alrededor del cartel.',
          img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
        },
        {
          key: 'sl-ms-jam-sessions',
          label: 'Jam Sessions',
          desc: 'Improvisar con desconocidos que terminan siendo parte del viaje.',
          img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
        },
      ],
    },
  },
  {
    key: 'solo-tribe-encounters',
    title: 'Tribe Encounters',
    description:
      'Cruce con otrxs viajerxs: hostels con onda, excursiones y mesas compartidas.',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
    details: {
      title: 'Tribe Encounters',
      core: 'Viajás solo pero no aislado: encuentros que suman sin robar tu autonomía.',
      ctaLabel: 'Encontrá tu tribu →',
      tint: 'bg-cyan-900/30',
      heroImg: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
      options: [
        {
          key: 'sl-te-hostels-boutique',
          label: 'Hostels Boutique',
          desc: 'Diseño, comunidad y espacios para cruzarte con gente afín.',
          img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        },
        {
          key: 'sl-te-meetups-viajeros',
          label: 'Meetups de Viajeros',
          desc: 'Eventos y quedadas para compartir tips y rutas.',
          img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1',
        },
        {
          key: 'sl-te-excursiones-grupales',
          label: 'Excursiones Grupales',
          desc: 'Salidas del día con grupo: compañía puntual, libertad después.',
          img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        },
        {
          key: 'sl-te-community-dining',
          label: 'Community Dining',
          desc: 'Mesas largas, menú compartido y charla con quien llegó de otro continente.',
          img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
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
          label: 'Detox / Retox / Repeat',
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
          label: 'Cultura & Shows',
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

// Group traveler excuses (KIN / grupos — alineado al mapa de producto)
export const groupExcuses: ExcuseData[] = [
  {
    key: 'group-aventura-familia',
    title: 'Aventura en familia',
    description:
      'Primos, hermanos, tíos y abuelos: un mismo viaje, mil anécdotas para contar.',
    img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300',
    details: {
      title: 'Aventura en familia',
      core: 'La tribu al completo merece un viaje donde todos encuentren su momento.',
      ctaLabel: 'Planeen la aventura familiar →',
      tint: 'bg-orange-900/30',
      heroImg: 'https://images.unsplash.com/photo-1511895426328-dc8714191300',
      options: [
        {
          key: 'grp-avfam-multigeneracional',
          label: 'Planes multigeneracionales',
          desc: 'Actividades que conectan a niños, adultos y mayores sin aburrir a nadie.',
          img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368',
        },
        {
          key: 'grp-avfam-naturaleza-juntos',
          label: 'Naturaleza en grupo',
          desc: 'Senderos, miradores y aire puro para la familia entera.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
        {
          key: 'grp-avfam-juegos-desafios',
          label: 'Juegos y desafíos',
          desc: 'Dinámicas ligeras que rompen el hielo entre ramas de la familia.',
          img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
        },
      ],
    },
  },
  {
    key: 'group-naturaleza-fauna',
    title: 'Naturaleza & fauna',
    description:
      'Reservas, avistajes y silencios que suenan a aventura compartida.',
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    details: {
      title: 'Naturaleza & fauna',
      core: 'Salir en grupo a observar, respirar profundo y volver con historias de vida salvaje.',
      ctaLabel: 'Exploren lo salvaje →',
      tint: 'bg-emerald-900/30',
      heroImg: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      options: [
        {
          key: 'grp-nat-reservas-avistaje',
          label: 'Reservas y avistajes',
          desc: 'Rutas pensadas para ver fauna con respeto y guías que suman.',
          img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
        },
        {
          key: 'grp-nat-trekking-grupal',
          label: 'Trekking grupal',
          desc: 'Caminatas de varios días o jornadas intensas para el mismo ritmo de grupo.',
          img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
        },
        {
          key: 'grp-nat-eco-talleres',
          label: 'Eco-experiencias',
          desc: 'Talleres y encuentros con conciencia ambiental sin perder la diversión.',
          img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        },
      ],
    },
  },
  {
    key: 'group-cultura-tradiciones',
    title: 'Cultura & tradiciones',
    description:
      'Festivales, artesanía y costumbres vividas en grupo, no solo fotografiadas.',
    img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
    details: {
      title: 'Cultura & tradiciones',
      core: 'Sumergirse en lo local con tiempo para compartir impresiones entre ustedes.',
      ctaLabel: 'Vivan la cultura →',
      tint: 'bg-amber-900/30',
      heroImg: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
      options: [
        {
          key: 'grp-cul-festivales-ferias',
          label: 'Festivales y ferias',
          desc: 'Calendario cultural para ir en manada y no perderse el momento clave.',
          img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7d6f4',
        },
        {
          key: 'grp-cul-patrimonio-guiado',
          label: 'Patrimonio guiado',
          desc: 'Sitios UNESCO, museos y barrios con narrativa que engancha a todos.',
          img: 'https://images.unsplash.com/photo-1566127444979-b3d2b335d3c5',
        },
        {
          key: 'grp-cul-artesania-oficios',
          label: 'Artesanía y oficios',
          desc: 'Manos a la obra: talleres donde el grupo crea algo para llevarse.',
          img: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b',
        },
      ],
    },
  },
  {
    key: 'group-playas-dunas',
    title: 'Playas & dunas',
    description:
      'Arena, viento y atardeceres: el clásico viaje grupal que nunca falla.',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    details: {
      title: 'Playas & dunas',
      core: 'Sol, dunas y chapuzones para celebrar que están juntos en el mismo destino.',
      ctaLabel: 'Vayan a la orilla →',
      tint: 'bg-cyan-900/30',
      heroImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      options: [
        {
          key: 'grp-playa-chiringuitos-rutas',
          label: 'Playas y calas',
          desc: 'Rutas costeras para elegir playa según el mood del grupo.',
          img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        },
        {
          key: 'grp-dunas-aventura',
          label: 'Dunas y aventura',
          desc: 'Subidas, bajadas y deportes sobre arena para los que no paran.',
          img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35',
        },
        {
          key: 'grp-costero-pueblos',
          label: 'Pueblos costeros',
          desc: 'Paseos entre puertos, pescado fresco y noches largas de charla.',
          img: 'https://images.unsplash.com/photo-1519046904884-73403d63b908',
        },
      ],
    },
  },
  {
    key: 'group-graduaciones-celebraciones',
    title: 'Graduaciones & celebraciones',
    description:
      'Egreso, cumpleaños redondos o “por fin nos juntamos”: excusa perfecta para viajar.',
    img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    details: {
      title: 'Graduaciones & celebraciones',
      core: 'Brindis, sorpresas y un destino que esté a la altura del hito.',
      ctaLabel: 'Celebren el hito →',
      tint: 'bg-fuchsia-900/30',
      heroImg: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
      options: [
        {
          key: 'grp-grad-viaje-egreso',
          label: 'Viaje de graduación',
          desc: 'Esa escapada que cierra una etapa y abre la siguiente con estilo.',
          img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        },
        {
          key: 'grp-celebr-reuniones',
          label: 'Reuniones y aniversarios',
          desc: 'Amigos de toda la vida o familia lejana: volver a verse con propósito.',
          img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
        },
        {
          key: 'grp-celebr-fiestas-destino',
          label: 'Fiesta en destino',
          desc: 'Noches largas, buena mesa y espacio para el brindis grupal.',
          img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf',
        },
      ],
    },
  },
  {
    key: 'group-escapada-padres-hijos',
    title: 'Escapadas Madre-hij@ / Padre-hij@',
    description:
      'Tiempo a solas con tu hijo o hija: hobbies, risas y recuerdos de por vida.',
    img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
    details: {
      title: 'Escapadas Madre-hij@ / Padre-hij@',
      core: 'Un viaje para dos (o por turnos) que fortalece vínculos sin distracciones.',
      ctaLabel: 'Escápense juntos →',
      tint: 'bg-indigo-900/30',
      heroImg: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
      options: [
        {
          key: 'grp-ph-aficion-compartida',
          label: 'Afición compartida',
          desc: 'Deporte, música, cómics o cocina: el viaje gira alrededor de lo que los une.',
          img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9',
        },
        {
          key: 'grp-ph-naturaleza-calma',
          label: 'Naturaleza y calma',
          desc: 'Ritmo suave, conversaciones largas y espacios para escucharse.',
          img: 'https://images.unsplash.com/photo-1506905925346-14b1e3dba71b',
        },
        {
          key: 'grp-ph-ciudad-descubrimiento',
          label: 'Ciudad y descubrimiento',
          desc: 'Museos, barrios y sorpresas urbanas para explorar mano a mano.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
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
