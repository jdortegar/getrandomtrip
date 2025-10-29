import type { TravelerTypeData } from '@/types/traveler-type';
import { soloMeta } from './meta';
import { soloHeroContent, soloStoryContent } from './content';
import { soloPlannerContent } from './planner';
import { soloBlogData } from './blog';
import { soloTestimonialsData } from './testimonials';

export const solo: TravelerTypeData = {
  meta: soloMeta,
  content: { hero: soloHeroContent, story: soloStoryContent },
  planner: soloPlannerContent,
  blog: soloBlogData,
  testimonials: soloTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './blog';
export * from './testimonials';
