import { PrismaClient, TripStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@getrandomtrip.com' },
    update: {},
    create: {
      email: 'demo@getrandomtrip.com',
      name: 'Demo User',
      password: hashedPassword,
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
    const trip = await prisma.trip.create({
      data: tripData,
    });

    console.log(
      `✅ Created trip: ${trip.actualDestination || 'Secret destination'} (${trip.status})`,
    );

    // Create payment for each trip
    const paymentStatus =
      trip.status === 'COMPLETED' ||
      trip.status === 'CONFIRMED' ||
      trip.status === 'REVEALED'
        ? 'APPROVED'
        : 'PENDING';

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        tripId: trip.id,
        provider: 'mercadopago',
        providerPaymentId: `mp_test_${trip.id}`,
        providerPreferenceId: `pref_${trip.id}`,
        amount: trip.totalTripUsd,
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

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: demo@getrandomtrip.com');
  console.log('   Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
