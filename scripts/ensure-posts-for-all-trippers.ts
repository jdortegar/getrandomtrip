/**
 * Creates at least one published blog post for any tripper that has none.
 * Run: npx tsx scripts/ensure-posts-for-all-trippers.ts
 */

import { PrismaClient, BlogFormat, BlogStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trippers = await prisma.user.findMany({
    where: { role: 'TRIPPER' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  for (const tripper of trippers) {
    const count = await prisma.blogPost.count({
      where: { authorId: tripper.id, status: 'PUBLISHED' },
    });
    if (count > 0) continue;

    await prisma.blogPost.create({
      data: {
        authorId: tripper.id,
        title: `Primer post de ${tripper.name}`,
        subtitle: 'Contenido increíble en camino.',
        coverUrl:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
        travelType: 'solo',
        excuseKey: 'solo-adventure',
        tags: ['tripper', 'inspiracion'],
        format: BlogFormat.ARTICLE,
        status: BlogStatus.PUBLISHED,
        blocks: [
          {
            type: 'paragraph',
            text: `${tripper.name} está preparando historias y guías para vos. ¡Volvé pronto!`,
          },
        ],
        publishedAt: new Date(),
      },
    });
    console.log(`  ✅ Created 1 post for tripper: ${tripper.name}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
