/**
 * Updates existing blog posts: coverUrl (Unsplash), travelType, excuseKey.
 * Run: npx tsx scripts/update-blog-cover-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UNSPLASH_COVER_URLS = [
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80',
  'https://images.unsplash.com/photo-1488459716781-31db59582ba4?w=1200&q=80',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
];

/** travelType, excuseKey per post index (matches seed order). */
const TRAVEL_EXCUSE_BY_INDEX: { excuseKey: string; travelType: string }[] = [
  { excuseKey: 'solo-adventure', travelType: 'solo' },
  { excuseKey: 'cultural-immersion', travelType: 'solo' },
  { excuseKey: 'solo-adventure', travelType: 'solo' },
  { excuseKey: 'cultural-immersion', travelType: 'couple' },
  { excuseKey: 'solo-adventure', travelType: 'solo' },
  { excuseKey: 'family-adventure', travelType: 'family' },
  { excuseKey: 'romantic-getaway', travelType: 'honeymoon' },
  { excuseKey: 'solo-adventure', travelType: 'solo' },
];

async function main() {
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, title: true, coverUrl: true, travelType: true, excuseKey: true },
  });

  const needsCover = posts.filter(
    (p) =>
      !p.coverUrl || !p.coverUrl.startsWith('https://images.unsplash.com'),
  );
  const needsTravelExcuse = posts.filter(
    (p) => p.travelType == null || p.excuseKey == null,
  );

  if (needsCover.length === 0 && needsTravelExcuse.length === 0) {
    console.log('All blog posts already have cover URLs, travelType and excuseKey.');
    return;
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const meta = TRAVEL_EXCUSE_BY_INDEX[i % TRAVEL_EXCUSE_BY_INDEX.length];
    const coverUrl =
      !post.coverUrl || !post.coverUrl.startsWith('https://images.unsplash.com')
        ? UNSPLASH_COVER_URLS[i % UNSPLASH_COVER_URLS.length]
        : undefined;
    const travelType = post.travelType == null ? meta.travelType : undefined;
    const excuseKey = post.excuseKey == null ? meta.excuseKey : undefined;

    if (coverUrl ?? travelType ?? excuseKey) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          ...(coverUrl != null && { coverUrl }),
          ...(travelType != null && { travelType }),
          ...(excuseKey != null && { excuseKey }),
        },
      });
      const parts = [
        coverUrl && 'cover',
        travelType && 'travelType',
        excuseKey && 'excuseKey',
      ].filter(Boolean);
      console.log(`  ✅ ${post.title} → ${parts.join(', ')}`);
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
