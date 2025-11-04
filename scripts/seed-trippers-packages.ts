import { PrismaClient, BlogStatus, BlogFormat } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTrippersAndPackages() {
  console.log('🌱 Seeding trippers and packages...');

  try {
    // Hash password for trippers
    const tripperPassword = await bcrypt.hash('password123', 10);

    // Create test trippers
    const trippers = [
      {
        email: 'dawson@randomtrip.com',
        name: 'Dawson',
        password: tripperPassword,
        tripperSlug: 'dawson',
        commission: 0.15,
        availableTypes: ['solo', 'couple', 'group'],
        role: 'TRIPPER' as const,
        bio: 'Aventurero urbano especializado en experiencias auténticas y descubrimientos inesperados. Con más de 8 años explorando ciudades del mundo, Dawson conoce los secretos mejor guardados de cada destino.',
        heroImage: '/images/trippers/dawson-hero.jpg',
        location: 'Buenos Aires, Argentina',
        tierLevel: 'pro',
        interests: [
          'aventura urbana',
          'cultura local',
          'gastronomía',
          'fotografía',
        ],
        destinations: ['Argentina', 'Chile', 'Uruguay', 'Brasil', 'México'],
      },
      {
        email: 'alma@randomtrip.com',
        name: 'Alma',
        password: tripperPassword,
        tripperSlug: 'alma',
        commission: 0.12,
        availableTypes: ['family', 'honeymoon'],
        role: 'TRIPPER' as const,
        bio: 'Especialista en viajes familiares y lunas de miel inolvidables. Alma diseña experiencias que conectan a las familias y crean momentos mágicos para parejas. Su enfoque es crear recuerdos que duren toda la vida.',
        heroImage: '/images/trippers/alma-hero.jpg',
        location: 'Barcelona, España',
        tierLevel: 'elite',
        interests: [
          'viajes familiares',
          'lunas de miel',
          'bienestar',
          'sostenibilidad',
        ],
        destinations: ['España', 'Italia', 'Grecia', 'Portugal', 'Maldivas'],
      },
      {
        email: 'randomtrip@randomtrip.com',
        name: 'Randomtrip',
        password: tripperPassword,
        tripperSlug: 'randomtrip',
        commission: 0.0,
        availableTypes: [
          'solo',
          'couple',
          'group',
          'family',
          'honeymoon',
          'paws',
        ],
        role: 'TRIPPER' as const,
        bio: 'El equipo de Randomtrip combina la experiencia de múltiples especialistas para crear viajes únicos y personalizados. Nuestra misión es democratizar el acceso a experiencias de viaje auténticas y memorables.',
        heroImage: '/images/trippers/randomtrip-hero.jpg',
        location: 'Global',
        tierLevel: 'elite',
        interests: [
          'aventura',
          'cultura',
          'naturaleza',
          'gastronomía',
          'sostenibilidad',
        ],
        destinations: ['Mundial', 'América Latina', 'Europa', 'Asia', 'África'],
      },
    ];

    // Create or update trippers
    const createdTrippers = [];
    for (const tripperData of trippers) {
      const tripper = await prisma.user.upsert({
        where: { email: tripperData.email },
        update: tripperData,
        create: tripperData,
      });
      createdTrippers.push(tripper);
      console.log(
        `✅ Created/Updated tripper: ${tripper.name} (${tripper.tripperSlug})`,
      );
    }

    // Create packages for each tripper
    const packages = [
      // Dawson packages
      {
        ownerId: createdTrippers[0].id,
        type: 'solo',
        level: 'essenza',
        minNights: 2,
        maxNights: 4,
        minPax: 1,
        maxPax: 1,
        title: 'Aventura Urbana Solitaria',
        teaser: 'Descubre la ciudad como nunca antes',
        description:
          'Una experiencia única para viajeros solitarios que buscan aventura urbana.',
        heroImage: '/images/urban-adventure.jpg',
        tags: ['urban', 'adventure', 'solo'],
        highlights: ['2-4 noches', 'Hotel boutique', 'Tours guiados'],
        destinationCountry: 'Argentina',
        destinationCity: 'Buenos Aires',
        excuseKey: 'solo-adventure',
        hotels: [
          {
            name: 'Hotel Boutique Palermo',
            rating: 4.5,
            amenities: ['WiFi', 'Breakfast', 'Gym'],
          },
        ],
        activities: [
          {
            name: 'City Tour',
            duration: '4 horas',
            type: 'cultural',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in',
          day2: 'City tour completo',
          day3: 'Tiempo libre y salida',
        },
        inclusions: ['Hotel', 'Desayuno', 'Tours'],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas'],
        basePriceUsd: 450,
        displayPrice: 'USD 450',
        isActive: true,
        isFeatured: true,
      },
      {
        ownerId: createdTrippers[0].id,
        type: 'couple',
        level: 'exploraPlus',
        minNights: 3,
        maxNights: 5,
        minPax: 2,
        maxPax: 2,
        title: 'Romantic Getaway',
        teaser: 'Escape romántico para parejas',
        description:
          'Una experiencia íntima y romántica diseñada especialmente para parejas.',
        heroImage: '/images/romantic-getaway.jpg',
        tags: ['romantic', 'couple', 'luxury'],
        highlights: ['3-5 noches', 'Hotel 5 estrellas', 'Cenas románticas'],
        destinationCountry: 'México',
        destinationCity: 'Cancún',
        excuseKey: 'romantic-getaway',
        hotels: [
          {
            name: 'Resort All Inclusive',
            rating: 5.0,
            amenities: ['Spa', 'Beach', 'Pool', 'Restaurants'],
          },
        ],
        activities: [
          {
            name: 'Sunset Dinner',
            duration: '3 horas',
            type: 'romantic',
          },
        ],
        itinerary: {
          day1: 'Llegada y relax',
          day2: 'Actividades de pareja',
          day3: 'Cena romántica',
          day4: 'Tiempo libre',
          day5: 'Salida',
        },
        inclusions: ['Hotel', 'All inclusive', 'Spa'],
        exclusions: ['Vuelos', 'Excursiones opcionales'],
        basePriceUsd: 1200,
        displayPrice: 'USD 1,200',
        isActive: true,
        isFeatured: true,
      },
      // Alma packages
      {
        ownerId: createdTrippers[1].id,
        type: 'family',
        level: 'essenza',
        minNights: 4,
        maxNights: 7,
        minPax: 3,
        maxPax: 6,
        title: 'Aventura Familiar',
        teaser: 'Diversión para toda la familia',
        description:
          'Una experiencia diseñada para familias con niños de todas las edades.',
        heroImage: '/images/family-adventure.jpg',
        tags: ['family', 'kids', 'fun'],
        highlights: ['4-7 noches', 'Actividades para niños', 'Hotel familiar'],
        destinationCountry: 'España',
        destinationCity: 'Barcelona',
        hotels: [
          {
            name: 'Hotel Familiar Barcelona',
            rating: 4.0,
            amenities: ['Kids Club', 'Pool', 'Family Rooms'],
          },
        ],
        activities: [
          {
            name: 'Park Güell Tour',
            duration: '2 horas',
            type: 'family',
          },
        ],
        itinerary: {
          day1: 'Llegada familiar',
          day2: 'Tour familiar',
          day3: 'Actividades con niños',
          day4: 'Tiempo libre',
          day5: 'Salida',
        },
        inclusions: ['Hotel', 'Actividades familiares', 'Desayuno'],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas'],
        basePriceUsd: 800,
        displayPrice: 'USD 800',
        isActive: true,
        isFeatured: false,
      },
      {
        ownerId: createdTrippers[1].id,
        type: 'honeymoon',
        level: 'atelier-getaway',
        minNights: 5,
        maxNights: 10,
        minPax: 2,
        maxPax: 2,
        title: 'Luna de Miel de Lujo',
        teaser: 'La luna de miel perfecta',
        description:
          'Una experiencia de lujo diseñada especialmente para lunas de miel.',
        heroImage: '/images/honeymoon-luxury.jpg',
        tags: ['honeymoon', 'luxury', 'romantic'],
        highlights: ['5-10 noches', 'Resort 5 estrellas', 'Spa de lujo'],
        destinationCountry: 'Maldivas',
        destinationCity: 'Malé',
        hotels: [
          {
            name: 'Overwater Villa Resort',
            rating: 5.0,
            amenities: [
              'Overwater Villa',
              'Private Beach',
              'Spa',
              'Butler Service',
            ],
          },
        ],
        activities: [
          {
            name: 'Private Sunset Dinner',
            duration: '4 horas',
            type: 'romantic',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in lujo',
          day2: 'Relax y spa',
          day3: 'Actividades románticas',
          day4: 'Cena privada',
          day5: 'Tiempo libre',
          day6: 'Salida',
        },
        inclusions: ['Villa overwater', 'All inclusive', 'Spa', 'Butler'],
        exclusions: ['Vuelos', 'Excursiones premium'],
        basePriceUsd: 3500,
        displayPrice: 'USD 3,500',
        isActive: true,
        isFeatured: true,
      },
      // Dawson solo exploraPlus package for Mexico compatibility
      {
        ownerId: createdTrippers[0].id,
        type: 'solo',
        level: 'exploraPlus',
        minNights: 4,
        maxNights: 6,
        minPax: 1,
        maxPax: 1,
        title: 'Aventura Cultural en México',
        teaser: 'Descubre la rica cultura mexicana',
        description:
          'Una experiencia inmersiva en la cultura, gastronomía y tradiciones de México.',
        heroImage: '/images/mexico-culture.jpg',
        tags: ['cultural', 'gastronomy', 'history', 'solo'],
        highlights: [
          '4-6 noches',
          'Hotel boutique',
          'Tours culturales',
          'Gastronomía local',
        ],
        destinationCountry: 'México',
        destinationCity: 'Ciudad de México',
        excuseKey: 'culture-tradition',
        hotels: [
          {
            name: 'Hotel Boutique Centro Histórico',
            rating: 4.8,
            amenities: ['WiFi', 'Breakfast', 'Spa', 'Rooftop'],
          },
        ],
        activities: [
          {
            name: 'Tour Cultural Centro Histórico',
            duration: '6 horas',
            type: 'cultural',
          },
          {
            name: 'Experiencia Gastronómica',
            duration: '4 horas',
            type: 'food',
          },
          {
            name: 'Visita a Teotihuacán',
            duration: '8 horas',
            type: 'historical',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in en hotel boutique',
          day2: 'Tour cultural por el centro histórico',
          day3: 'Experiencia gastronómica y mercados locales',
          day4: 'Excursión a Teotihuacán',
          day5: 'Tiempo libre y actividades opcionales',
          day6: 'Desayuno y salida',
        },
        inclusions: [
          'Hotel boutique',
          'Desayunos',
          'Tours guiados',
          'Transporte local',
        ],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas', 'Actividades opcionales'],
        basePriceUsd: 950,
        displayPrice: 'USD 950',
        isActive: true,
        isFeatured: true,
      },
      // Additional Dawson packages for more excuse variety
      {
        ownerId: createdTrippers[0].id,
        type: 'solo',
        level: 'essenza',
        minNights: 2,
        maxNights: 3,
        minPax: 1,
        maxPax: 1,
        title: 'Exploración Urbana en Buenos Aires',
        teaser: 'Descubre los secretos de la ciudad porteña',
        description:
          'Una aventura urbana para conocer los rincones más auténticos de Buenos Aires.',
        heroImage: '/images/buenos-aires-urban.jpg',
        tags: ['urban', 'culture', 'solo'],
        highlights: ['2-3 noches', 'Hostel boutique', 'Tours locales'],
        destinationCountry: 'Argentina',
        destinationCity: 'Buenos Aires',
        excuseKey: 'solo-adventure',
        hotels: [
          {
            name: 'Hostel Boutique San Telmo',
            rating: 4.2,
            amenities: ['WiFi', 'Breakfast', 'Common Area'],
          },
        ],
        activities: [
          {
            name: 'Tour de Barrios',
            duration: '3 horas',
            type: 'cultural',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in',
          day2: 'Exploración de barrios',
          day3: 'Tiempo libre y salida',
        },
        inclusions: ['Hostel', 'Desayuno', 'Tours'],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas'],
        basePriceUsd: 320,
        displayPrice: 'USD 320',
        isActive: true,
        isFeatured: false,
      },
      {
        ownerId: createdTrippers[0].id,
        type: 'solo',
        level: 'exploraPlus',
        minNights: 5,
        maxNights: 7,
        minPax: 1,
        maxPax: 1,
        title: 'Aventura Natural en Patagonia',
        teaser: 'Conecta con la naturaleza en su estado más puro',
        description:
          'Una experiencia inmersiva en la naturaleza patagónica con actividades al aire libre.',
        heroImage: '/images/patagonia-nature.jpg',
        tags: ['nature', 'adventure', 'solo'],
        highlights: ['5-7 noches', 'Lodge ecológico', 'Actividades outdoor'],
        destinationCountry: 'Argentina',
        destinationCity: 'El Calafate',
        excuseKey: 'solo-adventure',
        hotels: [
          {
            name: 'Eco Lodge Patagonia',
            rating: 4.8,
            amenities: ['WiFi', 'Restaurant', 'Guided Tours'],
          },
        ],
        activities: [
          {
            name: 'Trekking Glaciar Perito Moreno',
            duration: '8 horas',
            type: 'adventure',
          },
          {
            name: 'Kayak en Lago Argentino',
            duration: '4 horas',
            type: 'water',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in',
          day2: 'Trekking glaciar',
          day3: 'Kayak en lago',
          day4: 'Día libre',
          day5: 'Excursión opcional',
          day6: 'Tiempo libre',
          day7: 'Salida',
        },
        inclusions: ['Lodge', 'Desayuno', 'Actividades', 'Guía'],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas'],
        basePriceUsd: 850,
        displayPrice: 'USD 850',
        isActive: true,
        isFeatured: true,
      },
      {
        ownerId: createdTrippers[0].id,
        type: 'couple',
        level: 'exploraPlus',
        minNights: 4,
        maxNights: 6,
        minPax: 2,
        maxPax: 2,
        title: 'Escape Romántico en Mendoza',
        teaser: 'Vinos, montañas y momentos únicos para dos',
        description:
          'Una experiencia romántica en la región vitivinícola más importante de Argentina.',
        heroImage: '/images/mendoza-romantic.jpg',
        tags: ['romantic', 'wine', 'couple'],
        highlights: ['4-6 noches', 'Hotel boutique', 'Degustaciones de vino'],
        destinationCountry: 'Argentina',
        destinationCity: 'Mendoza',
        excuseKey: 'romantic-getaway',
        hotels: [
          {
            name: 'Boutique Hotel Mendoza',
            rating: 4.7,
            amenities: ['Spa', 'Wine Cellar', 'Pool', 'Restaurant'],
          },
        ],
        activities: [
          {
            name: 'Tour de Bodegas',
            duration: '6 horas',
            type: 'wine',
          },
          {
            name: 'Cena Romántica',
            duration: '3 horas',
            type: 'dining',
          },
        ],
        itinerary: {
          day1: 'Llegada y check-in',
          day2: 'Tour de bodegas',
          day3: 'Día libre en hotel',
          day4: 'Cena romántica',
          day5: 'Tiempo libre',
          day6: 'Salida',
        },
        inclusions: ['Hotel boutique', 'Desayuno', 'Tours', 'Cena romántica'],
        exclusions: ['Vuelos', 'Almuerzos', 'Actividades opcionales'],
        basePriceUsd: 750,
        displayPrice: 'USD 750',
        isActive: true,
        isFeatured: true,
      },
      // Randomtrip packages (all types and levels)
      {
        ownerId: createdTrippers[2].id,
        type: 'solo',
        level: 'essenza',
        minNights: 2,
        maxNights: 4,
        minPax: 1,
        maxPax: 1,
        title: 'Aventura Random Solo',
        teaser: 'Descubre tu destino sorpresa',
        description: 'Una aventura sorpresa diseñada para viajeros solitarios.',
        heroImage: '/images/random-solo.jpg',
        tags: ['solo', 'surprise', 'adventure'],
        highlights: ['2-4 noches', 'Destino sorpresa', 'Hotel incluido'],
        destinationCountry: 'Colombia',
        destinationCity: 'Bogotá',
        hotels: [
          {
            name: 'Hotel Central',
            rating: 4.0,
            amenities: ['WiFi', 'Breakfast', 'Gym'],
          },
        ],
        activities: [
          {
            name: 'City Discovery',
            duration: '6 horas',
            type: 'cultural',
          },
        ],
        itinerary: {
          day1: 'Llegada y orientación',
          day2: 'Descubrimiento de la ciudad',
          day3: 'Tiempo libre',
          day4: 'Salida',
        },
        inclusions: ['Hotel', 'Tours', 'Desayuno'],
        exclusions: ['Vuelos', 'Almuerzos', 'Cenas'],
        basePriceUsd: 300,
        displayPrice: 'USD 300',
        isActive: true,
        isFeatured: true,
      },
    ];

    // Create packages
    for (const packageData of packages) {
      const pkg = await prisma.package.create({
        data: packageData,
      });
      console.log(
        `✅ Created package: ${pkg.title} (${pkg.type}/${pkg.level})`,
      );
    }

    // Create blog posts for Dawson (first tripper)
    console.log('\n📝 Creating blog posts for Dawson...');
    const dawson = createdTrippers[0];
    
    const blogPosts = [
      {
        authorId: dawson.id,
        title: 'Mi Primera Aventura en Buenos Aires',
        subtitle: 'Un viaje inolvidable por la Patagonia urbana',
        tagline: 'Descubre los secretos del sur argentino a través de mis ojos',
        coverUrl: '/images/placeholders/cover-1.jpg',
        blocks: [
          {
            type: 'paragraph',
            text: 'Hace unas semanas, tuve la oportunidad de explorar Buenos Aires de una manera completamente nueva. Como tripper, siempre busco esos lugares que no aparecen en las guías turísticas tradicionales.',
          },
          {
            type: 'image',
            url: '/images/placeholders/photo-1.jpg',
            caption: 'Atardecer en San Telmo',
          },
          {
            type: 'paragraph',
            text: 'La ciudad se revela poco a poco cuando caminas sin rumbo fijo. Los barrios de Palermo y San Telmo guardan tesoros que solo los locales conocen. Desde cafés escondidos hasta mercados callejeros llenos de vida.',
          },
          {
            type: 'quote',
            text: 'Viajar es vivir dos veces.',
            cite: 'Omar Khayyam',
          },
          {
            type: 'paragraph',
            text: 'En este viaje, descubrí que la mejor manera de conocer una ciudad es perderse en ella. Cada esquina tiene una historia, cada local tiene una recomendación secreta.',
          },
        ],
        tags: ['aventura', 'patagonia', 'buenos-aires', 'urban-exploration'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Mi Primera Aventura en Buenos Aires - Blog de Dawson',
          description: 'Descubre los secretos de Buenos Aires a través de la experiencia de un tripper experimentado',
          keywords: ['buenos aires', 'viajes', 'aventura', 'patagonia'],
        },
        publishedAt: new Date('2024-01-15'),
      },
      {
        authorId: dawson.id,
        title: 'Ruta del Café en Colombia',
        subtitle: 'Explorando los sabores de la tierra cafetera',
        tagline: 'Un recorrido por las fincas más auténticas del Eje Cafetero',
        coverUrl: '/images/placeholders/cover-2.jpg',
        blocks: [
          {
            type: 'paragraph',
            text: 'Colombia es sinónimo de café de calidad mundial. Pero más allá de la taza perfecta, hay toda una cultura alrededor de este grano que vale la pena explorar.',
          },
          {
            type: 'image',
            url: '/images/placeholders/photo-2.jpg',
            caption: 'Finca cafetera en el Eje Cafetero',
          },
          {
            type: 'paragraph',
            text: 'Durante mi viaje por el Eje Cafetero, visité varias fincas familiares donde aprendí sobre el proceso completo: desde la siembra hasta la taza. La pasión de los caficultores es contagiosa.',
          },
          {
            type: 'paragraph',
            text: 'Cada finca tiene su propia historia y método. Algunas mantienen técnicas tradicionales, otras combinan lo mejor de ambos mundos. Lo que todas tienen en común es el amor por el café.',
          },
        ],
        tags: ['cafe', 'colombia', 'gastronomia', 'eje-cafetero'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Ruta del Café en Colombia - Guía de Viaje',
          description: 'Descubre la ruta del café colombiano y las mejores fincas para visitar',
          keywords: ['colombia', 'cafe', 'gastronomia', 'turismo'],
        },
        publishedAt: new Date('2024-02-10'),
      },
      {
        authorId: dawson.id,
        title: 'Fotografía Urbana: Capturando la Esencia de las Ciudades',
        subtitle: 'Técnicas y consejos para fotografiar ciudades',
        tagline: 'La ciudad como lienzo',
        coverUrl: '/images/placeholders/cover-3.jpg',
        blocks: [
          {
            type: 'paragraph',
            text: 'La fotografía urbana es mi pasión. Cada ciudad tiene su propia personalidad, y capturarla es un arte que requiere práctica y paciencia.',
          },
          {
            type: 'image',
            url: '/images/placeholders/photo-3.jpg',
            caption: 'Calle de La Habana, Cuba',
          },
          {
            type: 'paragraph',
            text: 'En este post comparto algunas técnicas que he aprendido a lo largo de los años: desde la composición hasta el uso de la luz natural. La mejor hora para fotografiar ciudades es durante la hora dorada, justo después del amanecer o antes del atardecer.',
          },
          {
            type: 'paragraph',
            text: 'No todo se trata del equipo. A veces, la mejor cámara es la que tienes contigo. Lo importante es tener ojo para los detalles y la paciencia para esperar el momento perfecto.',
          },
        ],
        tags: ['fotografia', 'urban', 'tecnica', 'arte'],
        format: BlogFormat.PHOTO,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Fotografía Urbana: Guía Completa',
          description: 'Aprende técnicas de fotografía urbana con consejos de un experto',
          keywords: ['fotografia', 'urbana', 'tecnica', 'viajes'],
        },
        publishedAt: new Date('2024-03-05'),
      },
      {
        authorId: dawson.id,
        title: 'Los Mercados Locales: El Corazón de Cada Ciudad',
        subtitle: 'Descubriendo la gastronomía auténtica',
        tagline: 'Donde los locales compran, los viajeros descubren',
        coverUrl: '/images/placeholders/cover-4.jpg',
        blocks: [
          {
            type: 'paragraph',
            text: 'Los mercados locales son mi lugar favorito para entender una ciudad. No hay mejor manera de conocer la cultura gastronómica de un lugar que visitando sus mercados.',
          },
          {
            type: 'paragraph',
            text: 'Desde el Mercado de San Telmo en Buenos Aires hasta el Mercado de la Boqueria en Barcelona, cada mercado tiene su propia personalidad y productos únicos.',
          },
          {
            type: 'paragraph',
            text: 'En este artículo, comparto mis experiencias y recomendaciones para navegar los mercados locales como un experto. Aprende a identificar los mejores puestos, negociar precios y descubrir ingredientes únicos.',
          },
        ],
        tags: ['gastronomia', 'mercados', 'cultura-local', 'comida'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.DRAFT,
        seo: {
          title: 'Guía de Mercados Locales para Viajeros',
          description: 'Descubre los mejores mercados locales del mundo y cómo disfrutarlos',
          keywords: ['mercados', 'gastronomia', 'viajes', 'cultura'],
        },
      },
      {
        authorId: dawson.id,
        title: 'Aventuras Nocturnas: La Vida Nocturna de las Ciudades',
        subtitle: 'Explorando la ciudad después del atardecer',
        tagline: 'Cuando el sol se pone, la ciudad se transforma',
        coverUrl: '/images/placeholders/cover-5.jpg',
        blocks: [
          {
            type: 'paragraph',
            text: 'La noche transforma las ciudades. Los lugares que conoces de día se vuelven completamente diferentes cuando cae el sol. Esta es mi guía para explorar la vida nocturna de forma segura y auténtica.',
          },
          {
            type: 'paragraph',
            text: 'Desde bares escondidos hasta eventos culturales nocturnos, cada ciudad tiene su propia escena nocturna. Lo importante es saber dónde buscar y cómo moverse con seguridad.',
          },
        ],
        tags: ['noche', 'vida-nocturna', 'cultura', 'aventura'],
        format: BlogFormat.MIXED,
        status: BlogStatus.DRAFT,
        seo: {
          title: 'Guía de Vida Nocturna para Viajeros',
          description: 'Descubre la mejor vida nocturna de las ciudades que visitas',
          keywords: ['vida nocturna', 'bares', 'cultura', 'viajes'],
        },
      },
    ];

    for (const blogData of blogPosts) {
      const blog = await prisma.blogPost.create({
        data: blogData,
      });
      console.log(
        `✅ Created blog post: ${blog.title} (${blog.status})`,
      );
    }

    console.log('🎉 Successfully seeded trippers, packages, and blog posts!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTrippersAndPackages().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
