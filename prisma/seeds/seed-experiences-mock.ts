import 'dotenv/config';
import type { ExperienceStatus } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';

const HERO = '/images/drops/drops-mendoza.jpg';

interface MockExperience {
  slug: string;
  type: string;
  level?: string;
  status: ExperienceStatus;
  title: string;
  teaser: string;
  description: string;
  destinationCity: string;
  destinationCountry: string;
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;
  basePrice: number;
  displayPrice?: string;
  heroImage?: string;
  accommodationType?: string;
  transport?: string;
  climate?: string;
  maxTravelTime?: string;
  // XSED only
  titleInternal?: string;
  tripDate?: string;
  revealAt?: string;
  minSpots?: number;
  maxSpots?: number;
  currency?: string;
}

const MOCK_EXPERIENCES: MockExperience[] = [
  // COUPLE
  {
    slug: 'couple-toscana-esencial',
    type: 'couple',
    level: 'essenza',
    status: 'ACTIVE',
    title: 'Toscana Esencial',
    teaser: 'Colinas verdes, viñedos y una escapada romántica sin itinerario fijo.',
    description: '<p>Un fin de semana para dos en pleno corazón de la Toscana. Alojamiento boutique, cena privada y paseo entre viñedos.</p>',
    destinationCity: 'Siena',
    destinationCountry: 'Italia',
    minNights: 2,
    maxNights: 2,
    minPax: 2,
    maxPax: 2,
    basePrice: 420,
    displayPrice: 'USD 420 por persona',
    accommodationType: 'hotel-style',
    transport: 'plane',
    climate: 'mild',
    maxTravelTime: 'no-limit',
  },
  {
    slug: 'couple-lisboa-modo-explora',
    type: 'couple',
    level: 'modo-explora',
    status: 'ACTIVE',
    title: 'Lisboa en Modo Explora',
    teaser: 'Calles empedradas, fado al atardecer y el mejor pastel de nata de tu vida.',
    description: '<p>Tres noches en Lisboa con experiencias locales seleccionadas para parejas curiosas. Sin guías turísticos, solo la ciudad.</p>',
    destinationCity: 'Lisboa',
    destinationCountry: 'Portugal',
    minNights: 3,
    maxNights: 3,
    minPax: 2,
    maxPax: 2,
    basePrice: 380,
    displayPrice: 'USD 380 por persona',
    accommodationType: 'home-style',
    transport: 'plane',
    climate: 'mild',
    maxTravelTime: 'no-limit',
  },

  // FAMILY
  {
    slug: 'family-patagonia-kin',
    type: 'family',
    level: 'explora-plus',
    status: 'ACTIVE',
    title: 'Patagonia KIN',
    teaser: 'Aventura familiar en el fin del mundo: glaciares, lagos y senderos para todos.',
    description: '<p>Cuatro noches en la Patagonia argentina diseñadas para familias con niños. Actividades al aire libre con guías especializados.</p>',
    destinationCity: 'El Calafate',
    destinationCountry: 'Argentina',
    minNights: 4,
    maxNights: 5,
    minPax: 3,
    maxPax: 6,
    basePrice: 310,
    displayPrice: 'USD 310 por persona',
    accommodationType: 'nature-escape',
    transport: 'plane',
    climate: 'cold',
    maxTravelTime: 'no-limit',
  },

  // GROUP
  {
    slug: 'group-cartagena-crew',
    type: 'group',
    level: 'modo-explora',
    status: 'ACTIVE',
    title: 'Cartagena CREW',
    teaser: 'Ciudad amurallada, playas caribeñas y una semana de experiencias grupales únicas.',
    description: '<p>Siete días en Cartagena de Indias para grupos de amigos. Alojamiento en casa colonial, tour gastronómico y día de playa en Islas del Rosario.</p>',
    destinationCity: 'Cartagena',
    destinationCountry: 'Colombia',
    minNights: 5,
    maxNights: 7,
    minPax: 4,
    maxPax: 12,
    basePrice: 290,
    displayPrice: 'USD 290 por persona',
    accommodationType: 'home-style',
    transport: 'plane',
    climate: 'warm',
    maxTravelTime: 'no-limit',
  },
  {
    slug: 'group-mendoza-crew-bivouac',
    type: 'group',
    level: 'bivouac',
    status: 'DRAFT',
    title: 'Mendoza Crew Bivouac',
    teaser: 'Entre montañas y bodegas: una experiencia premium para grupos exigentes.',
    description: '<p>Cinco noches en Mendoza con catas privadas, trekking en Los Andes y gastronomía de autor para grupos de hasta 8 personas.</p>',
    destinationCity: 'Mendoza',
    destinationCountry: 'Argentina',
    minNights: 4,
    maxNights: 5,
    minPax: 4,
    maxPax: 8,
    basePrice: 480,
    displayPrice: 'USD 480 por persona',
    accommodationType: 'nature-escape',
    transport: 'plane',
    climate: 'mild',
    maxTravelTime: 'no-limit',
  },

  // SOLO
  {
    slug: 'solo-tokyo-solum',
    type: 'solo',
    level: 'explora-plus',
    status: 'ACTIVE',
    title: 'Tokio SOLUM',
    teaser: 'Una semana en Tokio diseñada para viajeros solitarios que quieren ir más allá del turismo.',
    description: '<p>Siete días en Tokio con acceso a experiencias locales auténticas: talleres de soba, onsen privado y tour de izakayas fuera de los circuitos turísticos.</p>',
    destinationCity: 'Tokio',
    destinationCountry: 'Japón',
    minNights: 6,
    maxNights: 7,
    minPax: 1,
    maxPax: 1,
    basePrice: 550,
    displayPrice: 'USD 550 por persona',
    accommodationType: 'hotel-style',
    transport: 'plane',
    climate: 'mild',
    maxTravelTime: 'no-limit',
  },
  {
    slug: 'solo-oaxaca-solum-essenza',
    type: 'solo',
    level: 'essenza',
    status: 'ACTIVE',
    title: 'Oaxaca SOLUM Essenza',
    teaser: 'Arte, mezcal y cocina ancestral para el viajero solitario que busca autenticidad.',
    description: '<p>Dos noches en Oaxaca con cena en mercado local, visita a un taller de barro negro y clase de cocina tradicional.</p>',
    destinationCity: 'Oaxaca',
    destinationCountry: 'México',
    minNights: 2,
    maxNights: 2,
    minPax: 1,
    maxPax: 1,
    basePrice: 195,
    displayPrice: 'USD 195 por persona',
    accommodationType: 'home-style',
    transport: 'plane',
    climate: 'warm',
    maxTravelTime: 'no-limit',
  },

  // HONEYMOON
  {
    slug: 'honeymoon-maldivas-nuptia',
    type: 'honeymoon',
    level: 'atelier-getaway',
    status: 'ACTIVE',
    title: 'Maldivas NUPTIA Atelier',
    teaser: 'Una luna de miel sin igual: villa sobre el agua, buceo y cena privada al atardecer.',
    description: '<p>Siete noches en Maldivas en villa overwater con desayuno incluido, snorkel privado en arrecife de coral y masaje de parejas en la playa.</p>',
    destinationCity: 'Malé',
    destinationCountry: 'Maldivas',
    minNights: 6,
    maxNights: 8,
    minPax: 2,
    maxPax: 2,
    basePrice: 1800,
    displayPrice: 'USD 1800 por persona',
    accommodationType: 'nature-escape',
    transport: 'plane',
    climate: 'warm',
    maxTravelTime: 'no-limit',
  },
  {
    slug: 'honeymoon-toscana-nuptia',
    type: 'honeymoon',
    level: 'bivouac',
    status: 'ACTIVE',
    title: 'Toscana NUPTIA Bivouac',
    teaser: 'Castillos medievales, olivos milenarios y una boda privada en viñedo.',
    description: '<p>Cinco noches en la campiña toscana: alojamiento en castillo restaurado, cena de bienvenida con sommelier y paseo en globo al amanecer.</p>',
    destinationCity: 'Florencia',
    destinationCountry: 'Italia',
    minNights: 4,
    maxNights: 5,
    minPax: 2,
    maxPax: 2,
    basePrice: 920,
    displayPrice: 'USD 920 por persona',
    accommodationType: 'hotel-style',
    transport: 'plane',
    climate: 'mild',
    maxTravelTime: 'no-limit',
  },

  // PAWS
  {
    slug: 'paws-camino-sur-patagonia',
    type: 'paws',
    level: 'modo-explora',
    status: 'ACTIVE',
    title: 'Sur Patagónico PAWS',
    teaser: 'Trekking, lagos y montañas para vos y tu mejor compañero de cuatro patas.',
    description: '<p>Tres noches en la Patagonia con alojamiento pet-friendly, senderismo con perros permitido y guía especializado en viajes con mascotas.</p>',
    destinationCity: 'Bariloche',
    destinationCountry: 'Argentina',
    minNights: 3,
    maxNights: 4,
    minPax: 1,
    maxPax: 4,
    basePrice: 340,
    displayPrice: 'USD 340 por persona',
    accommodationType: 'nature-escape',
    transport: 'plane',
    climate: 'cold',
    maxTravelTime: 'no-limit',
  },
  {
    slug: 'paws-amsterdam-essenza',
    type: 'paws',
    level: 'essenza',
    status: 'DRAFT',
    title: 'Amsterdam PAWS Essenza',
    teaser: 'Canales, cafés dog-friendly y una ciudad que ama a los perros tanto como vos.',
    description: '<p>Dos noches en Amsterdam con alojamiento que admite mascotas, city bike tour dog-friendly y cena en restaurante pet-welcome.</p>',
    destinationCity: 'Ámsterdam',
    destinationCountry: 'Países Bajos',
    minNights: 2,
    maxNights: 2,
    minPax: 1,
    maxPax: 3,
    basePrice: 310,
    displayPrice: 'USD 310 por persona',
    accommodationType: 'home-style',
    transport: 'plane',
    climate: 'cold',
    maxTravelTime: 'no-limit',
  },

  // XSED DROPS — slugs must be numeric for parseDropNumber()
  {
    slug: '10',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Salta bajo las estrellas — Drop #10',
    titleInternal: 'Salta bajo las estrellas — Drop #10',
    teaser: 'Salta bajo las estrellas',
    heroImage: '/images/bitacoras/argentina.jpg',
    description: '',
    destinationCity: 'Salta',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-11-15T03:00:00.000Z',
    revealAt: '2026-11-13T21:00:00.000Z',
  },
  {
    slug: '9',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Córdoba sin mapa — Drop #9',
    titleInternal: 'Córdoba sin mapa — Drop #9',
    teaser: 'Córdoba sin mapa',
    heroImage: '/images/bg/1.jpg',
    description: '',
    destinationCity: 'Córdoba',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-10-18T03:00:00.000Z',
    revealAt: '2026-10-16T21:00:00.000Z',
  },
  {
    slug: '8',
    type: 'XSED',
    status: 'ARCHIVED',
    title: 'Mar del Plata off-season — Drop #8',
    titleInternal: 'Mar del Plata off-season — Drop #8',
    teaser: 'Mar del Plata off-season',
    heroImage: '/images/bg/2.jpg',
    description: '',
    destinationCity: 'Mar del Plata',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 220,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2025-09-06T03:00:00.000Z',
  },
  {
    slug: '7',
    type: 'XSED',
    status: 'INACTIVE',
    title: 'Bariloche nevado — Drop #7',
    titleInternal: 'Bariloche nevado — Drop #7',
    teaser: 'Bariloche nevado',
    heroImage: '/images/bitacoras/chile.jpg',
    description: '',
    destinationCity: 'Bariloche',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 280,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-08-22T03:00:00.000Z',
  },
  {
    slug: '6',
    type: 'XSED',
    status: 'ARCHIVED',
    title: 'Iguazú selva — Drop #6',
    titleInternal: 'Iguazú selva — Drop #6',
    teaser: 'Iguazú selva',
    heroImage: '/images/bitacoras/colombia.jpg',
    description: '',
    destinationCity: 'Puerto Iguazú',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 260,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-07-25T03:00:00.000Z',
  },
  {
    slug: '5',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Mendoza desde arriba — Drop #5',
    titleInternal: 'Mendoza desde arriba — Drop #5',
    teaser: 'Mendoza desde arriba',
    heroImage: '/images/drops/drops-mendoza.jpg',
    description: '',
    destinationCity: 'Mendoza',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-02-20T03:00:00.000Z',
    revealAt: '2026-02-18T21:00:00.000Z',
  },
  {
    slug: '4',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Formosa tiene un secreto — Drop #4',
    titleInternal: 'Formosa tiene un secreto — Drop #4',
    teaser: 'Formosa tiene un secreto',
    heroImage: '/images/bitacoras/peru.jpg',
    description: '',
    destinationCity: 'Formosa',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-03-20T03:00:00.000Z',
    revealAt: '2026-03-18T21:00:00.000Z',
  },
  {
    slug: '3',
    type: 'XSED',
    status: 'INACTIVE',
    title: 'Tucumán star night — Drop #3',
    titleInternal: 'Tucumán star night — Drop #3',
    teaser: 'Tucumán star night',
    heroImage: '/images/bitacoras/bolivia.jpg',
    description: '',
    destinationCity: 'Tucumán',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-01-02T03:00:00.000Z',
  },
  {
    slug: '2',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Formosa tiene un secreto — Drop #2',
    titleInternal: 'Formosa tiene un secreto — Drop #2',
    teaser: 'Formosa tiene un secreto',
    heroImage: '/images/bitacoras/mexico.jpg',
    description: '',
    destinationCity: 'Formosa',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-03-20T03:00:00.000Z',
    revealAt: '2026-03-18T21:00:00.000Z',
  },
  {
    slug: '1',
    type: 'XSED',
    status: 'ACTIVE',
    title: 'Tucumán star night — Drop #1',
    titleInternal: 'Tucumán star night — Drop #1',
    teaser: 'Tucumán star night',
    heroImage: '/images/bg/3.jpg',
    description: '',
    destinationCity: 'Tucumán',
    destinationCountry: 'Argentina',
    minNights: 1,
    maxNights: 1,
    minPax: 1,
    maxPax: 10,
    basePrice: 250,
    currency: 'USD',
    minSpots: 2,
    maxSpots: 10,
    tripDate: '2026-06-20T03:00:00.000Z',
    revealAt: '2026-06-18T21:00:00.000Z',
  },
];

