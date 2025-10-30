const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDawsonPackages() {
  try {
    // Find Dawson
    const dawson = await prisma.user.findUnique({
      where: { tripperSlug: 'dawson' },
      select: { id: true, name: true },
    });

    if (!dawson) {
      console.log('❌ Dawson not found');
      return;
    }

    console.log(`✅ Found tripper: ${dawson.name} (ID: ${dawson.id})`);

    // Get all Dawson's packages
    const packages = await prisma.package.findMany({
      where: { ownerId: dawson.id },
      select: {
        id: true,
        title: true,
        type: true,
        level: true,
        destinationCountry: true,
        destinationCity: true,
        excuseKey: true,
        basePriceUsd: true,
      },
    });

    console.log(`\n📦 Dawson has ${packages.length} packages:`);
    packages.forEach((pkg) => {
      console.log(
        `- ${pkg.title} (${pkg.type}/${pkg.level}) - ${pkg.destinationCity}, ${pkg.destinationCountry} - $${pkg.basePriceUsd}`,
      );
    });

    // Check specifically for solo exploraPlus packages
    const soloExploraPlus = packages.filter(
      (pkg) => pkg.type === 'solo' && pkg.level === 'exploraPlus',
    );
    console.log(`\n🎯 Solo exploraPlus packages: ${soloExploraPlus.length}`);
    soloExploraPlus.forEach((pkg) => {
      console.log(
        `- ${pkg.title} - ${pkg.destinationCity}, ${pkg.destinationCountry}`,
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDawsonPackages();
