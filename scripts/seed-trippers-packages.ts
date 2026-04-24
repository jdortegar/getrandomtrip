import 'dotenv/config';
import { PrismaClient, BlogStatus, BlogFormat, type UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { slugify } from '../src/lib/helpers/slugify';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ['error'] } : { log: ['error'] }) as object,
);

const TRIPPER_MEMBERSHIP: UserRole[] = ['CLIENT', 'TRIPPER'];

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
        roles: TRIPPER_MEMBERSHIP,
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
        roles: TRIPPER_MEMBERSHIP,
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
        roles: TRIPPER_MEMBERSHIP,
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
      {
        email: 'david@randomtrip.com',
        name: 'David Ortega',
        password: tripperPassword,
        tripperSlug: 'david-ortega',
        commission: 0.12,
        availableTypes: ['solo', 'couple', 'family', 'group'],
        roles: TRIPPER_MEMBERSHIP,
        bio: 'Experiencias auténticas para viajeros que buscan aventura y cultura en América Latina y Europa.',
        heroImage: '/images/trippers/david-hero.jpg',
        location: 'Ciudad de México, México',
        tierLevel: 'pro',
        interests: ['aventura', 'cultura', 'gastronomía', 'naturaleza'],
        destinations: ['México', 'España', 'Argentina', 'Colombia'],
      },
      {
        email: 'sofia@randomtrip.com',
        name: 'Sofia',
        password: tripperPassword,
        tripperSlug: 'sofia',
        commission: 0.09,
        availableTypes: ['solo', 'couple', 'group'],
        roles: TRIPPER_MEMBERSHIP,
        bio: 'Urban explorer y especialista en ciudades. Ayudo a viajeros a descubrir rincones secretos y la cultura de grandes ciudades.',
        heroImage:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
        location: 'São Paulo, Brasil',
        motto:
          'Descubrir una ciudad es encontrarse a uno mismo en cada esquina.',
        specialization: 'Tripper especializada en experiencias urbanas',
        tierLevel: 'pro',
        interests: ['urbano', 'cultura', 'vida nocturna'],
        destinations: ['Brasil', 'Argentina', 'México', 'España'],
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
      // David Ortega packages (solo, couple, family, group)
      {
        ownerId: createdTrippers[3].id,
        type: 'solo',
        level: 'essenza',
        minNights: 2,
        maxNights: 5,
        minPax: 1,
        maxPax: 1,
        title: 'Aventura Solo con David',
        teaser: 'Experiencias auténticas para viajeros independientes',
        description:
          'Rutas diseñadas para quienes buscan aventura y autenticidad en destinos de América Latina y Europa.',
        heroImage: '/images/urban-adventure.jpg',
        tags: ['solo', 'adventure', 'culture'],
        highlights: [
          '2-5 noches',
          'Destinos auténticos',
          'Experiencias locales',
        ],
        destinationCountry: 'México',
        destinationCity: 'Ciudad de México',
        excuseKey: 'solo-adventure',
        hotels: [
          {
            name: 'Hotel Céntrico',
            rating: 4.5,
            amenities: ['WiFi', 'Breakfast'],
          },
        ],
        activities: [
          { name: 'Tour cultural', duration: '4 horas', type: 'cultural' },
        ],
        itinerary: { day1: 'Llegada', day2: 'Exploración', day3: 'Salida' },
        inclusions: ['Hotel', 'Desayuno', 'Tour'],
        exclusions: ['Vuelos', 'Almuerzos'],
        basePriceUsd: 420,
        displayPrice: 'USD 420',
        isActive: true,
        isFeatured: true,
      },
      {
        ownerId: createdTrippers[3].id,
        type: 'couple',
        level: 'exploraPlus',
        minNights: 3,
        maxNights: 6,
        minPax: 2,
        maxPax: 2,
        title: 'Escapada en Pareja',
        teaser: 'Experiencias románticas y memorables',
        description:
          'Viajes para parejas que buscan conexión y destinos con encanto.',
        heroImage: '/images/romantic-getaway.jpg',
        tags: ['couple', 'romantic', 'getaway'],
        highlights: [
          '3-6 noches',
          'Hoteles con encanto',
          'Experiencias en pareja',
        ],
        destinationCountry: 'España',
        destinationCity: 'Barcelona',
        excuseKey: 'romantic-getaway',
        hotels: [
          {
            name: 'Boutique Hotel',
            rating: 4.8,
            amenities: ['Spa', 'Restaurant'],
          },
        ],
        activities: [
          { name: 'Cena con vistas', duration: '3 horas', type: 'romantic' },
        ],
        itinerary: {
          day1: 'Check-in',
          day2: 'Ciudad',
          day3: 'Experiencia',
          day4: 'Salida',
        },
        inclusions: ['Hotel', 'Desayuno', 'Una cena'],
        exclusions: ['Vuelos'],
        basePriceUsd: 980,
        displayPrice: 'USD 980',
        isActive: true,
        isFeatured: true,
      },
      {
        ownerId: createdTrippers[3].id,
        type: 'family',
        level: 'essenza',
        minNights: 4,
        maxNights: 7,
        minPax: 3,
        maxPax: 6,
        title: 'Viaje en Familia',
        teaser: 'Aventuras para todas las edades',
        description:
          'Planes familiares que combinan cultura, naturaleza y diversión.',
        heroImage: '/images/family-adventure.jpg',
        tags: ['family', 'kids', 'nature'],
        highlights: [
          '4-7 noches',
          'Actividades para niños',
          'Alojamiento familiar',
        ],
        destinationCountry: 'Argentina',
        destinationCity: 'Buenos Aires',
        excuseKey: 'family-getaway',
        hotels: [
          {
            name: 'Family Resort',
            rating: 4.2,
            amenities: ['Pool', 'Kids club'],
          },
        ],
        activities: [
          { name: 'Día en familia', duration: '6 horas', type: 'family' },
        ],
        itinerary: {
          day1: 'Llegada',
          day2: 'Parque',
          day3: 'Museo',
          day4: 'Libre',
          day5: 'Salida',
        },
        inclusions: ['Hotel', 'Desayunos', 'Actividades familiares'],
        exclusions: ['Vuelos', 'Cenas'],
        basePriceUsd: 1100,
        displayPrice: 'USD 1,100',
        isActive: true,
        isFeatured: true,
      },
      {
        ownerId: createdTrippers[3].id,
        type: 'group',
        level: 'modo-explora',
        minNights: 3,
        maxNights: 5,
        minPax: 4,
        maxPax: 10,
        title: 'Aventura en Grupo',
        teaser: 'Experiencias compartidas con amigos',
        description:
          'Viajes diseñados para grupos que buscan aventura y buen ritmo.',
        heroImage: '/images/friends-group.jpg',
        tags: ['group', 'friends', 'adventure'],
        highlights: [
          '3-5 noches',
          'Alojamiento grupal',
          'Actividades en equipo',
        ],
        destinationCountry: 'Colombia',
        destinationCity: 'Cartagena',
        excuseKey: 'group-adventure',
        hotels: [
          {
            name: 'Hostal Grupo',
            rating: 4.0,
            amenities: ['Common areas', 'Tours'],
          },
        ],
        activities: [
          { name: 'Tour grupal', duration: '5 horas', type: 'adventure' },
        ],
        itinerary: {
          day1: 'Llegada',
          day2: 'Exploración',
          day3: 'Playa',
          day4: 'Salida',
        },
        inclusions: ['Alojamiento', 'Desayuno', 'Un tour'],
        exclusions: ['Vuelos', 'Resto de comidas'],
        basePriceUsd: 380,
        displayPrice: 'USD 380',
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

    // Mockup post with fixed id for /blog/cmly0imzt000bgg1gosc0dow9 (or slug aventura-acuatica)
    const mockupPostId = 'cmly0imzt000bgg1gosc0dow9';
    await prisma.blogPost.upsert({
      where: { id: mockupPostId },
      create: {
        id: mockupPostId,
        authorId: dawson.id,
        slug: 'aventura-acuatica',
        title: 'Aventura Acuática en el Caribe',
        subtitle: 'Buceo, snorkel y playas secretas en una semana',
        tagline: 'Guía práctica para tu primera escapada al mar',
        coverUrl:
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
        blocks: [
          {
            type: 'paragraph',
            text: 'El Caribe no es solo sol y playa: es buceo en arrecifes vivos, snorkel con tortugas y atardeceres que no se olvidan. En esta guía te cuento cómo armé mi primera semana acuática y qué me hubiera gustado saber antes.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
            caption: 'Snorkel en aguas cristalinas',
          },
          {
            type: 'paragraph',
            text: 'Elegí una base en la costa y desde ahí hice excursiones de un día. Así evité cambiar de alojamiento cada noche y pude repetir los spots que más me gustaron. La clave está en contratar lanchas locales y salir temprano.',
          },
          {
            type: 'quote',
            text: 'El mar nos devuelve lo que le damos: respeto y curiosidad.',
            cite: 'Jacques Cousteau',
          },
          {
            type: 'paragraph',
            text: 'Si es tu primera vez, invierte en un buen curso de snorkel o un bautismo de buceo. La diferencia entre ver peces desde la superficie y bajar unos metros es enorme. Yo lo hice el segundo día y no me arrepiento.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
            caption: 'Atardecer desde la playa',
          },
          {
            type: 'paragraph',
            text: 'Lleva protector solar biodegradable y no toques el coral. Con pequeños gestos mantenemos estos lugares para los que vienen después.',
          },
        ],
        tags: ['caribe', 'buceo', 'snorkel', 'playas', 'aventura'],
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Aventura Acuática en el Caribe - Guía práctica',
          description:
            'Buceo, snorkel y playas secretas: cómo planear tu primera semana en el Caribe',
          keywords: ['caribe', 'buceo', 'snorkel', 'playas', 'guía'],
        },
        publishedAt: new Date('2024-05-20'),
        faq: {
          items: [
            {
              question: '¿Hace falta saber nadar para hacer snorkel?',
              answer:
                'Sí, es recomendable sentirse cómodo en el agua. En muchas excursiones te dan chaleco y puedes flotar sin esfuerzo, pero saber nadar te da seguridad y te permite moverte mejor.',
            },
            {
              question: '¿Cuál es la mejor época para el Caribe?',
              answer:
                'Diciembre a abril suele tener menos lluvia y mar más tranquilo. De junio a noviembre es temporada de huracanes en la región; sigue el pronóstico si viajas en esas fechas.',
            },
            {
              question: '¿Necesito certificación para bucear?',
              answer:
                'Para un bautismo (inmersión guiada hasta ~12 m) no. Para inmersiones más profundas o repetidas, sí: el curso Open Water es el estándar y vale la pena.',
            },
          ],
        },
      },
      update: {
        slug: 'aventura-acuatica',
        title: 'Aventura Acuática en el Caribe',
        subtitle: 'Buceo, snorkel y playas secretas en una semana',
        tagline: 'Guía práctica para tu primera escapada al mar',
        coverUrl:
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
        blocks: [
          {
            type: 'paragraph',
            text: 'El Caribe no es solo sol y playa: es buceo en arrecifes vivos, snorkel con tortugas y atardeceres que no se olvidan. En esta guía te cuento cómo armé mi primera semana acuática y qué me hubiera gustado saber antes.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
            caption: 'Snorkel en aguas cristalinas',
          },
          {
            type: 'paragraph',
            text: 'Elegí una base en la costa y desde ahí hice excursiones de un día. Así evité cambiar de alojamiento cada noche y pude repetir los spots que más me gustaron. La clave está en contratar lanchas locales y salir temprano.',
          },
          {
            type: 'quote',
            text: 'El mar nos devuelve lo que le damos: respeto y curiosidad.',
            cite: 'Jacques Cousteau',
          },
          {
            type: 'paragraph',
            text: 'Si es tu primera vez, invierte en un buen curso de snorkel o un bautismo de buceo. La diferencia entre ver peces desde la superficie y bajar unos metros es enorme. Yo lo hice el segundo día y no me arrepiento.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
            caption: 'Atardecer desde la playa',
          },
          {
            type: 'paragraph',
            text: 'Lleva protector solar biodegradable y no toques el coral. Con pequeños gestos mantenemos estos lugares para los que vienen después.',
          },
        ],
        tags: ['caribe', 'buceo', 'snorkel', 'playas', 'aventura'],
        faq: {
          items: [
            {
              question: '¿Hace falta saber nadar para hacer snorkel?',
              answer:
                'Sí, es recomendable sentirse cómodo en el agua. En muchas excursiones te dan chaleco y puedes flotar sin esfuerzo, pero saber nadar te da seguridad y te permite moverte mejor.',
            },
            {
              question: '¿Cuál es la mejor época para el Caribe?',
              answer:
                'Diciembre a abril suele tener menos lluvia y mar más tranquilo. De junio a noviembre es temporada de huracanes en la región; sigue el pronóstico si viajas en esas fechas.',
            },
            {
              question: '¿Necesito certificación para bucear?',
              answer:
                'Para un bautismo (inmersión guiada hasta ~12 m) no. Para inmersiones más profundas o repetidas, sí: el curso Open Water es el estándar y vale la pena.',
            },
          ],
        },
        publishedAt: new Date('2024-05-20'),
        status: BlogStatus.PUBLISHED,
      },
    });
    console.log(`✅ Upserted mockup blog post: Aventura Acuática (${mockupPostId})`);

    const blogPosts = [
      {
        authorId: dawson.id,
        title: 'Mi Primera Aventura en Buenos Aires',
        subtitle: 'Un viaje inolvidable por la Patagonia urbana',
        tagline: 'Descubre los secretos del sur argentino a través de mis ojos',
        coverUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80',
        blocks: [
          {
            type: 'paragraph',
            text: 'Hace unas semanas, tuve la oportunidad de explorar Buenos Aires de una manera completamente nueva. Como tripper, siempre busco esos lugares que no aparecen en las guías turísticas tradicionales.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1480714374509-5c2c2c0e0c0e?w=800&q=80',
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
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Mi Primera Aventura en Buenos Aires - Blog de Dawson',
          description:
            'Descubre los secretos de Buenos Aires a través de la experiencia de un tripper experimentado',
          keywords: ['buenos aires', 'viajes', 'aventura', 'patagonia'],
        },
        publishedAt: new Date('2024-01-15'),
        faq: {
          items: [
            {
              question: '¿Cuántos días recomiendas para Buenos Aires?',
              answer:
                'Mínimo 3–4 días para ver lo esencial. Si quieres sumar barrios y día en Tigre o Colonia, una semana está bien.',
            },
            {
              question: '¿Es seguro caminar de noche por San Telmo?',
              answer:
                'Sí, las zonas turísticas suelen estar bien. Como en cualquier ciudad grande, evita zonas vacías y ten cuidado con los objetos de valor.',
            },
          ],
        },
      },
      {
        authorId: dawson.id,
        title: 'Ruta del Café en Colombia',
        subtitle: 'Explorando los sabores de la tierra cafetera',
        tagline: 'Un recorrido por las fincas más auténticas del Eje Cafetero',
        coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
        blocks: [
          {
            type: 'paragraph',
            text: 'Colombia es sinónimo de café de calidad mundial. Pero más allá de la taza perfecta, hay toda una cultura alrededor de este grano que vale la pena explorar.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
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
        travelType: 'solo',
        excuseKey: 'cultural-immersion',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Ruta del Café en Colombia - Guía de Viaje',
          description:
            'Descubre la ruta del café colombiano y las mejores fincas para visitar',
          keywords: ['colombia', 'cafe', 'gastronomia', 'turismo'],
        },
        publishedAt: new Date('2024-02-10'),
        faq: {
          items: [
            {
              question: '¿Cuál es la mejor época para visitar el Eje Cafetero?',
              answer:
                'Entre diciembre y marzo, y julio y agosto, suele hacer mejor clima. La cosecha principal es de octubre a diciembre.',
            },
            {
              question: '¿Hay que reservar las visitas a las fincas?',
              answer:
                'Sí, sobre todo en temporada alta. Muchas fincas ofrecen tour + degustación con reserva previa.',
            },
          ],
        },
      },
      {
        authorId: dawson.id,
        title: 'Fotografía Urbana: Capturando la Esencia de las Ciudades',
        subtitle: 'Técnicas y consejos para fotografiar ciudades',
        tagline: 'La ciudad como lienzo',
        coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80',
        blocks: [
          {
            type: 'paragraph',
            text: 'La fotografía urbana es mi pasión. Cada ciudad tiene su propia personalidad, y capturarla es un arte que requiere práctica y paciencia.',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1515041219749-89347f832391?w=800&q=80',
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
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.PHOTO,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Fotografía Urbana: Guía Completa',
          description:
            'Aprende técnicas de fotografía urbana con consejos de un experto',
          keywords: ['fotografia', 'urbana', 'tecnica', 'viajes'],
        },
        publishedAt: new Date('2024-03-05'),
      },
      {
        authorId: dawson.id,
        title: 'Los Mercados Locales: El Corazón de Cada Ciudad',
        subtitle: 'Descubriendo la gastronomía auténtica',
        tagline: 'Donde los locales compran, los viajeros descubren',
        coverUrl: 'https://images.unsplash.com/photo-1488459716781-31db59582ba4?w=1200&q=80',
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
        travelType: 'couple',
        excuseKey: 'cultural-immersion',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.DRAFT,
        seo: {
          title: 'Guía de Mercados Locales para Viajeros',
          description:
            'Descubre los mejores mercados locales del mundo y cómo disfrutarlos',
          keywords: ['mercados', 'gastronomia', 'viajes', 'cultura'],
        },
      },
      {
        authorId: dawson.id,
        title: 'Aventuras Nocturnas: La Vida Nocturna de las Ciudades',
        subtitle: 'Explorando la ciudad después del atardecer',
        tagline: 'Cuando el sol se pone, la ciudad se transforma',
        coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80',
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
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.MIXED,
        status: BlogStatus.DRAFT,
        seo: {
          title: 'Guía de Vida Nocturna para Viajeros',
          description:
            'Descubre la mejor vida nocturna de las ciudades que visitas',
          keywords: ['vida nocturna', 'bares', 'cultura', 'viajes'],
        },
      },
    ];

    for (const blogData of blogPosts) {
      const baseSlug = slugify(blogData.title) || 'post';
      let slug = baseSlug;
      let suffix = 0;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const blog = await prisma.blogPost.create({
        data: { ...blogData, slug },
      });
      console.log(`✅ Created blog post: ${blog.title} (${blog.status})`);
    }

    // Blog posts for Alma (second tripper)
    const alma = createdTrippers[1];
    const almaBlogPosts = [
      {
        authorId: alma.id,
        title: 'Viajes en Familia: Creando Recuerdos que Duran',
        subtitle: 'Consejos para planificar la mejor aventura familiar',
        tagline: 'La familia que viaja junta, crece junta',
        coverUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
        travelType: 'family',
        excuseKey: 'family-adventure',
        blocks: [
          {
            type: 'paragraph',
            text: 'Después de años diseñando viajes para familias, he aprendido que el secreto está en el equilibrio: actividades para todos los gustos y edades, y momentos de calma para reconectar.',
          },
          {
            type: 'paragraph',
            text: 'España e Italia son destinos increíbles para familias. Playas seguras, cultura accesible y gastronomía que encanta a pequeños y mayores.',
          },
        ],
        tags: ['familia', 'espana', 'italia', 'consejos'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Viajes en Familia - Blog de Alma',
          description: 'Consejos y destinos para viajar en familia',
          keywords: ['familia', 'viajes', 'espana', 'italia'],
        },
        publishedAt: new Date('2024-03-01'),
      },
      {
        authorId: alma.id,
        title: 'Lunas de Miel Sostenibles',
        subtitle: 'Cómo disfrutar del viaje de tus sueños con conciencia',
        tagline: 'Romance con propósito',
        coverUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
        travelType: 'honeymoon',
        excuseKey: 'romantic-getaway',
        blocks: [
          {
            type: 'paragraph',
            text: 'Una luna de miel memorable no tiene que costarle al planeta. Te comparto destinos y prácticas que hacen la diferencia.',
          },
        ],
        tags: ['luna-de-miel', 'sostenibilidad', 'pareja'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Lunas de Miel Sostenibles - Blog de Alma',
          description: 'Ideas para una luna de miel responsable',
          keywords: ['luna de miel', 'sostenible', 'viajes'],
        },
        publishedAt: new Date('2024-04-12'),
      },
    ];

    console.log('\n📝 Creating blog posts for Alma...');
    for (const blogData of almaBlogPosts) {
      const baseSlug = slugify(blogData.title) || 'post';
      let slug = baseSlug;
      let suffix = 0;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const blog = await prisma.blogPost.create({
        data: { ...blogData, slug },
      });
      console.log(`✅ Created blog post: ${blog.title} (${blog.status})`);
    }

    // Blog posts for Randomtrip (third tripper)
    const randomtrip = createdTrippers[2];
    const randomtripBlogPosts = [
      {
        authorId: randomtrip.id,
        title: 'El Arte del Viaje Sorpresa',
        subtitle: 'Por qué dejar que el destino te elija a ti',
        tagline: 'Menos planificación, más descubrimiento',
        coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        blocks: [
          {
            type: 'paragraph',
            text: 'En Randomtrip creemos que la magia del viaje está en la sorpresa. Nuestros trippers diseñan experiencias únicas que se revelan en el momento justo.',
          },
          {
            type: 'paragraph',
            text: 'Desde aventuras urbanas hasta escapadas en la naturaleza, cada viaje es una historia por escribir.',
          },
        ],
        tags: ['sorpresa', 'randomtrip', 'inspiracion'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'El Arte del Viaje Sorpresa - Randomtrip',
          description: 'Descubre la filosofía detrás del viaje sorpresa',
          keywords: ['viaje sorpresa', 'randomtrip', 'aventura'],
        },
        publishedAt: new Date('2024-05-01'),
      },
    ];

    console.log('\n📝 Creating blog posts for Randomtrip...');
    for (const blogData of randomtripBlogPosts) {
      const baseSlug = slugify(blogData.title) || 'post';
      let slug = baseSlug;
      let suffix = 0;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const blog = await prisma.blogPost.create({
        data: { ...blogData, slug },
      });
      console.log(`✅ Created blog post: ${blog.title} (${blog.status})`);
    }

    // Blog posts for David Ortega (fourth tripper)
    const david = createdTrippers[3];
    const davidBlogPosts = [
      {
        authorId: david.id,
        title: 'Aventura Solo en Ciudad de México',
        subtitle: 'Rutas auténticas para viajeros independientes',
        tagline: 'La capital que no te esperas',
        coverUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80',
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ciudad de México es un laberinto de barrios, sabores y historias. Te comparto rutas que he diseñado para quienes viajan solos y buscan autenticidad.',
          },
        ],
        tags: ['cdmx', 'solo', 'aventura', 'cultura'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Aventura Solo en CDMX - David Ortega',
          description: 'Rutas y consejos para viajar solo en Ciudad de México',
          keywords: ['cdmx', 'solo', 'viajes', 'méxico'],
        },
        publishedAt: new Date('2024-06-01'),
      },
      {
        authorId: david.id,
        title: 'Escapada en Pareja por España',
        subtitle: 'Destinos románticos más allá de lo obvio',
        tagline: 'Menos turismo, más conexión',
        coverUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
        travelType: 'couple',
        excuseKey: 'romantic-getaway',
        blocks: [
          {
            type: 'paragraph',
            text: 'España tiene rincones ideales para parejas que buscan calma y buena mesa. Te cuento mis favoritos fuera de las guías clásicas.',
          },
        ],
        tags: ['pareja', 'espana', 'romantico'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Escapada en Pareja España - David Ortega',
          description: 'Ideas para una escapada en pareja por España',
          keywords: ['pareja', 'espana', 'viajes'],
        },
        publishedAt: new Date('2024-07-15'),
      },
    ];

    console.log('\n📝 Creating blog posts for David Ortega...');
    for (const blogData of davidBlogPosts) {
      const baseSlug = slugify(blogData.title) || 'post';
      let slug = baseSlug;
      let suffix = 0;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const blog = await prisma.blogPost.create({
        data: { ...blogData, slug },
      });
      console.log(`✅ Created blog post: ${blog.title} (${blog.status})`);
    }

    // Sofia: 3 posts with text-only rich content
    const sofia = createdTrippers[4];
    const sofiaBlogPosts = [
      {
        authorId: sofia.id,
        title: 'Mi primer sorpresa en la nieve',
        subtitle: 'Cuando el invierno se convierte en aventura',
        tagline: 'Una experiencia que no olvidaré',
        coverUrl:
          'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=1200&q=80',
        content: `<p>Nunca había visto tanta nieve junta. El paisaje blanco, el silencio y la sensación de estar en otro mundo me marcaron para siempre. En este post quiero compartir cómo fue mi primera vez en la montaña en temporada invernal.</p><p>La clave fue ir bien equipado y con una actitud de descubrimiento. Cada paso sobre la nieve era una pequeña aventura. Al final del día, una taza de chocolate caliente frente a la ventana con vista a los picos fue el broche de oro.</p>`,
        blocks: [],
        tags: ['invierno', 'nieve', 'aventura', 'naturaleza'],
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Mi primer sorpresa en la nieve - Sofia',
          description: 'Mi primera experiencia en la nieve y en la montaña',
          keywords: ['nieve', 'invierno', 'aventura', 'montaña'],
        },
        publishedAt: new Date('2024-08-01'),
      },
      {
        authorId: sofia.id,
        title: 'Viajar Solo: La Mejor Decisión Que Podés Tomar',
        subtitle: 'Reflexiones sobre viajar en solitario',
        tagline: 'Libertad, introspección y nuevos amigos',
        coverUrl:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
        content: `<p>Viajar sola me enseñó más sobre mí misma que cualquier otro año de mi vida. Al principio daba miedo; después se volvió adictivo. La libertad de elegir cada paso, cada restaurante, cada ruta sin tener que negociar con nadie es una sensación que recomiendo a todo el mundo probar al menos una vez.</p><p>Lo que más me sorprendió fue la cantidad de gente que conocés cuando vas sola. La gente se acerca más, te invitan a la mesa, te cuentan historias. Si estás dudando, mi consejo es: empezá por un viaje corto y cercano. El resto viene solo.</p>`,
        blocks: [],
        tags: ['solo', 'libertad', 'reflexión', 'viajes'],
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Viajar Solo: La Mejor Decisión - Sofia',
          description: 'Por qué viajar en solitario puede ser la mejor decisión',
          keywords: ['viajar solo', 'solo', 'aventura', 'libertad'],
        },
        publishedAt: new Date('2024-08-15'),
      },
      {
        authorId: sofia.id,
        title: 'Ciudades que no duermen: noches en São Paulo',
        subtitle: 'Guía rápida para disfrutar la noche paulista',
        tagline: 'Bares, música y encuentros inolvidables',
        coverUrl:
          'https://images.unsplash.com/photo-1544980912-4f582ef6d23a?w=1200&q=80',
        content: `<p>São Paulo es una ciudad que cobra vida cuando el sol se esconde. Los bares se llenan, la música suena en cada esquina y la energía es única. En este post te cuento mis rincones favoritos para vivir la noche paulista sin gastar una fortuna.</p><p>Desde bares con vista hasta fiestas en galerías de arte, la oferta es infinita. Lo importante es ir con ganas de caminar, de hablar con desconocidos y de dejarse llevar. La noche en São Paulo te devuelve lo que vos le das.</p>`,
        blocks: [],
        tags: ['sao-paulo', 'noche', 'bares', 'cultura'],
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        seo: {
          title: 'Ciudades que no duermen: São Paulo - Sofia',
          description: 'Guía para disfrutar la noche en São Paulo',
          keywords: ['são paulo', 'noche', 'bares', 'viajes'],
        },
        publishedAt: new Date('2024-09-01'),
      },
    ];

    console.log('\n📝 Creating blog posts for Sofia...');
    for (const blogData of sofiaBlogPosts) {
      const baseSlug = slugify(blogData.title) || 'post';
      let slug = baseSlug;
      let suffix = 0;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const blog = await prisma.blogPost.create({
        data: { ...blogData, slug },
      });
      console.log(`✅ Created blog post: ${blog.title} (${blog.status})`);
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
