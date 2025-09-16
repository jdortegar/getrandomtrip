'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-3 py-1 text-sm font-medium bg-white/80 text-neutral-900 backdrop-blur ring-1 ring-black/10 shadow-sm">
      {children}
    </span>
  );
}

// Mapeo para mostrar nombres amigables en los chips
const FROM_LABEL: Record<string, string> = {
  couple: 'En Pareja',
  group: 'En Grupo',
  family: 'En Familia',
  solo: 'Solo',
  honeymoon: 'Honeymoon',
  paws: 'Con Mascota',
};

const TIER_LABEL: Record<string, string> = {
  essenza: 'Essenza',
  'modo-explora': 'Modo Explora',
  'explora-plus': 'Explora+',
  bivouac: 'Bivouac',
  atelier: 'Atelier',
};

// Mapeo para obtener los títulos de las opciones preferidas a partir de sus keys en la URL
const OPTIONS_LABELS: Record<string, Record<string, string>> = {
  couple: {
    'romantic-getaway': 'Escapada Romántica',
    'adventure-duo': 'Dúo de Aventura',
    'foodie-lovers': 'Foodie Lovers',
    'culture-tradition': 'Cultura & Tradición',
    'wellness-retreat': 'Wellness Retreat',
    celebrations: 'Celebraciones',
    'beach-dunes': 'Playa & Dunas',
    'urban-getaway': 'Escapada Urbana',
    'culture-traditions': 'Cultura Local & Paseos Tranquilos 🎭',
    'spa-day': 'Wellness & Spa 🧘‍♀️',
    'wine-tasting': 'Experiencias Gastronómicas & Vinos 🍷',
    'sunset-cruise': 'Atardeceres & Momentos Íntimos 🌅',
    'hiking-trail': 'Trekking & Naturaleza ⛰️',
    kayaking: 'Aventura Acuática 🚣',
    'zip-lining': 'Exploración de Fauna 🐾',
    desert: 'Desierto & Dunas 🏜️',
    'cooking-class': 'Talleres & Experiencias de Cocina 🍳',
    'food-tour': 'Street Food & Mercados 🍜',
    'gourmet-dinner': 'Fine Dining & Experiencias Gourmet 🍽️',
    'wine-pairing': 'Rutas de Vino & Bodegas 🍇',
    'museum-pass': 'Museos & Patrimonio 🖼️',
    'historical-tour': 'Pueblos & Caminatas 🏘️',
    'local-crafts': 'Artesanía & Diseño Local✨',
    'traditional-show': 'Festivales Locales 🎉',
    'couples-massage': 'Spa & Termas 💦',
    'yoga-retreat': 'Yoga & Mindfulness 🧘',
    'hot-springs': 'Naturaleza Silenciosa 🌿',
    'meditation-session': 'Detox. Retox. Repeat 🥗',
    'anniversary-dinner': 'Escapada de Aniversario 💍',
    'private-event': 'Milestones & Logros 🏆',
    'special-toast': 'Luces de Ciudad 🏙️🍸',
    'surprise-party': 'Veladas con Música 🎶✨',
    'beach-walks': 'Relax & Arena 🏖️',
    'sunset-views': 'Deportes Acuáticos 🌊',
    'dune-exploration': 'Paseos Escénicos 🌅',
    'beach-picnic': 'Vida Nocturna & Música 🎶',
    'city-walks': 'Arte & Arquitectura 🏛️',
    'rooftop-bars': 'Gastronomía & Coctelería 🍸',
    'cultural-shows': 'Cultura & shows 🎤',
    shopping: 'Compras & Diseño 🛍️',
  },
  solo: {
    'get-lost': 'Get Lost',
    'busqueda-interior': 'Búsqueda Interior',
    'aventura-desafio': 'Aventura & Desafío',
    'exploracion-cultural': 'Exploración Cultural',
    'fotografia-narrativa': 'Fotografía & Narrativa Visual',
    'literatura-arte': 'Literatura, Arte & Talleres Locales',
    'musica-sonidos': 'Música & Sonidos',
    'tribe-encounters': 'Tribe Encounters',
    'naturaleza-silenciosa': 'Naturaleza Silenciosa 🌲',
    'digital-detox': 'Digital Detox 📵',
    'retiro-minimal': 'Retiro Minimal 🛖',
    'senderos-lentos': 'Senderos Lentos 🚶',
    'meditacion-mindfulness': 'Meditación & Mindfulness 🧘',
    'journaling-escritura': 'Journaling & Escritura ✍️',
    'yoga-movimiento': 'Yoga & Movimiento 🌞',
    'sabidurias-locales': 'Sabidurías Locales 📚',
    'trekking-hiking': 'Trekking & Hiking 🥾',
    'aventura-acuatica': 'Aventura Acuática 🚣‍♂️',
    'deportes-extremos': 'Deportes Extremos 🪂',
    'terrenos-inexplorados': 'Terrenos Inexplorados 🗺️',
    'ciudades-arquitectura': 'Ciudades & Arquitectura 🏛️',
    'museos-patrimonio': 'Museos & Patrimonio 🖼️',
    'mercados-locales': 'Mercados Locales 🛍️',
    'festividades-rituales': 'Festividades & Rituales 🎉',
    'paisajes-panoramicas': 'Paisajes & Panorámicas 🌄',
    'street-photography': 'Street Photography 🚶‍♀️📷',
    'fauna-wildlife': 'Fauna & Wildlife 🐾',
    'drone-alturas': 'Drone & Alturas 🚁',
    'talleres-creativos': 'Talleres Creativos 🎭',
    'rutas-literarias': 'Rutas Literarias 📚',
    'arte-urbano': 'Arte Urbano 🎨',
    'artesania-diseno': 'Artesanía & Diseño 🧵',
    'escenas-locales': 'Escenas Locales 🎤',
    'ritmos-tradicionales': 'Ritmos Tradicionales 🥁',
    festivales: 'Festivales 🎪',
    'jam-sessions': 'Jam Sessions 🎸',
    'hostels-boutique': 'Hostels Boutique 🛌',
    'meetups-viajeros': 'Meetups de Viajeros 🌍',
    'excursiones-grupales': 'Excursiones Grupales 🚐',
    'community-dining': 'Community Dining 🍲',
  },
  family: {
    toddlers: 'Con los más chicos',
    teens: 'Con adolescentes',
    adults: 'Con hijos grandes',
    multigen: 'Con toda la familia',
    aventura: 'Aventura en familia',
    naturaleza: 'Naturaleza & fauna',
    cultura: 'Cultura & tradiciones',
    playas: 'Playas & Dunas',
    graduaciones: 'Graduaciones & celebraciones',
    duos: 'Escapadas Madre-hij@ / Padre-hij@',
  },
  group: {
    // Main experiences
    'visual-storytellers': 'Narradores Visuales',
    'yoga-wellness': 'Yoga & Bienestar',
    spiritual: 'Religioso o Espiritual',
    foodies: 'Gastronómico',
    'stories-fantasy': 'Historias & Fantasía',
    'nature-adventure': 'Naturaleza & Aventura',
    friends: 'Amigos',
    business: 'Negocios',
    students: 'Estudiantes',
    'music-festivals': 'Música & Festivales',
    // Sub-options from almaOptions
    'landscapes-nature': 'Paisajes & Naturaleza',
    'urban-street-photo': 'Cultura Urbana & Street Photography',
    'wildlife-photography': 'Wildlife & Fotografía de Fauna',
    'drone-panoramic': 'Drone & Panorámicas Épicas',
    'yoga-retreats': 'Retiros de Yoga',
    'detox-nutrition': 'Detox & Nutrición Consciente',
    'spa-thermas': 'Spa, Termas & Balnearios',
    'meditation-mindfulness': 'Meditación & Mindfulness',
    pilgrimages: 'Peregrinaciones',
    'faith-retreats': 'Retiros de Fe o Silencio',
    'interreligious-trips': 'Viajes Interreligiosos',
    'faith-festivities': 'Festividades de Fe',
    'street-food-crawl': 'Street Food Crawl',
    'wine-routes': 'Rutas del Vino & Bodegas',
    'local-cooking-workshops': 'Talleres de Cocina Local',
    'farm-to-table': 'De la Granja a la Mesa',
    'movie-worlds': 'Mundos de Cine',
    'literary-universes': 'Universos Literarios',
    'role-playing-experiences': 'Experiencias de Rol',
    'fantasy-parks': 'Parques & Escenarios Fantásticos',
    'trekking-hiking': 'Trekking & Hiking',
    'water-adventure': 'Aventura Acuática',
    'extreme-getaways': 'Escapadas Extremas',
    'eco-experiences': 'Eco-experiencias',
    'graduation-trip': 'Viaje de Graduación',
    'farewell-trip': 'Viaje de Despedida',
    'party-trips': 'Fiesta (party trips)',
    'beach-chill': 'Playa & Chill',
    'strategy-offsite': 'Offsite de Estrategia',
    'adventure-team-building': 'Team Building Aventura',
    'work-play': 'Work & Play',
    'inspiration-conferences': 'Inspiración & Conferencias',
    'educational-trips': 'Viajes Educativos',
    'cultural-exchange': 'Intercambio Cultural & Idiomas',
    volunteering: 'Voluntariado & Proyectos Sociales',
    'end-of-course-trip': 'Trip de Fin de Curso',
    'international-festivals': 'Grandes Festivales Internacionales',
    'local-underground-scenes': 'Escenas Locales & Underground',
    'immersive-experiences': 'Experiencias Inmersivas',
    'traditional-music-culture': 'Cultura & Música Tradicional',
  },
  paws: {
    'trails-nature': 'Senderos & Naturaleza',
    'dog-friendly-beaches': 'Playas Dog-Friendly',
    'pet-lover-cities': 'Ciudades Pet Lovers',
    'outdoor-adventure': 'Aventura Outdoor',
    'relax-wellness': 'Relax & Bienestar',
    'food-getaways': 'Escapadas Gastronómicas',
    'rural-farm': 'Trips Rurales & Granja',
    'dog-events': 'Dog Events & Comunidades',
  },
};

