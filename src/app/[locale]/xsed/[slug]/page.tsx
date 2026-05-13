import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { XsedInternalHero } from '@/components/app/xsed/XsedInternalHero';
import { XsedDropBody } from '@/components/app/xsed/XsedDropBody';
import LightboxCarousel from '@/components/media/LightboxCarousel';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import Section from '@/components/layout/Section';

type Props = {
  params: Promise<{ locale?: string; slug?: string }>;
};

export default async function XsedInternalPage({ params }: Props) {
  const { slug } = await params;

  if (!slug) notFound();

  const [drop, dropNumber] = await Promise.all([
    prisma.xsedExperience.findUnique({
      where: { slug },
      include: {
        benefits: {
          orderBy: { sortOrder: 'asc' },
          include: {
            photos: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    }),
    prisma.xsedExperience.count({
      where: {
        status: 'ACTIVE',
        tripDate: { lte: new Date() },
      },
    }),
  ]);

  if (!drop || drop.status !== 'ACTIVE') notFound();

  const title = drop.titlePublicTeaser ?? drop.titleInternal;
  const heroImage = drop.heroImage ?? '/images/drops/drops-mendoza.jpg';

  const date = drop.tripDate
    ? drop.tripDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).toUpperCase()
    : '';

  const article = drop.benefits.map((b) => ({
    id: b.type.toLowerCase(),
    title: b.name ?? b.type,
    content: b.customerVisibleNotes ?? '',
    images: b.photos.map((p) => ({ url: p.url, caption: p.altText ?? undefined })),
  }));

  const galleryImages = drop.benefits
    .flatMap((b) => b.photos)
    .filter((p) => p.type === 'gallery')
    .map((p) => ({ url: p.url, caption: p.altText ?? undefined }));

  const heroContent = {
    dropNumber: dropNumber + 1,
    date,
    title,
    backgroundImage: heroImage,
  };

  return (
    <>
      <XsedInternalHero content={heroContent} />
      <Section className="md:px-20 px-4">
        <Breadcrumb
          items={[
            { href: '/xsed', label: 'Bitácora de escapadas' },
            { label: `Nº${dropNumber + 1}` },
          ]}
        />
        <XsedDropBody content={article} />
      </Section>
      {galleryImages.length > 0 && (
        <LightboxCarousel images={galleryImages} className="bg-gray-100" />
      )}
    </>
  );
}
