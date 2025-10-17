import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Hero from '@/components/Hero';
import Paragraph from '@/components/Paragraph';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import { getTestimonialsByType } from '@/lib/data/content/testimonials';
import { getBlogDataByPackage } from '@/lib/data/content/blog';
import { coupleHeroContent, coupleStoryContent } from '@/lib/data/content/couple';
import { soloHeroContent, soloStoryContent } from '@/lib/data/content/solo';
import { familyHeroContent, familyStoryContent } from '@/lib/data/content/family';
import { groupHeroContent, groupStoryContent } from '@/lib/data/content/group';
import { honeymoonHeroContent, honeymoonStoryContent } from '@/lib/data/content/honeymoon';
import { pawsHeroContent, pawsStoryContent } from '@/lib/data/content/paws';
import { couplePlannerContent } from '@/lib/data/planners/couple';
import { soloPlannerContent } from '@/lib/data/planners/solo';
import { familyPlannerContent } from '@/lib/data/planners/family';
import { groupPlannerContent } from '@/lib/data/planners/group';
import { honeymoonPlannerContent } from '@/lib/data/planners/honeymoon';
import { pawsPlannerContent } from '@/lib/data/planners/paws';

// Import centralized planner
import TypePlanner from '@/components/by-type/TypePlanner';
import type { TypePlannerContent } from '@/types/planner';

// Define valid traveler types
const VALID_TYPES = [
  'couple',
  'solo',
  'family',
  'group',
  'honeymoon',
  'paws',
  'parejas',
  'pareja',
  'couples',
  'familia',
  'families',
  'grupo',
  'amigos',
  'luna-de-miel',
  'mascotas',
] as const;
type ValidType = (typeof VALID_TYPES)[number];

// Normalize type variants to canonical form
function normalizeType(
  type: string,
): 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws' | null {
  const normalized = type.toLowerCase();

  if (['couple', 'parejas', 'pareja', 'couples'].includes(normalized)) {
    return 'couple';
  }

  if (normalized === 'solo') {
    return 'solo';
  }

  if (['family', 'familia', 'families'].includes(normalized)) {
    return 'family';
  }

  if (['group', 'grupo', 'amigos'].includes(normalized)) {
    return 'group';
  }

  if (['honeymoon', 'luna-de-miel'].includes(normalized)) {
    return 'honeymoon';
  }

  if (['paws', 'mascotas'].includes(normalized)) {
    return 'paws';
  }

  return null;
}

// Get content based on type
function getContentByType(
  type: 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws',
) {
  switch (type) {
    case 'couple':
      return {
        hero: coupleHeroContent,
        story: coupleStoryContent,
        plannerContent: couplePlannerContent,
      };
    case 'solo':
      return {
        hero: soloHeroContent,
        story: soloStoryContent,
        plannerContent: soloPlannerContent,
      };
    case 'family':
      return {
        hero: familyHeroContent,
        story: familyStoryContent,
        plannerContent: familyPlannerContent,
      };
    case 'group':
      return {
        hero: groupHeroContent,
        story: groupStoryContent,
        plannerContent: groupPlannerContent,
      };
    case 'honeymoon':
      return {
        hero: honeymoonHeroContent,
        story: honeymoonStoryContent,
        plannerContent: honeymoonPlannerContent,
      };
    case 'paws':
      return {
        hero: pawsHeroContent,
        story: pawsStoryContent,
        plannerContent: pawsPlannerContent,
      };
    default:
      return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { type: string };
}): Promise<Metadata> {
  const normalizedType = normalizeType(params.type);

  if (!normalizedType) {
    return { title: 'Randomtrip' };
  }

  const titles = {
    couple: 'En Pareja | Randomtrip',
    solo: 'Solo | Randomtrip',
    family: 'En Familia | Randomtrip',
    group: 'En Grupo | Randomtrip',
    honeymoon: 'Luna de Miel | Randomtrip',
    paws: 'PAWS | Randomtrip',
  };

  return {
    title: titles[normalizedType],
  };
}

export default function TravelerTypePage({
  params,
}: {
  params: { type: string };
}) {
  const normalizedType = normalizeType(params.type);

  if (!normalizedType) {
    notFound();
  }

  const content = getContentByType(normalizedType);

  if (!content) {
    notFound();
  }

  const { hero, story, plannerContent } = content;
  const { testimonials, title } = getTestimonialsByType(normalizedType);
  const blogData = getBlogDataByPackage(normalizedType);

  return (
    <main className="relative">
      <Hero content={hero} id={`${normalizedType}-hero`} className="h-[70vh]" />
      <Paragraph content={story} id={`${normalizedType}-story`} />
      <TypePlanner content={plannerContent} type={normalizedType} />
      <Blog content={blogData} id={`${normalizedType}-blog`} />
      <Testimonials testimonials={testimonials} title={title} />
    </main>
  );
}
