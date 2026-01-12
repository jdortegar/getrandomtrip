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
} from '@/lib/data/traveler-types';

/**
 * Generate static paths for all traveler types and their aliases
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
  params: { type: string };
}): Promise<Metadata> {
  const typeData = getTravelerType(params.type);

  if (!typeData) {
    return { title: 'Randomtrip' };
  }

  return {
    title: typeData.meta.pageTitle,
  };
}

/**
 * Main page component
 */
export default function TravelerTypePage({
  params,
}: {
  params: { type: string };
}) {
  const typeData = getTravelerType(params.type);

  if (!typeData) {
    notFound();
  }

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
      <TypePlanner content={typeData.planner} type={typeData.meta.slug} />
      <Blog
        eyebrow="Lorem ipsum dolor sit amet"
        title={typeData.blog.title}
        subtitle={typeData.blog.subtitle}
        posts={typeData.blog.posts}
        viewAll={typeData.blog.viewAll}
        id={`${typeData.meta.slug}-blog`}
      />
      <InspirationBanner
        buttonHref="/blog"
        buttonText="Historias inspiradoras"
        eyebrow="INSPIRACIÓN"
        image="/images/caravan.png"
        title="Historias de viajeros solitarios que inspiran "
      />
      <Testimonials
        testimonials={typeData.testimonials.items}
        title={typeData.testimonials.title}
      />
    </main>
  );
}
