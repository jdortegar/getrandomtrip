// Couple Traveler Type - Structured Export
import type { TravelerTypeData } from '@/types/traveler-type';
import { coupleMeta } from './meta';
import { coupleHeroContent, coupleStoryContent } from './content';
import { couplePlannerContent } from './planner';
import { coupleTiers } from './tiers';
import { coupleBlogData } from './blog';
import { coupleTestimonialsData } from './testimonials';

export const couple: TravelerTypeData = {
  meta: coupleMeta,
  content: {
    hero: coupleHeroContent,
    story: coupleStoryContent,
  },
  planner: couplePlannerContent,
  tiers: coupleTiers,
  blog: coupleBlogData,
  testimonials: coupleTestimonialsData,
};

// Re-export individual pieces for backwards compatibility
export * from './meta';
export * from './content';
export * from './planner';
export * from './tiers';
export * from './alma-options';
export * from './blog';
export * from './testimonials';
