import type { Metadata } from 'next';

import Hero from '@/components/Hero';
import Paragraph from '@/components/Paragraph';
import CouplePlanner from '@/components/by-type/couple/CouplePlanner';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import { getTestimonialsByType } from '@/data/testimonials';
import { getBlogDataByPackage } from '@/data/blog';
import {
  coupleHeroContent,
  coupleVideoConfig,
  coupleStoryContent,
} from '@/data/couple';

export const metadata: Metadata = {
  title: 'En Pareja | Randomtrip',
};

export default function CouplePage() {
  const { testimonials, title } = getTestimonialsByType('couple');
  const blogData = getBlogDataByPackage('couple');

  return (
    <main className="relative">
      <Hero
        content={coupleHeroContent}
        videoConfig={coupleVideoConfig}
        id="couple-hero"
        className="h-[70vh]"
      />
      <Paragraph content={coupleStoryContent} id="couple-story" />
      <CouplePlanner />
      <Blog content={blogData} id="couple-blog" />
      <Testimonials testimonials={testimonials} title={title} />
    </main>
  );
}
