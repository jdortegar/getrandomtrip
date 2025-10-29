import type { TravelerTypeData } from '@/types/traveler-type';
import { honeymoonMeta } from './meta';
import { honeymoonHeroContent, honeymoonStoryContent } from './content';
import { honeymoonPlannerContent } from './planner';
import { honeymoonBlogData } from './blog';
import { honeymoonTestimonialsData } from './testimonials';

export const honeymoon: TravelerTypeData = {
  meta: honeymoonMeta,
  content: { hero: honeymoonHeroContent, story: honeymoonStoryContent },
  planner: honeymoonPlannerContent,
  blog: honeymoonBlogData,
  testimonials: honeymoonTestimonialsData,
};

export * from './meta';
export * from './content';
export * from './planner';
export * from './blog';
export * from './testimonials';
