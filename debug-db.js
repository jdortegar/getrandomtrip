const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log('🔍 Checking database...');
    
    // Check users
    const users = await prisma.user.findMany({
      where: { role: 'TRIPPER' },
      select: { id: true, name: true, tripperSlug: true }
    });
    console.log('👥 Trippers:', users.length);
    users.forEach(u => console.log(`  - ${u.name} (${u.tripperSlug}) - ID: ${u.id}`));
    
    // Check packages
    const packages = await prisma.package.findMany({
      select: { 
        id: true, 
        title: true, 
        ownerId: true, 
        isActive: true, 
        status: true,
        type: true,
        level: true
      }
    });
    console.log('\n📦 Packages:', packages.length);
    
    if (packages.length > 0) {
      console.log('First 5 packages:');
      packages.slice(0, 5).forEach(p => {
        console.log(`  - ${p.title} (${p.type}/${p.level}) - Active: ${p.isActive}, Status: ${p.status}, Owner: ${p.ownerId}`);
      });
      
      // Check packages by owner
      const packagesByOwner = {};
      packages.forEach(p => {
        if (!packagesByOwner[p.ownerId]) packagesByOwner[p.ownerId] = 0;
        packagesByOwner[p.ownerId]++;
      });
      
      console.log('\n📊 Packages by owner:');
      Object.entries(packagesByOwner).forEach(([ownerId, count]) => {
        const user = users.find(u => u.id === ownerId);
        console.log(`  - ${user?.name || 'Unknown'} (${ownerId}): ${count} packages`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
