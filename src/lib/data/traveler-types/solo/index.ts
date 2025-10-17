import type { TravelerTypeData } from '@/types/traveler-type';
import { soloMeta } from './meta';
import { soloHeroContent, soloStoryContent } from './content';
import { soloPlannerContent } from './planner';
import { soloTiers } from './tiers';
import { soloBlogData } from './blog';
import { soloTestimonialsData } from './testimonials';

export const solo: TravelerTypeData = {
  meta: soloMeta,
  content: { hero: soloHeroContent, story: soloStoryContent },
  planner: soloPlannerContent,
  tiers: soloTiers,
  blog: soloBlogData,
  testimonials: soloTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './tiers';
export * from './alma-options';
export * from './blog';
export * from './testimonials';