type BenefitType = 'ACCOMMODATION' | 'DINNER' | 'ACTIVITY';

function makeBenefits(city: string) {
  const pillars: Array<{ type: BenefitType; sortOrder: number; name: string }> = [
    { type: 'ACCOMMODATION', sortOrder: 0, name: 'El Hotel' },
    { type: 'DINNER', sortOrder: 1, name: 'La Cena' },
    { type: 'ACTIVITY', sortOrder: 2, name: 'La Experiencia' },
  ];

  return pillars.map((p) => ({
    id: `${city.toLowerCase().replace(/\s+/g, '-')}-${p.type.toLowerCase()}`,
    type: p.type,
    sortOrder: p.sortOrder,
    name: p.name,
    providerName: p.type === 'ACCOMMODATION' ? `Hotel mock ${city}` : null,
    address: null,
    city,
    state: null,
    googleMapsUrl: null,
    customerVisibleNotes: `<p>Contenido mock para ${p.name} en ${city}.</p>`,
    internalNotes: null,
    confirmationStatus: 'PENDING' as const,
    reservationCode: null,
    photos: [
      { id: `${p.type.toLowerCase()}-photo-1`, url: HERO, altText: `${p.name} — foto 1`, type: 'gallery', sortOrder: 0 },
      { id: `${p.type.toLowerCase()}-photo-2`, url: HERO, altText: `${p.name} — foto 2`, type: 'gallery', sortOrder: 1 },
    ],
  }));
}

