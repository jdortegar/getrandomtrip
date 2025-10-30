const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDawsonExcuseKeys() {
  try {
    const dawson = await prisma.user.findUnique({
      where: { tripperSlug: 'dawson' },
      select: { id: true, name: true },
    });

    if (!dawson) {
      console.log('❌ Dawson not found');
      return;
    }

    const packages = await prisma.package.findMany({
      where: { ownerId: dawson.id },
      select: {
        excuseKey: true,
        title: true,
        type: true,
        level: true,
      },
    });

    console.log('📦 Dawson packages by excuse key:');
    const excuseGroups = {};
    packages.forEach((pkg) => {
      if (!excuseGroups[pkg.excuseKey]) {
        excuseGroups[pkg.excuseKey] = [];
      }
      excuseGroups[pkg.excuseKey].push(pkg);
    });

    Object.entries(excuseGroups).forEach(([excuseKey, packages]) => {
      console.log(`\n🎯 ${excuseKey}:`);
      packages.forEach((pkg) => {
        console.log(`  - ${pkg.title} (${pkg.type}/${pkg.level})`);
      });
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDawsonExcuseKeys();
