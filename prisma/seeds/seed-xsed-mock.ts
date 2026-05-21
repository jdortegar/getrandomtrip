import 'dotenv/config';
import type { ExperienceStatus, XsedBenefitType } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';

const HERO = '/images/drops/drops-mendoza.jpg';

interface MockDrop {
  slug: string;
  status: ExperienceStatus;
  titleInternal: string;
  titlePublicTeaser: string;
  destinationCity: string;
  destinationState: string;
  tripDate: string;
  revealAt?: string;
  pricePerPerson: number;
  maxSpots: number;
  minSpots: number;
  distanceKmFromOrigin: number;
  withBenefits: boolean;
}

const MOCK_DROPS: MockDrop[] = [
  {
    slug: '10',
    status: 'ACTIVE',
    titleInternal: 'Salta bajo las estrellas — Drop #10',
    titlePublicTeaser: 'Salta bajo las estrellas',
    destinationCity: 'Salta',
    destinationState: 'Salta',
    tripDate: '2026-11-15T03:00:00.000Z',
    revealAt: '2026-11-13T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1280,
    withBenefits: true,
  },
  {
    slug: '9',
    status: 'ACTIVE',
    titleInternal: 'Córdoba sin mapa — Drop #9',
    titlePublicTeaser: 'Córdoba sin mapa',
    destinationCity: 'Córdoba',
    destinationState: 'Córdoba',
    tripDate: '2026-10-18T03:00:00.000Z',
    revealAt: '2026-10-16T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 700,
    withBenefits: true,
  },
  {
    slug: '8',
    status: 'ARCHIVED',
    titleInternal: 'Mar del Plata off-season — Drop #8',
    titlePublicTeaser: 'Mar del Plata off-season',
    destinationCity: 'Mar del Plata',
    destinationState: 'Buenos Aires',
    tripDate: '2025-09-06T03:00:00.000Z',
    pricePerPerson: 220,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 400,
    withBenefits: true,
  },
  {
    slug: '7',
    status: 'DRAFT',
    titleInternal: 'Bariloche nevado (borrador) — Drop #7',
    titlePublicTeaser: 'Bariloche nevado',
    destinationCity: 'Bariloche',
    destinationState: 'Río Negro',
    tripDate: '2026-08-22T03:00:00.000Z',
    pricePerPerson: 280,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1650,
    withBenefits: false,
  },
  {
    slug: '6',
    status: 'DRAFT',
    titleInternal: 'Iguazú selva (borrador) — Drop #6',
    titlePublicTeaser: 'Iguazú selva',
    destinationCity: 'Puerto Iguazú',
    destinationState: 'Misiones',
    tripDate: '2026-07-25T03:00:00.000Z',
    pricePerPerson: 260,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1300,
    withBenefits: false,
  },
  {
    slug: '5',
    status: 'ACTIVE',
    titleInternal: 'Mendoza desde arriba — Drop #5',
    titlePublicTeaser: 'Mendoza desde arriba',
    destinationCity: 'Mendoza',
    destinationState: 'Mendoza',
    tripDate: '2026-02-20T03:00:00.000Z',
    revealAt: '2026-02-18T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1040,
    withBenefits: true,
  },
  {
    slug: '4',
    status: 'ACTIVE',
    titleInternal: 'Formosa tiene un secreto — Drop #4',
    titlePublicTeaser: 'Formosa tiene un secreto',
    destinationCity: 'Formosa',
    destinationState: 'Formosa',
    tripDate: '2026-03-20T03:00:00.000Z',
    revealAt: '2026-03-18T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1200,
    withBenefits: true,
  },
  {
    slug: '3',
    status: 'INACTIVE',
    titleInternal: 'Tucumán star night — Drop #3',
    titlePublicTeaser: 'Tucumán star night',
    destinationCity: 'Tucumán',
    destinationState: 'Tucumán',
    tripDate: '2026-01-02T03:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1080,
    withBenefits: true,
  },
  {
    slug: '2',
    status: 'ACTIVE',
    titleInternal: 'Formosa tiene un secreto — Drop #2',
    titlePublicTeaser: 'Formosa tiene un secreto',
    destinationCity: 'Formosa',
    destinationState: 'Formosa',
    tripDate: '2026-03-20T03:00:00.000Z',
    revealAt: '2026-03-18T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1200,
    withBenefits: true,
  },
  {
    slug: '1',
    status: 'ACTIVE',
    titleInternal: 'Tucumán star night — Drop #1',
    titlePublicTeaser: 'Tucumán star night',
    destinationCity: 'Tucumán',
    destinationState: 'Tucumán',
    tripDate: '2026-06-20T03:00:00.000Z',
    revealAt: '2026-06-18T21:00:00.000Z',
    pricePerPerson: 250,
    maxSpots: 10,
    minSpots: 2,
    distanceKmFromOrigin: 1080,
    withBenefits: true,
  },
];

