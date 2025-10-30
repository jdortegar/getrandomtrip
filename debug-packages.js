const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPackages() {
  try {
    console.log('🔍 Testing package queries...');
    
    // Get Alex's ID
    const alex = await prisma.user.findUnique({
      where: { tripperSlug: 'alex' }
    });
    
    if (!alex) {
      console.log('❌ Alex not found');
      return;
    }
    
    console.log(`👤 Alex ID: ${alex.id}`);
    
    // Test the exact query from getTripperPackagesByTypeAndLevel
    const packages = await prisma.package.findMany({
      where: {
        ownerId: alex.id,
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
    
    console.log(`📦 Found ${packages.length} packages for Alex`);
    
    if (packages.length > 0) {
      console.log('First 3 packages:');
      packages.slice(0, 3).forEach(p => {
        console.log(`  - ${p.title} (${p.type}/${p.level}) - Excuse: ${p.excuseKey}`);
      });
      
      // Group by type and level like the function does
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
      
      console.log('\n📊 Packages by type and level:');
      Object.entries(packagesByType).forEach(([type, levels]) => {
        console.log(`  ${type}:`);
        Object.entries(levels).forEach(([level, pkgs]) => {
          console.log(`    ${level}: ${pkgs.length} packages`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPackages();
