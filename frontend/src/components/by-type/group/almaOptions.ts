// frontend/src/components/by-type/group/almaOptions.ts

export type AlmaOption = {
  key: string;
  label: string;
  img?: string;
  desc?: string; // NUEVO
};

export type AlmaSpec = {
  title: string;
  core: string; // NUEVO (reemplaza tagline)
  options: AlmaOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
};

export const ALMA_OPTIONS: Record<string, AlmaSpec> = {
  'visual-storytellers': {
    title: 'Narradores Visuales',
    core: 'Viajes diseñados para quienes buscan mirar el mundo a través de un lente, capturar historias y volver con memorias que son también obras visuales.',
    ctaLabel: 'Capturá el siguiente cuadro →',
    tint: 'bg-rose-900/30',
    heroImg: 'https://images.unsplash.com/photo-1527499354222-c3975b69f669?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'landscapes-nature',
        label: 'Paisajes & Naturaleza',
        desc: 'Lugares donde la luz, las montañas y los cielos se convierten en la mejor escenografía natural.',
        img: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'urban-street-photo',
        label: 'Cultura Urbana & Street Photography',
        desc: 'Calles vivas, grafitis, mercados y escenas que cuentan historias en cada esquina.',
        img: 'https://images.unsplash.com/photo-1580457101302-193c465455c4?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'wildlife-photography',
        label: 'Wildlife & Fotografía de Fauna',
        desc: 'Encuentros con animales en su hábitat, momentos irrepetibles que exigen paciencia y ojo entrenado.',
        img: 'https://images.unsplash.com/photo-1557050543-4d5f4e07d79b?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'drone-panoramic',
        label: 'Drone & Panorámicas Épicas',
        desc: 'Perspectivas aéreas que revelan patrones y paisajes invisibles desde el suelo.',
        img: 'https://images.unsplash.com/photo-1527499354222-c3975b69f669?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  'yoga-wellness': {
    title: 'Yoga & Bienestar',
    core: 'Escapadas pensadas para reconectar cuerpo, mente y espíritu en entornos que invitan a bajar el ritmo.',
    ctaLabel: 'Respirá y seguí el camino →',
    tint: 'bg-emerald-900/30',
    heroImg: 'https://images.unsplash.com/photo-1475444239989-05b09b5453c2?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'yoga-retreats',
        label: 'Retiros de Yoga',
        desc: 'Jornadas para alinear respiración y movimiento en escenarios inspiradores.',
        img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'detox-nutrition',
        label: 'Detox & Nutrición Consciente',
        desc: 'Alimentación equilibrada y talleres que renuevan hábitos desde adentro.',
        img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'spa-thermas',
        label: 'Spa, Termas & Balnearios',
        desc: 'Agua y tratamientos que limpian, relajan y revitalizan el cuerpo.',
        img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'meditation-mindfulness',
        label: 'Meditación & Mindfulness',
        desc: 'Espacios de calma profunda, diseñados para entrenar la atención y el presente.',
        img: 'https://images.unsplash.com/photo-1506126613408-4e0524b37d90?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  spiritual: {
    title: 'Religioso o Espiritual',
    core: 'Viajes para quienes buscan lo trascendente, con espacios de silencio, comunidad y sentido.',
    ctaLabel: 'Iniciá tu búsqueda espiritual →',
    tint: 'bg-amber-900/30',
    heroImg: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'pilgrimages',
        label: 'Peregrinaciones',
        desc: 'Rutas con historia y propósito que invitan a la introspección en movimiento.',
        img: 'https://images.unsplash.com/photo-1593591801349-16d4c3e6cf85?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'faith-retreats',
        label: 'Retiros de Fe o Silencio',
        desc: 'Pausas profundas para escuchar lo que importa, sin ruido alrededor.',
        img: 'https://images.unsplash.com/photo-1484406566174-9da000fda64a?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'interreligious-trips',
        label: 'Viajes Interreligiosos',
        desc: 'Itinerarios que exploran diversidad de creencias con respeto y apertura.',
        img: 'https://images.unsplash.com/photo-1561449813-2357a4b83c44?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'faith-festivities',
        label: 'Festividades de Fe',
        desc: 'Celebraciones que unen tradición, música y comunidad.',
        img: 'https://images.unsplash.com/photo-1604894225213-03943de844a7?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  foodies: {
    title: 'Gastronómico',
    core: 'Viajes que exploran culturas a través de sabores, aromas y experiencias culinarias únicas.',
    ctaLabel: 'Servime la próxima experiencia →',
    tint: 'bg-orange-900/30',
    heroImg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'street-food-crawl',
        label: 'Street Food Crawl',
        desc: 'La autenticidad de las calles servida en platos rápidos y llenos de carácter.',
        img: 'https://images.unsplash.com/photo-1570106533365-2e62caf3c23b?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'wine-routes',
        label: 'Rutas del Vino & Bodegas',
        desc: 'Degustaciones guiadas, viñedos infinitos y conversaciones entre copas.',
        img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'local-cooking-workshops',
        label: 'Talleres de Cocina Local',
        desc: 'Aprender a cocinar como los locales, con secretos que no aparecen en recetarios.',
        img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'farm-to-table',
        label: 'De la Granja a la Mesa',
        desc: 'Productos frescos y orgánicos que viajan directo del campo al plato.',
        img: 'https://images.unsplash.com/photo-1598515539992-5257562320d3?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  'stories-fantasy': {
    title: 'Historias & Fantasía',
    core: 'Viajes que transforman libros, sagas y películas en escenarios reales donde todo se siente posible.',
    ctaLabel: 'Abrí el siguiente capítulo →',
    tint: 'bg-fuchsia-900/30',
    heroImg: 'https://images.unsplash.com/photo-1534685785742-43a2539a215a?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'movie-worlds',
        label: 'Mundos de Cine',
        desc: 'Lugares icónicos donde se rodaron escenas que marcaron generaciones.',
        img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'literary-universes',
        label: 'Universos Literarios',
        desc: 'Escenarios de novelas y sagas que cobran vida más allá de la página.',
        img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'role-playing-experiences',
        label: 'Experiencias de Rol',
        desc: 'Vivir en primera persona lo que antes era ficción: de castillos a universos fantásticos.',
        img: 'https://images.unsplash.com/photo-1542626991-cbc4e62684cc?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'fantasy-parks',
        label: 'Parques & Escenarios Fantásticos',
        desc: 'Mundos creados para jugar, soñar y volver a ser niños.',
        img: 'https://images.unsplash.com/photo-1599134842235-9a52a815a4a0?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  'nature-adventure': {
    title: 'Naturaleza & Aventura',
    core: 'Escapadas que retan cuerpo y espíritu, donde cada kilómetro recorrido es un logro compartido.',
    ctaLabel: 'Dale play a la aventura →',
    tint: 'bg-cyan-900/30',
    heroImg: 'https://images.unsplash.com/photo-1505521216430-8b73b2067359?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'trekking-hiking',
        label: 'Trekking & Hiking',
        desc: 'Caminatas que conectan con montañas, bosques y senderos legendarios.',
        img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'water-adventure',
        label: 'Aventura Acuática',
        desc: 'Ríos, mares y lagos que se convierten en terrenos de juego.',
        img: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'extreme-getaways',
        label: 'Escapadas Extremas',
        desc: 'Adrenalina pura en experiencias de límite físico y mental.',
        img: 'https://images.unsplash.com/photo-1534437431032-ea86a8a57e1a?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'eco-experiences',
        label: 'Eco-experiencias',
        desc: 'Propuestas sostenibles para convivir con el entorno natural.',
        img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  friends: {
    title: 'Amigos',
    core: 'Viajes que celebran la amistad, las risas compartidas y los momentos que después se cuentan mil veces.',
    ctaLabel: 'Que empiece la anécdota →',
    tint: 'bg-amber-800/30',
    heroImg: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'graduation-trip',
        label: 'Viaje de Graduación',
        desc: 'El cierre de una etapa y el inicio de miles de anécdotas.',
        img: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'farewell-trip',
        label: 'Viaje de Despedida',
        desc: 'Una última gran aventura antes de empezar un nuevo capítulo.',
        img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'party-trips',
        label: 'Fiesta (party trips)',
        desc: 'Noches largas, música alta y recuerdos que brillan bajo luces de neón.',
        img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'beach-chill',
        label: 'Playa & Chill',
        desc: 'Arena, sol y la calma de estar juntos sin relojes.',
        img: 'https://images.unsplash.com/photo-1473116763249-2faaef86cc20?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  business: {
    title: 'Negocios',
    core: 'Experiencias que combinan estrategia, networking y conexión real fuera de la oficina.',
    ctaLabel: 'Sellamos el próximo deal →',
    tint: 'bg-blue-900/30',
    heroImg: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'strategy-offsite',
        label: 'Offsite de Estrategia',
        desc: 'Ideas frescas nacen mejor lejos de las salas de reunión.',
        img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'adventure-team-building',
        label: 'Team Building Aventura',
        desc: 'Retos compartidos que fortalecen confianza y trabajo en equipo.',
        img: 'https://images.unsplash.com/photo-1529236183275-4fd92139fb2a?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'work-play',
        label: 'Work & Play',
        desc: 'Trabajo remoto + experiencias que inspiran y renuevan.',
        img: 'https://images.unsplash.com/photo-1531403009284-440999c33c14?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'inspiration-conferences',
        label: 'Inspiración & Conferencias',
        desc: 'Encuentros que expanden horizontes profesionales.',
        img: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  students: {
    title: 'Estudiantes',
    core: 'Viajes que transforman la educación en aventura, con aprendizajes que quedan para siempre.',
    ctaLabel: 'Abran la clase más grande →',
    tint: 'bg-green-900/30',
    heroImg: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'educational-trips',
        label: 'Viajes Educativos',
        desc: 'Historia, ciencia y cultura explicadas en terreno real.',
        img: 'https://images.unsplash.com/photo-1491841550275-5b462bf975db?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'cultural-exchange',
        label: 'Intercambio Cultural & Idiomas',
        desc: 'Sumergirse en otra lengua y otra forma de vida.',
        img: 'https://images.unsplash.com/photo-1525923138483-53272b198799?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'volunteering',
        label: 'Voluntariado & Proyectos Sociales',
        desc: 'Aprender mientras se aporta a una comunidad.',
        img: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'end-of-course-trip',
        label: 'Trip de Fin de Curso',
        desc: 'El broche de oro a años de estudio, con amigos y recuerdos.',
        img: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  'music-festivals': {
    title: 'Música & Festivales',
    core: 'Escapadas que giran en torno a la música, donde el ritmo marca cada momento del viaje.',
    ctaLabel: 'Subí el volumen →',
    tint: 'bg-violet-900/30',
    heroImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    options: [
      {
        key: 'international-festivals',
        label: 'Grandes Festivales Internacionales',
        desc: 'Escenarios globales donde la música une multitudes.',
        img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'local-underground-scenes',
        label: 'Escenas Locales & Underground',
        desc: 'Descubrir bandas emergentes y sonidos auténticos.',
        img: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'immersive-experiences',
        label: 'Experiencias Inmersivas',
        desc: 'Vivir la música más allá del escenario, con tecnología y performances únicas.',
        img: 'https://images.unsplash.com/photo-1563841939329-3637135bcf37?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'traditional-music-culture',
        label: 'Cultura & Música Tradicional',
        desc: 'Ritmos ancestrales que cuentan la historia de un pueblo.',
        img: 'https://images.unsplash.com/photo-1529798853086-aae4df05a853?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
};