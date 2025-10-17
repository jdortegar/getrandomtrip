import type { TravelerTypeData } from '@/types/traveler-type';
import { pawsMeta } from './meta';
import { pawsHeroContent, pawsStoryContent } from './content';
import { pawsPlannerContent } from './planner';
import { pawsTiers } from './tiers';
import { pawsBlogData } from './blog';
import { pawsTestimonialsData } from './testimonials';

export const paws: TravelerTypeData = {
  meta: pawsMeta,
  content: { hero: pawsHeroContent, story: pawsStoryContent },
  planner: pawsPlannerContent,
  tiers: pawsTiers,
  blog: pawsBlogData,
  testimonials: pawsTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './tiers';
export * from './alma-options';
export * from './blog';
export * from './testimonials';