async function getOwner() {
  const owner = await prisma.user.findFirst({
    where: { roles: { has: 'ADMIN' } },
    select: { id: true },
  });
  if (!owner) throw new Error('No ADMIN user found. Run the main seed first.');
  return owner;
}

async function upsertExperience(exp: MockExperience, ownerId: string) {
  const isXsed = exp.type === 'XSED';
  const benefits = isXsed ? makeBenefits(exp.destinationCity) : [];
  const hotels = benefits.filter((b) => b.type === 'ACCOMMODATION');
  const activities = benefits.filter((b) => b.type !== 'ACCOMMODATION');

  const data = {
    type: exp.type,
    level: exp.level ?? null,
    status: exp.status,
    title: exp.title,
    teaser: exp.teaser,
    description: exp.description,
    heroImage: exp.heroImage ?? HERO,
    destinationCity: exp.destinationCity,
    destinationCountry: exp.destinationCountry,
    minNights: exp.minNights,
    maxNights: exp.maxNights,
    minPax: exp.minPax,
    maxPax: exp.maxPax,
    basePrice: exp.basePrice,
    displayPrice: exp.displayPrice ?? '',
    accommodationType: exp.accommodationType ?? 'any',
    transport: exp.transport ?? 'any',
    climate: exp.climate ?? 'any',
    maxTravelTime: exp.maxTravelTime ?? 'no-limit',
    inclusions: isXsed
      ? ['1 noche, cena del sábado, desayuno del domingo y experiencia local curada.']
      : [],
    exclusions: isXsed ? ['Transporte hasta el destino.'] : [],
    ...(hotels.length > 0 && { hotels }),
    ...(activities.length > 0 && { activities }),
    // XSED fields
    titleInternal: exp.titleInternal ?? null,
    tripDate: exp.tripDate ? new Date(exp.tripDate) : null,
    revealAt: exp.revealAt ? new Date(exp.revealAt) : null,
    minSpots: exp.minSpots ?? null,
    maxSpots: exp.maxSpots ?? null,
    currency: exp.currency ?? 'USD',
  };

  const existing = await prisma.experience.findUnique({
    where: { slug: exp.slug },
    select: { id: true },
  });

  if (existing) {
    return prisma.experience.update({ where: { slug: exp.slug }, data });
  }

  return prisma.experience.create({ data: { slug: exp.slug, ownerId, ...data } });
}

async function main() {
  console.log('Seeding mock experiences (all types)…\n');

  const owner = await getOwner();

  const byType: Record<string, number> = {};

  for (const exp of MOCK_EXPERIENCES) {
    const saved = await upsertExperience(exp, owner.id);
    byType[saved.type] = (byType[saved.type] ?? 0) + 1;
    console.log(`✅ [${saved.type.padEnd(9)}] ${saved.slug} | ${saved.status}`);
  }

  console.log('\nTotals by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
