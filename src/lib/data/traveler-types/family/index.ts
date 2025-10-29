import type { TravelerTypeData } from '@/types/traveler-type';
import { familyMeta } from './meta';
import { familyHeroContent, familyStoryContent } from './content';
import { familyPlannerContent } from './planner';
import { familyBlogData } from './blog';
import { familyTestimonialsData } from './testimonials';

export const family: TravelerTypeData = {
  meta: familyMeta,
  content: { hero: familyHeroContent, story: familyStoryContent },
  planner: familyPlannerContent,
  blog: familyBlogData,
  testimonials: familyTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './blog';
export * from './testimonials';