export default function BasicConfigHero() {
  const sp = useSearchParams();

  const travellerType = sp.get('type') ?? '';
  const level = sp.get('level') ?? '';

  const { experienciaPrincipal, opcionesPreferentes } = useMemo(() => {
    const mapping = OPTIONS_LABELS[travellerType] || {};
    let experiencia: string | null = null;
    const opciones: string[] = [];

    // 1. Buscar la experiencia principal (el "alma" o "escape type")
    const mainExperienceKey = sp.get('coupleAlma') || sp.get('soloAlma') || sp.get('escapeType') || sp.get('groupAlma');
    if (mainExperienceKey && mapping[mainExperienceKey]) {
      experiencia = mapping[mainExperienceKey];
    }

    // 2. Buscar opciones adicionales (como "familyType" o las de "Afinar detalles")
    const familyTypeKey = sp.get('familyType');
    if (familyTypeKey && mapping[familyTypeKey]) {
      opciones.push(mapping[familyTypeKey]);
    }

    const almaOptionsKeys = (sp.get('almaOptions') ?? '').split(',').filter(Boolean);
    almaOptionsKeys.forEach((key) => {
      if (mapping[key]) {
        opciones.push(mapping[key]);
      }
    });

    return { experienciaPrincipal: experiencia, opcionesPreferentes: opciones };
  }, [sp, travellerType]);

  return (
    <div className="relative min-h-[260px] md:min-h-[320px]">
      {/* Vídeo de fondo */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <video
          className="h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          poster="/images/basic-config-hero-fallback.jpg"
        >
          <source src="/videos/basic-config-video-hero.webm" type="video/webm" />
          <source src="/videos/basic-config-video-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-6 text-center text-white">
        <h2 className="font-display text-3xl md:text-4xl">Cada viaje es un relato. Este empieza aquí.</h2>
        <p className="mt-1 text-sm text-white/90">
          Marquen desde dónde parten y prepárense para lo inesperado..
        </p>

        <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
          {travellerType && FROM_LABEL[travellerType] && <Chip>Tipo de viaje: {FROM_LABEL[travellerType]}</Chip>}
          {level && TIER_LABEL[level] && <Chip>Nivel: {TIER_LABEL[level]}</Chip>}

          {experienciaPrincipal && <Chip>Experiencia: {experienciaPrincipal}</Chip>}

          {opcionesPreferentes.length > 0 && (
            <Chip>
              Opciones preferentes: {opcionesPreferentes.join(', ')}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
