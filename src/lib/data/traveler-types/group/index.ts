import type { TravelerTypeData } from '@/types/traveler-type';
import { groupMeta } from './meta';
import { groupHeroContent, groupStoryContent } from './content';
import { groupPlannerContent } from './planner';
import { groupBlogData } from './blog';
import { groupTestimonialsData } from './testimonials';

export const group: TravelerTypeData = {
  meta: groupMeta,
  content: { hero: groupHeroContent, story: groupStoryContent },
  planner: groupPlannerContent,
  blog: groupBlogData,
  testimonials: groupTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './blog';
export * from './testimonials';
