/**
 * Ensures the mockup blog post exists at /blog/aventura-acuatica with status PUBLISHED.
 * Run: npx tsx scripts/ensure-blog-mockup.ts
 */
import 'dotenv/config';
import { PrismaClient, BlogStatus, BlogFormat } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ['error'] } : { log: ['error'] }) as object,
);

const MOCKUP_POST_ID = 'cmly0imzt000bgg1gosc0dow9';
const SLUG = 'aventura-acuatica';

const mockupContent = `<p>El Caribe no es solo sol y playa: es buceo en arrecifes vivos, snorkel con tortugas y atardeceres que no se olvidan. En esta guía te cuento cómo armé mi primera semana acuática y qué me hubiera gustado saber antes.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&amp;q=80" alt="Snorkel en aguas cristalinas" class="w-full rounded-xl" />
  <figcaption class="mt-2 text-left text-sm italic text-neutral-500">Snorkel en aguas cristalinas</figcaption>
</figure>
<p>Elegí una base en la costa y desde ahí hice excursiones de un día. Así evité cambiar de alojamiento cada noche y pude repetir los spots que más me gustaron. La clave está en contratar lanchas locales y salir temprano.</p>
<blockquote class="my-8 border-l-4 border-neutral-800 pl-6 text-xl italic text-neutral-700">"El mar nos devuelve lo que le damos: respeto y curiosidad." <cite class="block mt-2 text-base not-italic text-neutral-500">— Jacques Cousteau</cite></blockquote>
<p>Si es tu primera vez, invierte en un buen curso de snorkel o un bautismo de buceo. La diferencia entre ver peces desde la superficie y bajar unos metros es enorme. Yo lo hice el segundo día y no me arrepiento.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&amp;q=80" alt="Atardecer desde la playa" class="w-full rounded-xl" />
  <figcaption class="mt-2 text-left text-sm italic text-neutral-500">Atardecer desde la playa</figcaption>
</figure>
<p>Lleva protector solar biodegradable y no toques el coral. Con pequeños gestos mantenemos estos lugares para los que vienen después.</p>`;

const mockupData = {
  slug: SLUG,
  title: 'Aventura Acuática en el Caribe',
  subtitle: 'Buceo, snorkel y playas secretas en una semana',
  tagline: 'Guía práctica para tu primera escapada al mar',
  coverUrl:
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
  content: mockupContent,
  blocks: [
    {
      type: 'paragraph',
      text: 'El Caribe no es solo sol y playa: es buceo en arrecifes vivos, snorkel con tortugas y atardeceres que no se olvidan. En esta guía te cuento cómo armé mi primera semana acuática y qué me hubiera gustado saber antes.',
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
      caption: 'Snorkel en aguas cristalinas',
    },
    {
      type: 'paragraph',
      text: 'Elegí una base en la costa y desde ahí hice excursiones de un día. Así evité cambiar de alojamiento cada noche y pude repetir los spots que más me gustaron. La clave está en contratar lanchas locales y salir temprano.',
    },
    {
      type: 'quote',
      text: 'El mar nos devuelve lo que le damos: respeto y curiosidad.',
      cite: 'Jacques Cousteau',
    },
    {
      type: 'paragraph',
      text: 'Si es tu primera vez, invierte en un buen curso de snorkel o un bautismo de buceo. La diferencia entre ver peces desde la superficie y bajar unos metros es enorme. Yo lo hice el segundo día y no me arrepiento.',
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      caption: 'Atardecer desde la playa',
    },
    {
      type: 'paragraph',
      text: 'Lleva protector solar biodegradable y no toques el coral. Con pequeños gestos mantenemos estos lugares para los que vienen después.',
    },
  ],
  tags: ['caribe', 'buceo', 'snorkel', 'playas', 'aventura'],
  travelType: 'solo',
  excuseKey: 'solo-adventure',
  format: BlogFormat.ARTICLE,
  status: BlogStatus.PUBLISHED,
  seo: {
    title: 'Aventura Acuática en el Caribe - Guía práctica',
    description:
      'Buceo, snorkel y playas secretas: cómo planear tu primera semana en el Caribe',
    keywords: ['caribe', 'buceo', 'snorkel', 'playas', 'guía'],
  },
  publishedAt: new Date('2024-05-20'),
  faq: {
    items: [
      {
        question: '¿Hace falta saber nadar para hacer snorkel?',
        answer:
          'Sí, es recomendable sentirse cómodo en el agua. En muchas excursiones te dan chaleco y puedes flotar sin esfuerzo, pero saber nadar te da seguridad y te permite moverte mejor.',
      },
      {
        question: '¿Cuál es la mejor época para el Caribe?',
        answer:
          'Diciembre a abril suele tener menos lluvia y mar más tranquilo. De junio a noviembre es temporada de huracanes en la región; sigue el pronóstico si viajas en esas fechas.',
      },
      {
        question: '¿Necesito certificación para bucear?',
        answer:
          'Para un bautismo (inmersión guiada hasta ~12 m) no. Para inmersiones más profundas o repetidas, sí: el curso Open Water es el estándar y vale la pena.',
      },
    ],
  },
};

async function main() {
  const author =
    (await prisma.user.findFirst({
      where: { tripperSlug: 'dawson' },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: 'TRIPPER' },
      select: { id: true },
    }));

  if (!author) {
    console.error(
      'No tripper found. Run the full seed first: npx tsx scripts/seed-trippers-packages.ts',
    );
    process.exit(1);
  }

  await prisma.blogPost.upsert({
    where: { id: MOCKUP_POST_ID },
    create: {
      id: MOCKUP_POST_ID,
      authorId: author.id,
      ...mockupData,
    },
    update: mockupData,
  });

  console.log(`✅ Mockup post ensured at /blog/${SLUG} (id: ${MOCKUP_POST_ID}, status: PUBLISHED)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
