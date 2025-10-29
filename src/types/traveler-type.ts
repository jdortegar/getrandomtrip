import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export interface TravelerTypeMeta {
  slug: string;
  label: string;
  aliases: string[];
  pageTitle: string;
}

export interface TravelerTypeData {
  meta: TravelerTypeMeta;
  content: {
    hero: HeroContent;
    story: ParagraphContent;
  };
  planner: TypePlannerContent;
  blog: {
    title: string;
    subtitle: string;
    posts: BlogPost[];
    viewAll: BlogViewAll;
  };
  testimonials: {
    title: string;
    items: Testimonial[];
  };
}
