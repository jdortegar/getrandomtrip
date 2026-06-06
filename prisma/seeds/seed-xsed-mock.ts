import "dotenv/config";
import type { ExperienceStatus } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";

const HERO = "/images/drops/drops-mendoza.jpg";

interface MockDrop {
  slug: string;
  status: ExperienceStatus;
  titleInternal: string;
  teaser: string;
  destinationCity: string;
  destinationCountry: string;
  tripDate: string;
  revealAt?: string;
  basePrice: number;
  maxSpots: number;
  minSpots: number;
  withBenefits: boolean;
}

const MOCK_DROPS: MockDrop[] = [
  {
    slug: "10",
    status: "ACTIVE",
    titleInternal: "Salta bajo las estrellas — Drop #10",
    teaser: "Salta bajo las estrellas",
    destinationCity: "Salta",
    destinationCountry: "Argentina",
    tripDate: "2026-11-15T03:00:00.000Z",
    revealAt: "2026-11-13T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "9",
    status: "ACTIVE",
    titleInternal: "Córdoba sin mapa — Drop #9",
    teaser: "Córdoba sin mapa",
    destinationCity: "Córdoba",
    destinationCountry: "Argentina",
    tripDate: "2026-10-18T03:00:00.000Z",
    revealAt: "2026-10-16T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "8",
    status: "ARCHIVED",
    titleInternal: "Mar del Plata off-season — Drop #8",
    teaser: "Mar del Plata off-season",
    destinationCity: "Mar del Plata",
    destinationCountry: "Argentina",
    tripDate: "2025-09-06T03:00:00.000Z",
    basePrice: 220,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "7",
    status: "DRAFT",
    titleInternal: "Bariloche nevado (borrador) — Drop #7",
    teaser: "Bariloche nevado",
    destinationCity: "Bariloche",
    destinationCountry: "Argentina",
    tripDate: "2026-08-22T03:00:00.000Z",
    basePrice: 280,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: false,
  },
  {
    slug: "6",
    status: "DRAFT",
    titleInternal: "Iguazú selva (borrador) — Drop #6",
    teaser: "Iguazú selva",
    destinationCity: "Puerto Iguazú",
    destinationCountry: "Argentina",
    tripDate: "2026-07-25T03:00:00.000Z",
    basePrice: 260,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: false,
  },
  {
    slug: "5",
    status: "ACTIVE",
    titleInternal: "Mendoza desde arriba — Drop #5",
    teaser: "Mendoza desde arriba",
    destinationCity: "Mendoza",
    destinationCountry: "Argentina",
    tripDate: "2026-02-20T03:00:00.000Z",
    revealAt: "2026-02-18T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "4",
    status: "ACTIVE",
    titleInternal: "Formosa tiene un secreto — Drop #4",
    teaser: "Formosa tiene un secreto",
    destinationCity: "Formosa",
    destinationCountry: "Argentina",
    tripDate: "2026-03-20T03:00:00.000Z",
    revealAt: "2026-03-18T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "3",
    status: "INACTIVE",
    titleInternal: "Tucumán star night — Drop #3",
    teaser: "Tucumán star night",
    destinationCity: "Tucumán",
    destinationCountry: "Argentina",
    tripDate: "2026-01-02T03:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "2",
    status: "ACTIVE",
    titleInternal: "Formosa tiene un secreto — Drop #2",
    teaser: "Formosa tiene un secreto",
    destinationCity: "Formosa",
    destinationCountry: "Argentina",
    tripDate: "2026-03-20T03:00:00.000Z",
    revealAt: "2026-03-18T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
  {
    slug: "1",
    status: "ACTIVE",
    titleInternal: "Tucumán star night — Drop #1",
    teaser: "Tucumán star night",
    destinationCity: "Tucumán",
    destinationCountry: "Argentina",
    tripDate: "2026-06-20T03:00:00.000Z",
    revealAt: "2026-06-18T21:00:00.000Z",
    basePrice: 250,
    maxSpots: 10,
    minSpots: 2,
    withBenefits: true,
  },
];

type BenefitType = "ACCOMMODATION" | "DINNER" | "ACTIVITY";

function makeBenefits(city: string) {
  const pillars: Array<{ type: BenefitType; sortOrder: number; name: string }> =
    [
      { type: "ACCOMMODATION", sortOrder: 0, name: "El Hotel" },
      { type: "DINNER", sortOrder: 1, name: "La Cena" },
      { type: "ACTIVITY", sortOrder: 2, name: "La Experiencia" },
    ];

  return pillars.map((p) => ({
    id: `${city.toLowerCase().replace(/\s+/g, "-")}-${p.type.toLowerCase()}`,
    type: p.type,
    sortOrder: p.sortOrder,
    name: p.name,
    providerName: p.type === "ACCOMMODATION" ? `Hotel mock ${city}` : null,
    address: null,
    city,
    state: null,
    googleMapsUrl: null,
    customerVisibleNotes: `<p>Contenido mock para ${p.name} en ${city}.</p>`,
    internalNotes: null,
    confirmationStatus: "PENDING" as const,
    reservationCode: null,
    photos: [
      {
        id: `${p.type.toLowerCase()}-photo-1`,
        url: HERO,
        altText: `${p.name} — foto 1`,
        type: "gallery",
        sortOrder: 0,
      },
      {
        id: `${p.type.toLowerCase()}-photo-2`,
        url: HERO,
        altText: `${p.name} — foto 2`,
        type: "gallery",
        sortOrder: 1,
      },
    ],
  }));
}

async function upsertDrop(drop: MockDrop) {
  const benefits = drop.withBenefits ? makeBenefits(drop.destinationCity) : [];
  const hotels = benefits.filter((b) => b.type === "ACCOMMODATION");
  const activities = benefits.filter((b) => b.type !== "ACCOMMODATION");

  const base = {
    type: "XSED" as const,
    status: drop.status,
    title: drop.titleInternal,
    titleInternal: drop.titleInternal,
    teaser: drop.teaser,
    description: "",
    heroImage: HERO,
    destinationCity: drop.destinationCity,
    destinationCountry: drop.destinationCountry,
    tripDate: new Date(drop.tripDate),
    revealAt: drop.revealAt ? new Date(drop.revealAt) : null,
    basePrice: drop.basePrice,
    currency: "USD",
    maxSpots: drop.maxSpots,
    minSpots: drop.minSpots,
    minNights: 1,
    maxNights: 1,
    inclusions: [
      "1 noche, cena del sábado, desayuno del domingo y experiencia local curada.",
    ],
    exclusions: ["Transporte hasta el destino."],
    hotels: hotels.length > 0 ? hotels : undefined,
    activities: activities.length > 0 ? activities : undefined,
  };

  const existing = await prisma.experience.findUnique({
    where: { slug: drop.slug },
    select: { id: true, ownerId: true },
  });

  if (existing) {
    return prisma.experience.update({
      where: { slug: drop.slug },
      data: base,
    });
  }

  // Find or create a system owner (first admin user)
  const owner = await prisma.user.findFirst({
    where: { roles: { has: "ADMIN" } },
    select: { id: true },
  });

  if (!owner) {
    throw new Error("No ADMIN user found. Run the main seed first.");
  }

  return prisma.experience.create({
    data: {
      slug: drop.slug,
      ownerId: owner.id,
      ...base,
    },
  });
}

async function main() {
  console.log("Seeding 10 mock XSED drops (slugs 1–10)…\n");

  for (const drop of MOCK_DROPS) {
    const saved = await upsertDrop(drop);
    console.log(`✅ ${saved.slug} | ${saved.status} | ${saved.teaser}`);
  }

  const counts = await prisma.experience.groupBy({
    by: ["status"],
    where: { type: { has: "XSED" } },
    _count: { _all: true },
  });

  console.log("\nXSED totals by status:");
  for (const row of counts) {
    console.log(`  ${row.status}: ${row._count._all}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
