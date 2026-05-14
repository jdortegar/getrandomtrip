import { notFound } from 'next/navigation';
import Testimonials from '@/components/Testimonials';
import { XsedInternalHero } from '@/components/app/xsed/XsedInternalHero';
import { XsedDropBody } from '@/components/app/xsed/XsedDropBody';
import LightboxCarousel from '@/components/media/LightboxCarousel';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import Section from '@/components/layout/Section';
import { XSED_TESTIMONIALS } from '@/lib/data/xsed-testimonials';
import { hasLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { prisma } from '@/lib/prisma';
import { getXsedDropTestimonials } from '@/lib/xsed/get-xsed-drop-testimonials';

type Props = {
  params: Promise<{ locale?: string; slug?: string }>;
};

export default async function XsedInternalPage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;

  if (!slug) notFound();

  const [drop] = await Promise.all([
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
  ]);

  if (!drop || drop.status !== 'ACTIVE') notFound();

  const normalizedLocale = hasLocale(rawLocale) ? rawLocale : 'es';
  const [dropTestimonials, dict] = await Promise.all([
    getXsedDropTestimonials(drop.id),
    getDictionary(normalizedLocale),
  ]);
  const title = drop.titlePublicTeaser ?? drop.titleInternal;
  const heroImage = drop.heroImage ?? '/images/drops/drops-mendoza.jpg';

  const dropNumber = Number(drop.slug);

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
    dropNumber,
    date,
    title,
    backgroundImage: heroImage,
  };

  const testimonials =
    dropTestimonials.length > 0 ? dropTestimonials : XSED_TESTIMONIALS;

  return (
    <>
      <XsedInternalHero content={heroContent} />
      <Section className="md:px-20 px-4">
        <Breadcrumb
          items={[
            { href: '/xsed', label: 'Bitácora de escapadas' },
            { label: `Nº ${dropNumber}` },
          ]}
        />
        <XsedDropBody content={article} />
      </Section>
      {galleryImages.length > 0 && (
        <LightboxCarousel images={galleryImages} className="bg-gray-100" />
      )}
      <Testimonials
        content={dict.xsedPage.testimonials}
        featureColor="#D97E4A"
        testimonials={testimonials}
      />
    </>
  );
}
