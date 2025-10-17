import type { TravelerTypeData } from '@/types/traveler-type';
import { familyMeta } from './meta';
import { familyHeroContent, familyStoryContent } from './content';
import { familyPlannerContent } from './planner';
import { familyTiers } from './tiers';
import { familyBlogData } from './blog';
import { familyTestimonialsData } from './testimonials';

export const family: TravelerTypeData = {
  meta: familyMeta,
  content: { hero: familyHeroContent, story: familyStoryContent },
  planner: familyPlannerContent,
  tiers: familyTiers,
  blog: familyBlogData,
  testimonials: familyTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './tiers';
export * from './alma-options';
export * from './blog';
export * from './testimonials';
