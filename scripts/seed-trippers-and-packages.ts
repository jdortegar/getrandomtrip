import { prisma } from '../src/lib/prisma';

// American countries and cities for packages
const AMERICAN_DESTINATIONS = {
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
    'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
    'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
    'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
    'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs',
    'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis',
    'Tulsa', 'Arlington', 'Tampa', 'New Orleans'
  ],
  'Canada': [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa',
    'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria',
    'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke',
    'Kelowna', 'Barrie', 'Abbotsford', 'Sudbury', 'Kingston', 'Saguenay',
    'Trois-Rivières', 'Guelph', 'Cambridge', 'Coquitlam', 'Richmond', 'Delta'
  ],
  'Mexico': [
    'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León',
    'Juárez', 'Zapopan', 'Nezahualcóyotl', 'Chihuahua', 'Naucalpan', 'Mérida',
    'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Saltillo', 'Mexicali',
    'Culiacán', 'Acapulco', 'Cancún', 'Tampico', 'Veracruz', 'Villahermosa',
    'Irapuato', 'Xalapa', 'Mazatlán', 'Durango', 'Tuxtla Gutiérrez', 'Cuernavaca'
  ],
  'Brazil': [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte',
    'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos',
    'Campinas', 'São Luís', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina',
    'Campo Grande', 'Nova Iguaçu', 'São Bernardo do Campo', 'João Pessoa', 'Santo André',
    'Jaboatão dos Guararapes', 'Osasco', 'Ribeirão Preto', 'Uberlândia', 'Sorocaba'
  ],
  'Argentina': [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán',
    'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Santiago del Estero',
    'Corrientes', 'Posadas', 'San Salvador de Jujuy', 'Bahía Blanca', 'Paraná', 'Neuquén',
    'Formosa', 'San Luis', 'La Rioja', 'Catamarca', 'Rawson', 'Viedma', 'Ushuaia'
  ],
  'Chile': [
    'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco',
    'Rancagua', 'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles', 'Puerto Montt',
    'Valdivia', 'Osorno', 'Quilpué', 'Calama', 'Copiapó', 'La Pintana', 'San Bernardo'
  ],
  'Colombia': [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga',
    'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales', 'Neiva', 'Villavicencio',
    'Armenia', 'Valledupar', 'Montería', 'Sincelejo', 'Popayán', 'Tunja'
  ],
  'Peru': [
    'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco',
    'Chimbote', 'Huancayo', 'Tacna', 'Juliaca', 'Ica', 'Cajamarca', 'Pucallpa',
    'Tumbes', 'Ayacucho', 'Huánuco', 'Huancavelica', 'Abancay', 'Moquegua'
  ]
};

