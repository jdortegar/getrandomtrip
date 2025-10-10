import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface Tag {
  label: string;
  value: string;
}

interface PlanData {
  travellerType: string;
  level: string;
  experienciaPrincipal: string | null;
  opcionesPreferentes: string[];
  tags: Tag[];
}

// Mapping of URL param keys to human-readable labels
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
    'gourmet-dinner': 'Fine Dining & Experiencias Gourmet',
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
    'self-discovery': 'Autodescubrimiento',
    'adventure-seeker': 'Buscador de Aventuras',
    'cultural-immersion': 'Inmersión Cultural',
    'digital-detox': 'Desintoxicación Digital',
    'skill-builder': 'Construcción de Habilidades',
    'social-explorer': 'Explorador Social',
    'wellness-journey': 'Viaje de Bienestar',
    'creative-retreat': 'Retiro Creativo',
    'get-lost': 'Get Lost',
    'busqueda-interior': 'Búsqueda Interior',
    'aventura-desafio': 'Aventura & Desafío',
    'exploracion-cultural': 'Exploración Cultural',
    'fotografia-narrativa': 'Fotografía & Narrativa Visual',
    'literatura-arte': 'Literatura, Arte & Talleres Locales',
    'musica-sonidos': 'Música & Sonidos',
    'tribe-encounters': 'Tribe Encounters',
    'naturaleza-silenciosa': 'Naturaleza Silenciosa 🌲',
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
    'adventure-explorers': 'Aventura Exploradores',
    'cultural-discovery': 'Descubrimiento Cultural',
    'beach-relaxation': 'Relax en la Playa',
    'nature-wildlife': 'Naturaleza y Vida Silvestre',
    'theme-parks': 'Parques Temáticos',
    'educational-trips': 'Viajes Educativos',
    'camping-outdoors': 'Camping al Aire Libre',
    'city-exploration': 'Exploración Urbana',
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
    'party-nightlife': 'Fiesta y Vida Nocturna',
    'adventure-sports': 'Deportes de Aventura',
    'cultural-tours': 'Tours Culturales',
    'foodie-experience': 'Experiencia Gastronómica',
    'team-building': 'Team Building',
    'festival-hopping': 'Festivales',
    'beach-retreat': 'Retiro en la Playa',
    'road-trip': 'Road Trip',
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
  honeymoon: {
    'romantic-paradise': 'Paraíso Romántico',
    'adventure-romance': 'Romance Aventurero',
    'luxury-escape': 'Escapada de Lujo',
    'exotic-destination': 'Destino Exótico',
    'beach-resort': 'Resort de Playa',
    'cultural-experience': 'Experiencia Cultural',
    'wellness-spa': 'Wellness & Spa',
    'private-villa': 'Villa Privada',
  },
  paws: {
    'nature-trails': 'Senderos Naturales',
    'beach-fun': 'Diversión en la Playa',
    'mountain-hiking': 'Senderismo en Montaña',
    'urban-exploration': 'Exploración Urbana',
    'dog-friendly-hotels': 'Hoteles Pet-Friendly',
    'outdoor-adventures': 'Aventuras al Aire Libre',
    'relax-wellness': 'Relax & Bienestar',
    'food-getaways': 'Escapadas Gastronómicas',
    'rural-farm': 'Trips Rurales & Granja',
    'dog-events': 'Dog Events & Comunidades',
  },
};

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

export function usePlanData(): PlanData {
  const sp = useSearchParams();

  const travellerType = sp.get('type') ?? '';
  const level = sp.get('level') ?? '';

  const { experienciaPrincipal, opcionesPreferentes } = useMemo(() => {
    const mapping = OPTIONS_LABELS[travellerType] || {};
    let experiencia: string | null = null;
    const opciones: string[] = [];

    // 1. Buscar la experiencia principal (el "alma" o "escape type")
    const mainExperienceKey =
      sp.get('coupleAlma') ||
      sp.get('soloAlma') ||
      sp.get('escapeType') ||
      sp.get('groupAlma');

    if (mainExperienceKey && mapping[mainExperienceKey]) {
      experiencia = mapping[mainExperienceKey];
    }

    // 2. Buscar opciones adicionales (como "familyType" o las de "Afinar detalles")
    const familyTypeKey = sp.get('familyType');

    if (familyTypeKey && mapping[familyTypeKey]) {
      opciones.push(mapping[familyTypeKey]);
    }

    const almaOptionsKeys = (sp.get('almaOptions') ?? '')
      .split(',')
      .filter(Boolean);
    almaOptionsKeys.forEach((key) => {
      if (mapping[key]) {
        opciones.push(mapping[key]);
      }
    });

    return { experienciaPrincipal: experiencia, opcionesPreferentes: opciones };
  }, [sp, travellerType]);

  // Build tags array
  const tags: Tag[] = useMemo(() => {
    const result: Tag[] = [];

    if (travellerType && FROM_LABEL[travellerType]) {
      result.push({
        label: 'Tipo de viaje',
        value: FROM_LABEL[travellerType],
      });
    }

    if (level && TIER_LABEL[level]) {
      result.push({
        label: 'Nivel',
        value: TIER_LABEL[level],
      });
    }

    if (experienciaPrincipal) {
      result.push({
        label: 'Experiencia',
        value: experienciaPrincipal,
      });
    }

    if (opcionesPreferentes.length > 0) {
      result.push({
        label: 'Opciones preferentes',
        value: opcionesPreferentes.join(', '),
      });
    }

    return result;
  }, [travellerType, level, experienciaPrincipal, opcionesPreferentes]);

  return {
    travellerType,
    level,
    experienciaPrincipal,
    opcionesPreferentes,
    tags,
  };
}
