import 'dotenv/config';
import {
  PrismaClient,
  TripRequestStatus,
  PackageStatus,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ['error'] } : { log: ['error'] }) as object,
);

// NOTE: This seed file is outdated and needs to be updated for the new schema
// For now, we're using the custom seed script in scripts/seed-trippers-packages.ts
async function main() {
  console.log(
    '⚠️  This seed file is outdated. Use scripts/seed-trippers-packages.ts instead.',
  );
  return;

  // Disabled for now - all code below is commented out
  /*
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // 1. Create Admin User
  // ============================================================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@getrandomtrip.com' },
    update: {},
    create: {
      email: 'admin@getrandomtrip.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      travelerType: null,
      interests: [],
      dislikes: [],
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // ============================================================================
  // 2. Create Tripper - Dawson Belair
  // ============================================================================
  const tripperPassword = await bcrypt.hash('tripper123', 10);
  const dawson = await prisma.user.upsert({
    where: { email: 'dawson@getrandomtrip.com' },
    update: {},
    create: {
      email: 'dawson@getrandomtrip.com',
      name: 'Dawson Belair',
      password: tripperPassword,
      role: UserRole.TRIPPER,
      tripperSlug: 'dawson',
      commission: 0.12, // 12% commission
      availableTypes: ['solo', 'couple', 'group'],
      interests: [
        'adventure',
        'photography',
        'urban-exploration',
        'culture',
        'nature',
      ],
      travelerType: null,
      dislikes: [],
      avatarUrl: '/images/trippers/dawson-avatar.jpg',
    },
  });
  console.log('✅ Created tripper:', dawson.name, `(${dawson.tripperSlug})`);

  // ============================================================================
  // 3. Create Regular Test User
  // ============================================================================
  const userPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@getrandomtrip.com' },
    update: {},
    create: {
      email: 'demo@getrandomtrip.com',
      name: 'Demo User',
      password: userPassword,
      role: UserRole.CLIENT,
      travelerType: 'couple',
      interests: ['adventure', 'culture', 'food'],
      dislikes: ['crowds', 'cold'],
    },
  });
  console.log('✅ Created demo user:', user.email);

  // Create 3 example trips with payments
  const trips = [
    {
      userId: user.id,
      type: 'couple',
      level: 'atelier-getaway',
      status: TripStatus.COMPLETED,
      from: '',

      // Logistics
      country: 'Peru',
      city: 'Lima',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      nights: 5,
      pax: 2,

      // Filters
      transport: 'avion',
      climate: 'calido',
      maxTravelTime: '5h',
      departPref: 'manana',
      arrivePref: 'tarde',
      avoidDestinations: [],

      // Addons
      addons: [
        { id: 'wine-tour', qty: 2 },
        { id: 'concert', qty: 1 },
      ],

      // Pricing
      basePriceUsd: 1200,
      displayPrice: 'USD 1200',
      filtersCostUsd: 54,
      addonsCostUsd: 150,
      totalPerPaxUsd: 702,
      totalTripUsd: 1404,

      // Completed trip data
      customerRating: 5,
      customerFeedback:
        '¡Increíble experiencia! Buenos Aires superó todas nuestras expectativas.',
      actualDestination: 'Buenos Aires, Argentina',
      destinationRevealedAt: new Date('2024-01-13'),
      completedAt: new Date('2024-01-20'),
    },
    {
      userId: user.id,
      type: 'family',
      level: 'explora-plus',
      status: TripStatus.CONFIRMED,
      from: '',

      // Logistics
      country: 'Mexico',
      city: 'Mexico City',
      startDate: new Date('2025-03-10'),
      endDate: new Date('2025-03-15'),
      nights: 5,
      pax: 4,

      // Filters
      transport: 'avion',
      climate: 'templado',
      maxTravelTime: '8h',
      departPref: 'indistinto',
      arrivePref: 'indistinto',
      avoidDestinations: ['Lima', 'Santiago'],

      // Addons
      addons: [
        { id: 'family-photo', qty: 1 },
        { id: 'museum-pass', qty: 4 },
      ],

      // Pricing
      basePriceUsd: 2400,
      displayPrice: 'USD 2400',
      filtersCostUsd: 72,
      addonsCostUsd: 200,
      totalPerPaxUsd: 668,
      totalTripUsd: 2672,

      // Not revealed yet
      customerRating: null,
      customerFeedback: null,
      actualDestination: null,
      destinationRevealedAt: null,
      completedAt: null,
    },
    {
      userId: user.id,
      type: 'solo',
      level: 'modo-explora',
      status: TripStatus.REVEALED,
      from: '',

      // Logistics
      country: 'Colombia',
      city: 'Bogotá',
      startDate: new Date('2025-02-20'),
      endDate: new Date('2025-02-25'),
      nights: 5,
      pax: 1,

      // Filters
      transport: 'avion',
      climate: 'calido',
      maxTravelTime: '3h',
      departPref: 'tarde',
      arrivePref: 'noche',
      avoidDestinations: [],

      // Addons
      addons: [
        { id: 'scuba-diving', qty: 1 },
        { id: 'cancel-ins', qty: 1 },
      ],

      // Pricing
      basePriceUsd: 800,
      displayPrice: 'USD 800',
      filtersCostUsd: 36,
      addonsCostUsd: 80,
      totalPerPaxUsd: 916,
      totalTripUsd: 916,

      // Revealed destination
      customerRating: null,
      customerFeedback: null,
      actualDestination: 'Cartagena, Colombia',
      destinationRevealedAt: new Date('2025-02-18'),
      completedAt: null,
    },
  ];

  for (const tripData of trips) {
    const tripRequest = await prisma.tripRequest.create({
      data: tripData,
    });

    console.log(
      `✅ Created tripRequest: ${tripRequest.actualDestination || 'Secret destination'} (${tripRequest.status})`,
    );

    // Create payment for each trip
    const paymentStatus =
      tripRequest.status === 'COMPLETED' ||
      tripRequest.status === 'CONFIRMED' ||
      tripRequest.status === 'REVEALED'
        ? 'APPROVED'
        : 'PENDING';

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        tripRequestId: tripRequest.id,
        provider: 'mercadopago',
        providerPaymentId: `mp_test_${tripRequest.id}`,
        providerPreferenceId: `pref_${tripRequest.id}`,
        amount: tripRequest.totalTripUsd,
        currency: 'USD',
        paymentMethod: 'credit_card',
        cardLast4: '1234',
        cardBrand: 'Visa',
        status: paymentStatus,
        statusDetail: paymentStatus === 'APPROVED' ? 'accredited' : 'pending',
        mpExternalReference: trip.id,
        mpDescription: `Viaje ${trip.type} - ${trip.level}`,
        mpStatementDescriptor: 'GETRANDOMTRIP',
        netAmount: trip.totalTripUsd * 0.95,
        feeAmount: trip.totalTripUsd * 0.05,
        paidAt: paymentStatus === 'APPROVED' ? trip.startDate : null,
        createdAt: trip.startDate
          ? new Date(trip.startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(), // 7 days before trip
      },
    });

    console.log(
      `✅ Created payment for trip: ${payment.providerPaymentId} (${payment.status})`,
    );
  }

  // ============================================================================
  // 4. Create Dawson's Featured Trips (for inspiration gallery)
  // ============================================================================
  console.log("\n✨ Creating Dawson's featured trips...");

  const featuredTrips = [
    {
      userId: admin.id, // Admin creates it
      ownerId: dawson.id, // Dawson owns it
      ownerType: OwnerType.TRIPPER,
      isTemplate: true,
      isFeatured: true,
      status: TripStatus.COMPLETED,
      from: 'dawson',

      // Display info
      title: 'Aventura Urbana Misteriosa',
      teaser:
        'Una inmersión cultural en una ciudad vibrante llena de sorpresas',
      description:
        'Explora calles ocultas, mercados locales y experiencias gastronómicas únicas. Un viaje diseñado para el aventurero urbano que busca autenticidad.',
      heroImage: '/images/trips/dawson-urban-adventure.jpg',
      tags: ['adventure', 'urban', 'culture', 'food'],
      highlights: [
        '3 noches en hotel boutique del centro',
        'Tour fotográfico con guía local',
        'Experiencias gastronómicas auténticas',
        'Transporte incluido',
      ],
      likes: 47,

      // Trip details
      type: 'solo',
      level: 'modo-explora',
      country: 'México',
      city: 'Ciudad de México',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-18'),
      nights: 3,
      pax: 1,

      // Filters
      transport: 'avion',
      climate: 'templado',
      maxTravelTime: '4h',
      departPref: 'manana',
      arrivePref: 'tarde',
      avoidDestinations: [],

      // Pricing (base + 12% commission)
      basePriceUsd: 650,
      displayPrice: 'Desde $728 USD',
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 728,
      totalTripUsd: 728,

      // Completed
      actualDestination: 'Ciudad de México, México',
      destinationRevealedAt: new Date('2024-03-13'),
      completedAt: new Date('2024-03-18'),
      customerRating: 5,
      customerFeedback:
        'Experiencia increíble, Dawson conoce los mejores lugares!',
    },
    {
      userId: admin.id,
      ownerId: dawson.id,
      ownerType: OwnerType.TRIPPER,
      isTemplate: true,
      isFeatured: true,
      status: TripStatus.COMPLETED,
      from: 'dawson',

      // Display info
      title: 'Escapada Romántica Premium',
      teaser:
        'Un viaje íntimo diseñado para parejas que buscan conexión y lujo',
      description:
        'Cenas privadas, atardeceres únicos y experiencias exclusivas. Cada detalle pensado para crear momentos inolvidables.',
      heroImage: '/images/trips/dawson-romantic-escape.jpg',
      tags: ['romantic', 'luxury', 'wine', 'sunset'],
      highlights: [
        '5 noches en resort exclusivo',
        'Cena romántica privada con chef',
        'Tour de viñedos premium',
        'Masajes de pareja incluidos',
        'Sesión fotográfica profesional',
      ],
      likes: 89,

      // Trip details
      type: 'couple',
      level: 'atelier-getaway',
      country: 'Argentina',
      city: 'Mendoza',
      startDate: new Date('2024-04-20'),
      endDate: new Date('2024-04-25'),
      nights: 5,
      pax: 2,

      // Filters
      transport: 'avion',
      climate: 'templado',
      maxTravelTime: '6h',
      departPref: 'tarde',
      arrivePref: 'noche',
      avoidDestinations: [],

      // Pricing
      basePriceUsd: 1800,
      displayPrice: 'Desde $2,016 USD/persona',
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 2016,
      totalTripUsd: 4032,

      // Completed
      actualDestination: 'Mendoza, Argentina',
      destinationRevealedAt: new Date('2024-04-18'),
      completedAt: new Date('2024-04-25'),
      customerRating: 5,
      customerFeedback: 'Perfecto para nuestra luna de miel!',
    },
    {
      userId: admin.id,
      ownerId: dawson.id,
      ownerType: OwnerType.TRIPPER,
      isTemplate: true,
      isFeatured: true,
      status: TripStatus.COMPLETED,
      from: 'dawson',

      // Display info
      title: 'Aventura en Grupo - Amistad Sin Límites',
      teaser:
        'Experiencias compartidas que fortalecen lazos y crean historias épicas',
      description:
        'De la adrenalina a las risas nocturnas. Un viaje diseñado para grupos de amigos que quieren vivir al máximo.',
      heroImage: '/images/trips/dawson-group-adventure.jpg',
      tags: ['group', 'adventure', 'beach', 'party', 'water-sports'],
      highlights: [
        '4 noches en villa compartida frente al mar',
        'Actividades acuáticas incluidas',
        'Excursión a isla secreta',
        'Fiesta privada en la playa',
        'Comidas grupales incluidas',
      ],
      likes: 63,

      // Trip details
      type: 'group',
      level: 'explora-plus',
      country: 'Colombia',
      city: 'Cartagena',
      startDate: new Date('2024-05-10'),
      endDate: new Date('2024-05-14'),
      nights: 4,
      pax: 6,

      // Filters
      transport: 'avion',
      climate: 'calido',
      maxTravelTime: '5h',
      departPref: 'manana',
      arrivePref: 'mediodia',
      avoidDestinations: [],

      // Pricing
      basePriceUsd: 950,
      displayPrice: 'Desde $1,064 USD/persona',
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 1064,
      totalTripUsd: 6384,

      // Completed
      actualDestination: 'Cartagena, Colombia',
      destinationRevealedAt: new Date('2024-05-08'),
      completedAt: new Date('2024-05-14'),
      customerRating: 5,
      customerFeedback:
        'El mejor viaje grupal que hemos hecho! Dawson es un genio.',
    },
  ];

  for (const tripData of featuredTrips) {
    const tripRequest = await prisma.tripRequest.create({
      data: tripData,
    });

    console.log(
      `✅ Created featured trip: ${trip.title} (${trip.type}, ${trip.likes} likes)`,
    );

    // Add some likes from demo user
    if (tripRequest.id) {
      await prisma.packageLike.create({
        data: {
          packageId: tripRequest.id,
          userId: user.id,
        },
      });
      console.log(`   💙 Added like from demo user`);
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   👤 Demo User:');
  console.log('      Email: demo@getrandomtrip.com');
  console.log('      Password: password123');
  console.log('   ✈️  Tripper:');
  console.log('      Email: dawson@getrandomtrip.com');
  console.log('      Password: tripper123');
  console.log('      Slug: dawson');
  console.log('   👑 Admin:');
  console.log('      Email: admin@getrandomtrip.com');
  console.log('      Password: admin123\n');
  */
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