// Tripper profiles
const TRIPPER_PROFILES = [
  {
    name: 'Isabella',
    email: 'isabella@randomtrip.com',
    slug: 'isabella',
    bio: 'Luxury travel curator with a passion for creating unforgettable moments. Specializing in romantic getaways and family adventures across North and South America.',
    location: 'Miami, Florida',
    interests: ['luxury', 'romance', 'family'],
    availableTypes: ['couple', 'family', 'honeymoon'],
    commission: 0.15,
    specializations: ['romantic-dining', 'luxury-accommodations', 'family-friendly'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
  },
  {
    name: 'Carlos',
    email: 'carlos@randomtrip.com',
    slug: 'carlos',
    bio: 'Adventure specialist and outdoor enthusiast. From hiking the Canadian Rockies to surfing in Brazil, I create adrenaline-filled experiences for thrill-seekers.',
    location: 'Vancouver, Canada',
    interests: ['adventure', 'outdoor', 'extreme-sports'],
    availableTypes: ['solo', 'couple', 'group'],
    commission: 0.10,
    specializations: ['adventure-challenge', 'extreme-sports', 'outdoor-activities'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
  },
  {
    name: 'María',
    email: 'maria@randomtrip.com',
    slug: 'maria',
    bio: 'Cultural immersion expert and local experiences curator. I help travelers discover the authentic soul of Latin America through food, music, and local traditions.',
    location: 'Mexico City, Mexico',
    interests: ['culture', 'food', 'music'],
    availableTypes: ['solo', 'couple', 'family', 'group'],
    commission: 0.08,
    specializations: ['cultural-immersion', 'local-experiences', 'culinary-tours'],
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
  },
  {
    name: 'Alex',
    email: 'alex@randomtrip.com',
    slug: 'alex',
    bio: 'Wellness and mindfulness travel specialist. I design transformative journeys that combine relaxation, self-discovery, and connection with nature across the Americas.',
    location: 'Costa Rica',
    interests: ['wellness', 'mindfulness', 'nature'],
    availableTypes: ['solo', 'couple', 'family'],
    commission: 0.13,
    specializations: ['mindfulness-wellness', 'spa-retreats', 'nature-connection'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
  },
  {
    name: 'Sofia',
    email: 'sofia@randomtrip.com',
    slug: 'sofia',
    bio: 'Urban explorer and city specialist. I help travelers discover the hidden gems and vibrant culture of major American cities from New York to São Paulo.',
    location: 'São Paulo, Brazil',
    interests: ['urban', 'culture', 'nightlife'],
    availableTypes: ['solo', 'couple', 'group'],
    commission: 0.09,
    specializations: ['cultural-immersion', 'local-experiences', 'urban-exploration'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face'
  }
];

// Package templates by type and level
const PACKAGE_TEMPLATES = {
  solo: {
    essenza: [
      { themes: ['mindfulness-wellness'], basePrice: 400, nights: 3 },
      { themes: ['cultural-immersion'], basePrice: 500, nights: 4 },
      { themes: ['adventure-challenge'], basePrice: 600, nights: 5 }
    ],
    explora: [
      { themes: ['mindfulness-wellness', 'cultural-immersion'], basePrice: 800, nights: 5 },
      { themes: ['adventure-challenge', 'mindfulness-wellness'], basePrice: 900, nights: 6 },
      { themes: ['cultural-immersion', 'local-experiences'], basePrice: 750, nights: 4 }
    ],
    exploraPlus: [
      { themes: ['mindfulness-wellness', 'adventure-challenge'], basePrice: 1200, nights: 7 },
      { themes: ['cultural-immersion', 'mindfulness-wellness'], basePrice: 1500, nights: 8 },
      { themes: ['adventure-challenge', 'extreme-sports'], basePrice: 1800, nights: 10 }
    ],
    bivouac: [
      { themes: ['adventure-challenge', 'extreme-sports', 'outdoor-activities'], basePrice: 2500, nights: 12 },
      { themes: ['mindfulness-wellness', 'spa-retreats', 'nature-connection'], basePrice: 3000, nights: 14 }
    ],
    atelier: [
      { themes: ['luxury-accommodations', 'romantic-dining', 'spa-retreats'], basePrice: 4000, nights: 10 },
      { themes: ['cultural-immersion', 'local-experiences', 'culinary-tours'], basePrice: 3500, nights: 12 }
    ]
  },
  couple: {
    essenza: [
      { themes: ['romantic-dining', 'cultural-immersion'], basePrice: 600, nights: 3 },
      { themes: ['mindfulness-wellness', 'romantic-dining'], basePrice: 700, nights: 4 }
    ],
    explora: [
      { themes: ['romantic-dining', 'cultural-immersion', 'local-experiences'], basePrice: 1000, nights: 5 },
      { themes: ['mindfulness-wellness', 'romantic-dining', 'spa-retreats'], basePrice: 1200, nights: 6 }
    ],
    exploraPlus: [
      { themes: ['romantic-dining', 'luxury-accommodations', 'cultural-immersion'], basePrice: 1800, nights: 7 },
      { themes: ['mindfulness-wellness', 'spa-retreats', 'romantic-dining'], basePrice: 2000, nights: 8 }
    ],
    bivouac: [
      { themes: ['luxury-accommodations', 'romantic-dining', 'spa-retreats'], basePrice: 3500, nights: 10 },
      { themes: ['adventure-challenge', 'romantic-dining', 'cultural-immersion'], basePrice: 3000, nights: 12 }
    ],
    atelier: [
      { themes: ['luxury-accommodations', 'romantic-dining', 'spa-retreats', 'culinary-tours'], basePrice: 5000, nights: 10 }
    ]
  },
  family: {
    essenza: [
      { themes: ['family-friendly', 'cultural-immersion'], basePrice: 800, nights: 4 },
      { themes: ['family-friendly', 'local-experiences'], basePrice: 900, nights: 5 }
    ],
    explora: [
      { themes: ['family-friendly', 'cultural-immersion', 'local-experiences'], basePrice: 1200, nights: 6 },
      { themes: ['family-friendly', 'adventure-challenge'], basePrice: 1400, nights: 7 }
    ],
    exploraPlus: [
      { themes: ['family-friendly', 'cultural-immersion', 'adventure-challenge'], basePrice: 2000, nights: 8 },
      { themes: ['family-friendly', 'local-experiences', 'culinary-tours'], basePrice: 1800, nights: 7 }
    ],
    bivouac: [
      { themes: ['family-friendly', 'adventure-challenge', 'cultural-immersion'], basePrice: 3000, nights: 10 }
    ]
  },
  group: {
    essenza: [
      { themes: ['adventure-challenge', 'cultural-immersion'], basePrice: 500, nights: 4 },
      { themes: ['local-experiences', 'cultural-immersion'], basePrice: 600, nights: 5 }
    ],
    explora: [
      { themes: ['adventure-challenge', 'cultural-immersion', 'local-experiences'], basePrice: 800, nights: 6 },
      { themes: ['adventure-challenge', 'extreme-sports'], basePrice: 1000, nights: 7 }
    ],
    exploraPlus: [
      { themes: ['adventure-challenge', 'extreme-sports', 'cultural-immersion'], basePrice: 1500, nights: 8 },
      { themes: ['adventure-challenge', 'outdoor-activities', 'local-experiences'], basePrice: 1300, nights: 7 }
    ],
    bivouac: [
      { themes: ['adventure-challenge', 'extreme-sports', 'outdoor-activities'], basePrice: 2500, nights: 10 }
    ]
  },
  honeymoon: {
    explora: [
      { themes: ['romantic-dining', 'luxury-accommodations'], basePrice: 1500, nights: 5 },
      { themes: ['romantic-dining', 'spa-retreats'], basePrice: 1800, nights: 6 }
    ],
    exploraPlus: [
      { themes: ['romantic-dining', 'luxury-accommodations', 'spa-retreats'], basePrice: 2500, nights: 7 },
      { themes: ['romantic-dining', 'cultural-immersion', 'luxury-accommodations'], basePrice: 2200, nights: 8 }
    ],
    bivouac: [
      { themes: ['romantic-dining', 'luxury-accommodations', 'spa-retreats', 'culinary-tours'], basePrice: 4000, nights: 10 }
    ],
    atelier: [
      { themes: ['luxury-accommodations', 'romantic-dining', 'spa-retreats', 'culinary-tours'], basePrice: 6000, nights: 12 }
    ]
  },
  paws: {
    essenza: [
      { themes: ['family-friendly', 'outdoor-activities'], basePrice: 600, nights: 4 },
      { themes: ['family-friendly', 'local-experiences'], basePrice: 700, nights: 5 }
    ],
    explora: [
      { themes: ['family-friendly', 'outdoor-activities', 'local-experiences'], basePrice: 1000, nights: 6 },
      { themes: ['family-friendly', 'adventure-challenge'], basePrice: 1200, nights: 7 }
    ],
    exploraPlus: [
      { themes: ['family-friendly', 'outdoor-activities', 'adventure-challenge'], basePrice: 1800, nights: 8 }
    ]
  }
};

// Generate random package data
function generatePackage(tripper: any, type: string, level: string, template: any) {
  const countries = Object.keys(AMERICAN_DESTINATIONS);
  const country = countries[Math.floor(Math.random() * countries.length)];
  const cities = AMERICAN_DESTINATIONS[country];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  const themes = template.themes;
  const basePrice = template.basePrice + Math.floor(Math.random() * 200) - 100;
  const nights = template.nights;
  
  // Map old themes to excuse keys
  const themeToExcuseMap: Record<string, string> = {
    'mindfulness-wellness': 'wellness-retreat',
    'cultural-immersion': 'cultural-immersion',
    'adventure-challenge': 'solo-adventure',
    'romantic-dining': 'romantic-getaway',
    'luxury-accommodations': 'romantic-getaway',
    'family-friendly': 'family-adventure',
    'local-experiences': 'cultural-immersion',
    'spa-retreats': 'wellness-retreat',
    'culinary-tours': 'cultural-immersion',
    'extreme-sports': 'solo-adventure',
    'outdoor-activities': 'solo-adventure',
    'nature-connection': 'wellness-retreat'
  };
  
  // Get excuse key from primary theme
  const excuseKey = themeToExcuseMap[themes[0]] || 'cultural-immersion';
  
  // Generate title based on themes and destination
  const titlePrefixes = {
    'mindfulness-wellness': ['Retiro de Bienestar', 'Escape de Meditación', 'Renovación Espiritual'],
    'cultural-immersion': ['Inmersión Cultural', 'Descubrimiento Local', 'Tradiciones Auténticas'],
    'adventure-challenge': ['Aventura Extrema', 'Desafío Natural', 'Expedición Salvaje'],
    'romantic-dining': ['Escapada Romántica', 'Cena Íntima', 'Momento Especial'],
    'luxury-accommodations': ['Lujo Exclusivo', 'Experiencia Premium', 'Refinamiento Total'],
    'family-friendly': ['Aventura Familiar', 'Diversión para Todos', 'Experiencia Compartida'],
    'local-experiences': ['Vivencias Locales', 'Autenticidad Pura', 'Conexión Real'],
    'spa-retreats': ['Retiro de Spa', 'Relajación Total', 'Bienestar Integral'],
    'culinary-tours': ['Tour Gastronómico', 'Sabores Auténticos', 'Cocina Local'],
    'extreme-sports': ['Deportes Extremos', 'Adrenalina Pura', 'Aventura Radical'],
    'outdoor-activities': ['Actividades al Aire Libre', 'Naturaleza Viva', 'Aventura Natural'],
    'nature-connection': ['Conexión Natural', 'Armonía Silvestre', 'Paz Interior']
  };
  
  const primaryTheme = themes[0];
  const prefixes = titlePrefixes[primaryTheme] || ['Experiencia Única'];
  const titlePrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  const title = `${titlePrefix} en ${city}`;
  
  // Generate teaser based on themes
  const teasers = {
    'mindfulness-wellness': [
      'Un viaje para reconectar contigo mismo y encontrar la paz interior.',
      'Descubre el bienestar a través de la meditación y la naturaleza.',
      'Renueva tu espíritu en un ambiente de tranquilidad y serenidad.'
    ],
    'cultural-immersion': [
      'Sumérgete en la cultura local y descubre tradiciones auténticas.',
      'Vive experiencias únicas que te conectarán con el alma del lugar.',
      'Explora la riqueza cultural de manera profunda y significativa.'
    ],
    'adventure-challenge': [
      'Desafía tus límites en una aventura llena de adrenalina y emoción.',
      'Descubre tu fuerza interior a través de experiencias extremas.',
      'Vive la aventura de tu vida en paisajes impresionantes.'
    ],
    'romantic-dining': [
      'Crea momentos inolvidables en un ambiente romántico y especial.',
      'Disfruta de la gastronomía local en un entorno íntimo y encantador.',
      'Celebra el amor con experiencias culinarias únicas.'
    ],
    'luxury-accommodations': [
      'Experimenta el lujo en su máxima expresión con alojamientos exclusivos.',
      'Disfruta de comodidades premium en un ambiente sofisticado.',
      'Vive una experiencia de refinamiento y elegancia absoluta.'
    ],
    'family-friendly': [
      'Crea recuerdos inolvidables para toda la familia.',
      'Disfruta de actividades diseñadas para todas las edades.',
      'Una experiencia que unirá a toda la familia en la diversión.'
    ],
    'local-experiences': [
      'Conecta con la comunidad local y descubre su forma de vida.',
      'Vive experiencias auténticas que solo los locales conocen.',
      'Sumérgete en la vida real del destino de manera genuina.'
    ],
    'spa-retreats': [
      'Relájate completamente en un oasis de bienestar y tranquilidad.',
      'Renueva tu cuerpo y mente con tratamientos de lujo.',
      'Encuentra la paz interior en un ambiente de relajación total.'
    ],
    'culinary-tours': [
      'Descubre los sabores auténticos de la región.',
      'Explora la gastronomía local con guías expertos.',
      'Vive una experiencia culinaria única y memorable.'
    ],
    'extreme-sports': [
      'Siente la adrenalina con deportes extremos en paisajes increíbles.',
      'Desafía tus límites con actividades de alta intensidad.',
      'Vive la emoción pura en un entorno natural impresionante.'
    ],
    'outdoor-activities': [
      'Disfruta de actividades al aire libre en la naturaleza.',
      'Conecta con el entorno natural a través de aventuras.',
      'Explora la belleza natural de manera activa y divertida.'
    ],
    'nature-connection': [
      'Conecta profundamente con la naturaleza y encuentra tu equilibrio.',
      'Descubre la armonía natural en un ambiente sereno.',
      'Encuentra la paz interior a través de la conexión natural.'
    ]
  };
  
  const primaryTeasers = teasers[primaryTheme] || ['Una experiencia única que recordarás para siempre.'];
  const teaser = primaryTeasers[Math.floor(Math.random() * primaryTeasers.length)];
  
  // Generate highlights based on themes and nights
  const highlights = [];
  if (nights <= 4) highlights.push(`${nights} noches`);
  else highlights.push(`${nights} noches`);
  
  if (themes.includes('luxury-accommodations')) {
    highlights.push('Hotel de lujo', 'Servicio premium');
  } else {
    highlights.push('Alojamiento boutique', 'Ubicación céntrica');
  }
  
  if (themes.includes('romantic-dining')) {
    highlights.push('Cena romántica', 'Experiencia íntima');
  }
  
  if (themes.includes('spa-retreats')) {
    highlights.push('Spa de lujo', 'Tratamientos premium');
  }
  
  if (themes.includes('adventure-challenge')) {
    highlights.push('Equipo profesional', 'Guía especializado');
  }
  
  if (themes.includes('cultural-immersion')) {
    highlights.push('Guía local', 'Experiencias auténticas');
  }
  
  if (themes.includes('mindfulness-wellness')) {
    highlights.push('Sesiones de meditación', 'Ambiente sereno');
  }
  
  // Generate tags based on themes
  const tags = themes.map(theme => 
    theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
  
  // Add destination-based tags
  if (country === 'United States') tags.push('USA', 'North America');
  else if (country === 'Canada') tags.push('Canada', 'North America');
  else if (country === 'Mexico') tags.push('Mexico', 'Latin America');
  else if (country === 'Brazil') tags.push('Brazil', 'South America');
  else if (country === 'Argentina') tags.push('Argentina', 'South America');
  else if (country === 'Chile') tags.push('Chile', 'South America');
  else if (country === 'Colombia') tags.push('Colombia', 'South America');
  else if (country === 'Peru') tags.push('Peru', 'South America');
  
  // Generate full description
  const descriptions = {
    'mindfulness-wellness': [
      'Un retiro transformador diseñado para reconectar contigo mismo. A través de prácticas de meditación, yoga y conexión con la naturaleza, encontrarás la paz interior y el equilibrio mental que necesitas.',
      'Sumérgete en un ambiente de tranquilidad y serenidad donde podrás practicar mindfulness, disfrutar de tratamientos de bienestar y desconectar del estrés diario.',
      'Una experiencia de bienestar integral que combina relajación, meditación y actividades que nutren tanto el cuerpo como el alma.'
    ],
    'cultural-immersion': [
      'Descubre la auténtica cultura local a través de experiencias únicas que te conectarán con las tradiciones, la gastronomía y la forma de vida de los habitantes del lugar.',
      'Sumérgete en la riqueza cultural de la región con visitas a sitios históricos, encuentros con comunidades locales y actividades que te permitirán vivir la cultura de primera mano.',
      'Una inmersión profunda en las tradiciones locales que incluye gastronomía auténtica, música tradicional y experiencias que solo los locales conocen.'
    ],
    'adventure-challenge': [
      'Desafía tus límites en una aventura llena de adrenalina y emoción. Desde actividades extremas hasta desafíos físicos, esta experiencia te llevará más allá de tu zona de confort.',
      'Vive la aventura de tu vida con actividades de alta intensidad en paisajes impresionantes. Perfecto para aquellos que buscan emociones fuertes y experiencias únicas.',
      'Una expedición diseñada para aventureros que buscan superar desafíos físicos y mentales en entornos naturales espectaculares.'
    ],
    'romantic-dining': [
      'Crea momentos inolvidables en un ambiente romántico y especial. Disfruta de cenas íntimas, experiencias gastronómicas únicas y momentos de conexión en lugares mágicos.',
      'Una experiencia romántica que combina la mejor gastronomía local con ambientes íntimos y especiales, perfecta para celebrar el amor.',
      'Disfruta de una escapada romántica con experiencias culinarias excepcionales en los lugares más encantadores de la región.'
    ],
    'luxury-accommodations': [
      'Experimenta el lujo en su máxima expresión con alojamientos exclusivos, servicios premium y comodidades de primera clase en un ambiente sofisticado.',
      'Disfruta de una experiencia de refinamiento absoluto con hoteles de lujo, servicios personalizados y todas las comodidades que puedas imaginar.',
      'Una experiencia de lujo incomparable que incluye alojamientos exclusivos, servicios de conserjería y experiencias gastronómicas de alta gama.'
    ],
    'family-friendly': [
      'Crea recuerdos inolvidables para toda la familia con actividades diseñadas para todas las edades. Una experiencia que unirá a todos en la diversión y el descubrimiento.',
      'Disfruta de una aventura familiar perfecta con actividades seguras, educativas y divertidas que mantendrán a todos entretenidos y conectados.',
      'Una experiencia familiar completa que combina diversión, aprendizaje y momentos especiales para crear recuerdos que durarán toda la vida.'
    ],
    'local-experiences': [
      'Conecta con la comunidad local y descubre su forma de vida auténtica. Vive experiencias genuinas que solo los habitantes del lugar conocen.',
      'Sumérgete en la vida real del destino a través de encuentros con locales, visitas a mercados tradicionales y actividades que te mostrarán la verdadera esencia del lugar.',
      'Una experiencia auténtica que te permitirá conocer la cultura local de manera profunda y significativa, creando conexiones reales con la comunidad.'
    ],
    'spa-retreats': [
      'Relájate completamente en un oasis de bienestar y tranquilidad. Disfruta de tratamientos de lujo, terapias relajantes y un ambiente diseñado para tu renovación total.',
      'Sumérgete en un mundo de relajación con spa de lujo, tratamientos premium y un ambiente sereno que te permitirá desconectar y renovarte por completo.',
      'Una experiencia de bienestar integral que combina tratamientos de spa, relajación y actividades que nutren tanto el cuerpo como la mente.'
    ],
    'culinary-tours': [
      'Descubre los sabores auténticos de la región a través de tours gastronómicos únicos. Conoce la cocina local, visita mercados tradicionales y disfruta de experiencias culinarias memorables.',
      'Sumérgete en la gastronomía local con tours guiados por expertos, degustaciones exclusivas y encuentros con chefs locales que te mostrarán los secretos de la cocina regional.',
      'Una experiencia culinaria completa que incluye tours de mercados, clases de cocina, degustaciones y encuentros con productores locales.'
    ],
    'extreme-sports': [
      'Siente la adrenalina con deportes extremos en paisajes increíbles. Desde actividades de alta intensidad hasta desafíos extremos, esta experiencia te llevará al límite.',
      'Vive la emoción pura con deportes extremos en entornos naturales impresionantes. Perfecto para aquellos que buscan la máxima adrenalina y experiencias únicas.',
      'Una aventura extrema diseñada para deportistas que buscan superar sus límites en actividades de alta intensidad y riesgo controlado.'
    ],
    'outdoor-activities': [
      'Disfruta de actividades al aire libre en la naturaleza. Desde senderismo hasta deportes acuáticos, conecta con el entorno natural de manera activa y divertida.',
      'Explora la belleza natural a través de actividades al aire libre que te permitirán disfrutar del paisaje mientras te mantienes activo y saludable.',
      'Una experiencia al aire libre que combina aventura, naturaleza y actividad física en los paisajes más hermosos de la región.'
    ],
    'nature-connection': [
      'Conecta profundamente con la naturaleza y encuentra tu equilibrio. A través de actividades en entornos naturales, descubre la armonía y la paz que solo la naturaleza puede ofrecer.',
      'Sumérgete en la belleza natural y encuentra la serenidad a través de actividades que te conectan con el entorno natural de manera profunda y significativa.',
      'Una experiencia de conexión natural que te permitirá encontrar la paz interior y el equilibrio a través de la armonía con el entorno natural.'
    ]
  };
  
  const primaryDescriptions = descriptions[primaryTheme] || ['Una experiencia única y memorable que te permitirá descubrir los secretos más auténticos del destino.'];
  const description = primaryDescriptions[Math.floor(Math.random() * primaryDescriptions.length)];

  return {
    title,
    teaser,
    description,
    destinationCountry: country,
    destinationCity: city,
    basePriceUsd: basePrice,
    displayPrice: `Desde $${basePrice} USD`,
    excuseKey: excuseKey,
    tags,
    highlights,
    heroImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80`,
    minNights: nights,
    maxNights: nights + 2,
    minPax: type === 'solo' ? 1 : type === 'couple' ? 2 : 2,
    maxPax: type === 'family' ? 6 : type === 'group' ? 12 : 4,
    status: 'ACTIVE',
    isActive: true
  };
}

async function seedTrippersAndPackages() {
  try {
    console.log('Starting to seed trippers and packages...');
    
    // Get all trippers (existing and new)
    const createdTrippers = [];
    
    // Get existing trippers
    const existingTrippers = await prisma.user.findMany({
      where: { role: 'TRIPPER' },
    });
    
    // Add Dawson with updated data
    const dawsonData = {
      name: 'Dawson',
      email: 'dawson@randomtrip.com',
      slug: 'dawson',
      bio: 'Experienced travel advisor specializing in unique experiences across the Americas. From the bustling streets of New York to the serene landscapes of Patagonia.',
      location: 'Buenos Aires, Argentina',
      interests: ['adventure', 'culture', 'nature'],
      availableTypes: ['solo', 'couple', 'family', 'group', 'honeymoon', 'paws'],
      commission: 0.12,
      specializations: ['adventure', 'cultural-immersion', 'mindfulness-wellness'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    };
    
    const allTripperData = [dawsonData, ...TRIPPER_PROFILES];
    
    for (const tripperData of allTripperData) {
      let tripper = existingTrippers.find(t => t.name === tripperData.name);
      
      if (tripper) {
        // Update existing tripper
        tripper = await prisma.user.update({
          where: { id: tripper.id },
          data: {
            bio: tripperData.bio,
            location: tripperData.location,
            interests: tripperData.interests,
            availableTypes: tripperData.availableTypes,
            commission: tripperData.commission,
            avatarUrl: tripperData.avatarUrl,
          },
        });
        console.log(`Updated existing tripper: ${tripper.name}`);
      } else {
        // Create new tripper
        tripper = await prisma.user.create({
          data: {
            name: tripperData.name,
            email: tripperData.email,
            role: 'TRIPPER',
            tripperSlug: tripperData.slug,
            bio: tripperData.bio,
            location: tripperData.location,
            interests: tripperData.interests,
            availableTypes: tripperData.availableTypes,
            commission: tripperData.commission,
            avatarUrl: tripperData.avatarUrl,
          },
        });
        console.log(`Created tripper: ${tripper.name}`);
      }
      
      createdTrippers.push({ ...tripper, specializations: tripperData.specializations });
    }
    
    // Create packages for each tripper
    let totalPackages = 0;
    for (const tripper of createdTrippers) {
      console.log(`\nCreating packages for ${tripper.name}...`);
      
      const packages = [];
      
      // Create 2 packages for each available type and level combination
      for (const type of tripper.availableTypes) {
        const typeTemplates = PACKAGE_TEMPLATES[type];
        if (!typeTemplates) continue;
        
        for (const [level, templates] of Object.entries(typeTemplates)) {
          // Create 2 packages for this type/level combination
          for (let i = 0; i < 2; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const packageData = generatePackage(tripper, type, level, template);
            
            packages.push({
              ...packageData,
              ownerId: tripper.id,
              type,
              level,
            });
          }
        }
      }
      
      // Create packages in database
      for (const packageData of packages) {
        await prisma.package.create({
          data: packageData,
        });
        totalPackages++;
      }
      
      console.log(`Created ${packages.length} packages for ${tripper.name}`);
    }
    
    console.log(`\n✅ Successfully created ${createdTrippers.length} trippers and ${totalPackages} packages!`);
    
    // Display summary
    console.log('\n📊 Summary:');
    for (const tripper of createdTrippers) {
      const tripperPackages = await prisma.package.findMany({
        where: { ownerId: tripper.id },
        select: { type: true, level: true, destinationCountry: true },
      });
      
      const byType = tripperPackages.reduce((acc, pkg) => {
        if (!acc[pkg.type]) acc[pkg.type] = {};
        if (!acc[pkg.type][pkg.level]) acc[pkg.type][pkg.level] = 0;
        acc[pkg.type][pkg.level]++;
        return acc;
      }, {} as any);
      
      console.log(`\n${tripper.name} (${tripperPackages.length} packages):`);
      for (const [type, levels] of Object.entries(byType)) {
        console.log(`  ${type}: ${Object.entries(levels).map(([level, count]) => `${level}(${count})`).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTrippersAndPackages();
