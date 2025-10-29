import type { TravelerTypeData } from '@/types/traveler-type';
import { pawsMeta } from './meta';
import { pawsHeroContent, pawsStoryContent } from './content';
import { pawsPlannerContent } from './planner';
import { pawsBlogData } from './blog';
import { pawsTestimonialsData } from './testimonials';

export const paws: TravelerTypeData = {
  meta: pawsMeta,
  content: { hero: pawsHeroContent, story: pawsStoryContent },
  planner: pawsPlannerContent,
  blog: pawsBlogData,
  testimonials: pawsTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './blog';
export * from './testimonials';
