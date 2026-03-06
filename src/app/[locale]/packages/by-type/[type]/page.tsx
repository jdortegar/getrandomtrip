import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Hero from '@/components/Hero';
import Paragraph from '@/components/Paragraph';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import TypePlanner from '@/components/by-type/TypePlanner';
import InspirationBanner from '@/components/InspirationBanner';
import {
  getTravelerType,
  getAllTravelerTypePaths,
  type TravelerTypeSlug,
} from '@/lib/data/traveler-types';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

/**
 * Generate static paths for all traveler types and their aliases.
 * Parent [locale] segment provides locale; we only provide type.
 */
export async function generateStaticParams() {
  const paths = getAllTravelerTypePaths();
  return paths.map((type) => ({ type }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: { locale?: string; type: string };
}): Promise<Metadata> {
  const locale = hasLocale(params?.locale) ? (params.locale as Locale) : ('es' as Locale);
  const typeData = getTravelerType(params.type, locale);

  if (!typeData) {
    return { title: 'Randomtrip' };
  }

  return {
    title: typeData.meta.pageTitle,
  };
}

/**
 * Main page component. Params include parent [locale] and this segment [type].
 */
export default async function TravelerTypePage({
  params,
}: {
  params: { locale?: string; type: string };
}) {
  const locale = hasLocale(params.locale) ? (params.locale as Locale) : ('es' as Locale);
  const typeData = getTravelerType(params.type, locale);

  if (!typeData) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const { blogEyebrow, inspirationBanner } = dict.packagesByType;
  const blogHref = pathForLocale(locale, '/blog');
  const viewAll = typeData.blog.viewAll
    ? { ...typeData.blog.viewAll, href: pathForLocale(locale, typeData.blog.viewAll.href) }
    : undefined;

  return (
    <main className="relative">
      <Hero
        content={typeData.content.hero}
        id={`${typeData.meta.slug}-hero`}
        scrollIndicator={true}
      />
      <Paragraph
        content={typeData.content.story}
        id={`${typeData.meta.slug}-story`}
      />
      <TypePlanner
        content={typeData.planner}
        fullViewportWidth
        type={typeData.meta.slug as TravelerTypeSlug}
        itemsPerView={3}
      />
      <Blog
        eyebrow={blogEyebrow}
        id={`${typeData.meta.slug}-blog`}
        posts={typeData.blog.posts}
        subtitle={typeData.blog.subtitle}
        title={typeData.blog.title}
        viewAll={viewAll}
      />
      <InspirationBanner
        buttonHref={blogHref}
        buttonText={inspirationBanner.buttonText}
        eyebrow={inspirationBanner.eyebrow}
        image="/images/caravan.png"
        labelText={inspirationBanner.labelText}
        title={inspirationBanner.title}
      />
      <Testimonials
        testimonials={typeData.testimonials.items}
        title={typeData.testimonials.title}
      />
    </main>
  );
}
