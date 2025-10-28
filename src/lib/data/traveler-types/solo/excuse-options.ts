export type SoloAlmaOption = {
  key: string;
  label: string;
  img?: string;
  desc?: string;
};

export type SoloAlmaSpec = {
  title: string;
  core: string;
  options: SoloAlmaOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
};

export const SOLO_EXCUSE_OPTIONS: Record<string, SoloAlmaSpec> = {
  'get-lost': {
    title: 'Get Lost',
    core: 'Apagar el mundo para conectarse con uno mismo.',
    ctaLabel: 'Elegir Get Lost →',
    tint: 'bg-emerald-900/40',
    heroImg: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    options: [
      {
        key: 'naturaleza-silenciosa',
        label: 'Naturaleza Silenciosa 🌲',
        desc: 'El bosque como compañía, el río como soundtrack.',
        img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      },
      {
        key: 'digital-detox',
        label: 'Digital Detox 📵',
        desc: 'La desconexión como lujo.',
        img: 'https://images.unsplash.com/photo-1726494556466-957a65147d95',
      },
      {
        key: 'retiro-minimal',
        label: 'Retiro Minimal 🛖',
        desc: 'Cabaña, libreta, café… y nada más.',
        img: 'https://images.unsplash.com/photo-1559521783-1d1599583485',
      },
      {
        key: 'senderos-lentos',
        label: 'Senderos Lentos 🚶',
        desc: 'Caminar sin apuro, dejar que el tiempo se estire.',
        img: 'https://plus.unsplash.com/premium_photo-1690574169354-d6cc4299cf84',
      },
    ],
  },
  'busqueda-interior': {
    title: 'Búsqueda Interior',
    core: 'El viaje que importa no está en el mapa, sino en ti.',
    ctaLabel: 'Elegir Búsqueda Interior →',
    tint: 'bg-indigo-900/40',
    heroImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    options: [
      {
        key: 'meditacion-mindfulness',
        label: 'Meditación & Mindfulness 🧘',
        desc: 'La calma como destino.',
        img: 'https://images.unsplash.com/photo-1655970580622-4a547789c850',
      },
      {
        key: 'journaling-escritura',
        label: 'Journaling & Escritura ✍️',
        desc: 'Poner en palabras lo que el viaje revela.',
        img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
      },
      {
        key: 'yoga-movimiento',
        label: 'Yoga & Movimiento 🌞',
        desc: 'El cuerpo como brújula.',
        img: 'https://images.unsplash.com/photo-1660171465646-23a749459e74',
      },
      {
        key: 'sabidurias-locales',
        label: 'Sabidurías Locales 📚',
        desc: 'La tradición como revelación.',
        img: 'https://images.unsplash.com/photo-1682255868651-507b5b2bbfd6',
      },
    ],
  },
  'aventura-desafio': {
    title: 'Aventura & Desafío',
    core: 'Cuando lo desconocido se convierte en tu mejor compañía.',
    ctaLabel: 'Elegir Aventura & Desafío →',
    tint: 'bg-red-900/40',
    heroImg: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    options: [
      {
        key: 'trekking-hiking',
        label: 'Trekking & Hiking 🥾',
        desc: 'La cima como punto de partida.',
        img: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
      },
      {
        key: 'aventura-acuatica',
        label: 'Aventura Acuática 🚣‍♂️',
        desc: 'Aprender a fluir con la corriente.',
        img: 'https://images.unsplash.com/photo-1746211516723-c4cd447ec665',
      },
      {
        key: 'deportes-extremos',
        label: 'Deportes Extremos 🪂',
        desc: 'El vértigo como maestro.',
        img: 'https://images.unsplash.com/photo-1733185396898-2da8b2fe7b36',
      },
      {
        key: 'terrenos-inexplorados',
        label: 'Terrenos Inexplorados 🗺️',
        desc: 'La ruta como enigma.',
        img: 'https://images.unsplash.com/photo-1613854478329-a5b6c27dfc14',
      },
    ],
  },
  'exploracion-cultural': {
    title: 'Exploración Cultural',
    core: 'Descubrir el mundo sin filtros, a tu propio ritmo.',
    ctaLabel: 'Elegir Exploración Cultural →',
    tint: 'bg-amber-900/40',
    heroImg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b',
    options: [
      {
        key: 'ciudades-arquitectura',
        label: 'Ciudades & Arquitectura 🏛️',
        desc: 'El alma de un lugar escrita en sus calles.',
        img: 'https://images.unsplash.com/photo-1486591913781-4bee9ed65bfe',
      },
      {
        key: 'museos-patrimonio',
        label: 'Museos & Patrimonio 🖼️',
        desc: 'Viajar en el tiempo a través del arte.',
        img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
      },
      {
        key: 'mercados-locales',
        label: 'Mercados Locales 🛍️',
        desc: 'Colores, aromas y sabores como puerta de entrada.',
        img: 'https://images.unsplash.com/photo-1732798068339-4a686b74589f',
      },
      {
        key: 'festividades-rituales',
        label: 'Festividades & Rituales 🎉',
        desc: 'Vivir la cultura latiendo en primera fila.',
        img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
      },
    ],
  },
  'fotografia-narrativa': {
    title: 'Fotografía & Narrativa Visual',
    core: 'Buscar el ángulo que nadie más vio.',
    ctaLabel: 'Elegir Fotografía & Narrativa →',
    tint: 'bg-cyan-900/40',
    heroImg: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac',
    options: [
      {
        key: 'paisajes-panoramicas',
        label: 'Paisajes & Panorámicas 🌄',
        desc: 'Capturar la inmensidad en un clic.',
        img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      },
      {
        key: 'street-photography',
        label: 'Street Photography 🚶‍♀️📷',
        desc: 'Historias anónimas en cada esquina.',
        img: 'https://images.unsplash.com/photo-1429292394373-ddbcc6bb7468',
      },
      {
        key: 'fauna-wildlife',
        label: 'Fauna & Wildlife 🐾',
        desc: 'Paciencia y magia en un disparo único.',
        img: 'https://images.unsplash.com/photo-1622237522665-f25c0139ab06',
      },
      {
        key: 'drone-alturas',
        label: 'Drone & Alturas 🚁',
        desc: 'Ver el mundo desde un nuevo ángulo.',
        img: 'https://images.unsplash.com/photo-1690722534268-bf23b07e7557',
      },
    ],
  },
  'literatura-arte': {
    title: 'Literatura, Arte & Talleres Locales',
    core: 'Meter las manos en la arcilla, en el pincel, en la creación.',
    ctaLabel: 'Elegir Literatura & Arte →',
    tint: 'bg-purple-900/40',
    heroImg: 'https://plus.unsplash.com/premium_photo-1714060724900-4fceef462079',
    options: [
      {
        key: 'talleres-creativos',
        label: 'Talleres Creativos 🎭',
        desc: 'Aprender técnicas locales con artesanos.',
        img: 'https://plus.unsplash.com/premium_photo-1702598265809-203148e20b38',
      },
      {
        key: 'rutas-literarias',
        label: 'Rutas Literarias 📚',
        desc: 'Seguir las huellas de autores y novelas.',
        img: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7',
      },
      {
        key: 'arte-urbano',
        label: 'Arte Urbano 🎨',
        desc: 'Murales y expresiones que cuentan la ciudad.',
        img: 'https://images.unsplash.com/photo-1737972373746-74ad0f4a417b',
      },
      {
        key: 'artesania-diseno',
        label: 'Artesanía & Diseño 🧵',
        desc: 'Crear algo único que vuelve con vos.',
        img: 'https://plus.unsplash.com/premium_photo-1683121107354-804160f78eb8',
      },
    ],
  },
  'musica-sonidos': {
    title: 'Música & Sonidos',
    core: 'Dejar que la banda sonora del viaje inspire la tuya.',
    ctaLabel: 'Elegir Música & Sonidos →',
    tint: 'bg-pink-900/40',
    heroImg: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    options: [
      {
        key: 'escenas-locales',
        label: 'Escenas Locales 🎤',
        desc: 'Bandas, bares y escenarios ocultos.',
        img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
      },
      {
        key: 'ritmos-tradicionales',
        label: 'Ritmos Tradicionales 🥁',
        desc: 'Sonidos que laten desde la raíz.',
        img: 'https://images.unsplash.com/photo-1730406919258-b031632e3de8',
      },
      {
        key: 'festivales',
        label: 'Festivales 🎪',
        desc: 'Multitudes, luces y adrenalina colectiva.',
        img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
      },
      {
        key: 'jam-sessions',
        label: 'Jam Sessions 🎸',
        desc: 'Improvisar y conectar a través de la música.',
        img: 'https://plus.unsplash.com/premium_photo-1663090697292-3805438d91a8',
      },
    ],
  },
  'tribe-encounters': {
    title: 'Tribe Encounters',
    core: 'Viajar solo no significa estar en soledad. Es abrir la puerta a encuentros con otros viajeros que también buscan historias compartidas.',
    ctaLabel: 'Elegir Tribe Encounters →',
    tint: 'bg-orange-900/40',
    heroImg: 'https://plus.unsplash.com/premium_photo-1678914044227-bef17ee72b86',
    options: [
      {
        key: 'hostels-boutique',
        label: 'Hostels Boutique 🛌',
        desc: 'Espacios donde las charlas duran más que las noches.',
        img: 'https://plus.unsplash.com/premium_photo-1753618000634-879ad9258012',
      },
      {
        key: 'meetups-viajeros',
        label: 'Meetups de Viajeros 🌍',
        desc: 'Encuentros que empiezan casual y terminan en anécdota.',
        img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846',
      },
      {
        key: 'excursiones-grupales',
        label: 'Excursiones Grupales 🚐',
        desc: 'Aventuras compartidas que rompen el hielo.',
        img: 'https://plus.unsplash.com/premium_photo-1718146019187-19673a301ad7',
      },
      {
        key: 'community-dining',
        label: 'Community Dining 🍲',
        desc: 'Mesas largas, brindis inesperados, amigos nuevos.',
        img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
      },
    ],
  },
};