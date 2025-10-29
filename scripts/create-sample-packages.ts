import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSamplePackages() {
  try {
    // Get the tripper
    const tripper = await prisma.user.findFirst({
      where: { role: 'TRIPPER' },
    });

    if (!tripper) {
      console.log('No tripper found');
      return;
    }

    console.log(`Creating sample packages for tripper: ${tripper.name}`);

    // Sample packages for couple/explora
    const coupleExploraPackage = await prisma.package.upsert({
      where: { id: 'couple-explora-romantic' },
      update: {},
      create: {
        id: 'couple-explora-romantic',
        ownerId: tripper.id,
        type: 'couple',
        level: 'explora',
        title: 'Escapada Romántica en París',
        teaser:
          'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
        description:
          'Una experiencia romántica en la ciudad del amor, con paseos por el Sena y cenas íntimas.',
        heroImage:
          'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
        tags: ['romantic', 'city', 'culture'],
        highlights: ['3 noches', 'Hotel boutique', 'Cena romántica'],
        destinationCountry: 'Francia',
        destinationCity: 'París',
        minNights: 2,
        maxNights: 4,
        minPax: 2,
        maxPax: 2,
        basePriceUsd: 800,
        displayPrice: 'Desde $800 USD',
        selectedOptions: ['culture-traditions', 'romantic-dining'],
      },
    });

    // Sample packages for solo/exploraPlus
    const soloExploraPlusPackage = await prisma.package.upsert({
      where: { id: 'solo-exploraplus-discovery' },
      update: {},
      create: {
        id: 'solo-exploraplus-discovery',
        ownerId: tripper.id,
        type: 'solo',
        level: 'exploraPlus',
        title: 'Autodescubrimiento en Nepal',
        teaser:
          'Un viaje para encontrarte a ti mismo en lugares que no conocías.',
        description:
          'Una experiencia transformadora en las montañas del Nepal, combinando trekking y meditación.',
        heroImage:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
        tags: ['adventure', 'mindfulness', 'nature'],
        highlights: ['7 noches', 'Trekking guiado', 'Meditación'],
        destinationCountry: 'Nepal',
        destinationCity: 'Katmandú',
        minNights: 5,
        maxNights: 10,
        minPax: 1,
        maxPax: 1,
        basePriceUsd: 1200,
        displayPrice: 'Desde $1,200 USD',
        selectedOptions: ['mindfulness-wellness', 'adventure-challenge'],
      },
    });

    // Another solo package for variety
    const soloExploraPlusPackage2 = await prisma.package.upsert({
      where: { id: 'solo-exploraplus-cultural' },
      update: {},
      create: {
        id: 'solo-exploraplus-cultural',
        ownerId: tripper.id,
        type: 'solo',
        level: 'exploraPlus',
        title: 'Inmersión Cultural en Japón',
        teaser:
          'Sumérgete en una cultura milenaria y descubre una nueva perspectiva de la vida.',
        description:
          'Una experiencia profunda en la cultura japonesa, desde templos antiguos hasta la modernidad de Tokio.',
        heroImage:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        tags: ['culture', 'spiritual', 'urban'],
        highlights: ['6 noches', 'Guía local', 'Ceremonia del té'],
        destinationCountry: 'Japón',
        destinationCity: 'Tokio',
        minNights: 4,
        maxNights: 8,
        minPax: 1,
        maxPax: 1,
        basePriceUsd: 1500,
        displayPrice: 'Desde $1,500 USD',
        selectedOptions: ['cultural-immersion', 'mindfulness-wellness'],
      },
    });

    console.log('Sample packages created successfully!');
    console.log(
      `- ${coupleExploraPackage.title} (${coupleExploraPackage.type}/${coupleExploraPackage.level})`,
    );
    console.log(
      `- ${soloExploraPlusPackage.title} (${soloExploraPlusPackage.type}/${soloExploraPlusPackage.level})`,
    );
    console.log(
      `- ${soloExploraPlusPackage2.title} (${soloExploraPlusPackage2.type}/${soloExploraPlusPackage2.level})`,
    );
  } catch (error) {
    console.error('Error creating sample packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePackages();