function benefitCreates(city: string, state: string) {
  const pillars: Array<{ type: XsedBenefitType; sortOrder: number; name: string }> = [
    { type: 'ACCOMMODATION', sortOrder: 1, name: 'El Hotel' },
    { type: 'ACTIVITY', sortOrder: 2, name: 'La Experiencia' },
    { type: 'DINNER', sortOrder: 3, name: 'La Cena' },
  ];

  return pillars.map((pillar) => ({
    type: pillar.type,
    sortOrder: pillar.sortOrder,
    name: pillar.name,
    providerName: pillar.type === 'ACCOMMODATION' ? `Hotel mock ${city}` : null,
    city,
    state,
    customerVisibleNotes: `<p>Contenido mock para ${pillar.name} en ${city}, ${state}.</p>`,
    photos: {
      create: [
        { url: HERO, altText: `${pillar.name} — foto 1`, type: 'gallery', sortOrder: 0 },
        { url: HERO, altText: `${pillar.name} — foto 2`, type: 'gallery', sortOrder: 1 },
      ],
    },
  }));
}

async function upsertDrop(drop: MockDrop) {
  const base = {
    status: drop.status,
    titleInternal: drop.titleInternal,
    titlePublicTeaser: drop.titlePublicTeaser,
    heroImage: HERO,
    destinationCity: drop.destinationCity,
    destinationState: drop.destinationState,
    originCity: 'Buenos Aires',
    originCountry: 'Argentina',
    distanceKmFromOrigin: drop.distanceKmFromOrigin,
    tripDate: new Date(drop.tripDate),
    revealAt: drop.revealAt ? new Date(drop.revealAt) : null,
    pricePerPerson: drop.pricePerPerson,
    currency: 'USD',
    maxSpots: drop.maxSpots,
    minSpots: drop.minSpots,
    included: '1 noche, cena del sábado, desayuno del domingo y experiencia local curada.',
    notIncluded: 'Transporte hasta el destino.',
  };

  const existing = await prisma.xsedExperience.findUnique({
    where: { slug: drop.slug },
    select: { id: true },
  });

  if (existing) {
    await prisma.xsedComponent.deleteMany({ where: { experienceId: existing.id } });
    return prisma.xsedExperience.update({
      where: { slug: drop.slug },
      data: {
        ...base,
        ...(drop.withBenefits
          ? { benefits: { create: benefitCreates(drop.destinationCity, drop.destinationState) } }
          : {}),
      },
    });
  }

  return prisma.xsedExperience.create({
    data: {
      slug: drop.slug,
      ...base,
      ...(drop.withBenefits
        ? { benefits: { create: benefitCreates(drop.destinationCity, drop.destinationState) } }
        : {}),
    },
  });
}

async function main() {
  console.log('Seeding 10 mock XSED drops (slugs 1–10)…\n');

  for (const drop of MOCK_DROPS) {
    const saved = await upsertDrop(drop);
    console.log(`✅ ${saved.slug} | ${saved.status} | ${saved.titlePublicTeaser}`);
  }

  const counts = await prisma.xsedExperience.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.log('\nTotals by status:');
  for (const row of counts) {
    console.log(`  ${row.status}: ${row._count._all}`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
