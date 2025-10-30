const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPage() {
  try {
    console.log('🔍 Testing page logic...');
    
    // Get Alex's data like the page does
    const dbTripper = await prisma.user.findUnique({
      where: {
        tripperSlug: 'alex',
        role: 'TRIPPER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        tripperSlug: true,
        commission: true,
        interests: true,
        bio: true,
        heroImage: true,
        location: true,
        tierLevel: true,
        destinations: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('👤 Alex found:', !!dbTripper);
    if (dbTripper) {
      console.log(`  Name: ${dbTripper.name}, ID: ${dbTripper.id}`);
    }
    
    if (!dbTripper) {
      console.log('❌ Alex not found, would return notFound()');
      return;
    }
    
    // Test the packages query
    const packages = await prisma.package.findMany({
      where: {
        ownerId: dbTripper.id,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        level: true,
        title: true,
        teaser: true,
        heroImage: true,
        tags: true,
        highlights: true,
        excuseKey: true,
        destinationCountry: true,
        destinationCity: true,
        basePriceUsd: true,
        displayPrice: true,
      },
      orderBy: [{ type: 'asc' }, { level: 'asc' }, { title: 'asc' }],
    });
    
    console.log(`📦 Raw packages: ${packages.length}`);
    
    // Group packages by type and level (like the function does)
    const packagesByType = {};
    packages.forEach((pkg) => {
      const { type, level } = pkg;
      if (!packagesByType[type]) {
        packagesByType[type] = {};
      }
      if (!packagesByType[type][level]) {
        packagesByType[type][level] = [];
      }
      packagesByType[type][level].push(pkg);
    });
    
    console.log('📊 Packages by type:', Object.keys(packagesByType));
    
    // Test the page logic
    const allPackages = Object.values(packagesByType)
      .flatMap((levelPackages) => Object.values(levelPackages))
      .flat();
    
    console.log(`📦 All packages (flattened): ${allPackages.length}`);
    
    const packagesByTypeForDisplay = Object.entries(packagesByType).map(
      ([type, levelPackages]) => ({
        type,
        packages: Object.values(levelPackages).flat(),
        totalPackages: Object.values(levelPackages).flat().length,
      }),
    );
    
    console.log('📊 Packages for display:', packagesByTypeForDisplay.length);
    packagesByTypeForDisplay.forEach(({ type, totalPackages }) => {
      console.log(`  ${type}: ${totalPackages} packages`);
    });
    
    if (allPackages.length === 0) {
      console.log('❌ No packages found - would show "No hay paquetes disponibles"');
    } else {
      console.log('✅ Packages found - would show packages');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPage();
