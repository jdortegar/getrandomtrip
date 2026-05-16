'use client';

import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import Section from '@/components/layout/Section';
import { TestimonialCard } from './TestimonialCard';
import type { TestimonialData } from './types';

export type { TestimonialData, TestimonialsContent } from './types';

interface TestimonialsProps {
  eyebrow?: string;
  subtitle?: string;
  title?: string;
  viewFullReviewLabel?: string;
  testimonials: TestimonialData[];
  featureColor?: string;
}

export default function Testimonials({
  eyebrow, subtitle, title, viewFullReviewLabel,
  testimonials,
  featureColor,
}: TestimonialsProps) {
  return (
    <Section
      className="min-h-[60vh]"
      eyebrow={eyebrow}
      eyebrowColor={featureColor}
      subtitle={subtitle}
      title={title}
      fullWidth
    >
      <EmblaCarousel accentColor={featureColor} slidesPerView={3} overflow="both">
        {testimonials.slice(0, 9).map((testimonial, index) => (
          <TestimonialCard
            accentColor={featureColor}
            index={index}
            key={`${testimonial.author}-${index}`}
            testimonial={testimonial}
            viewFullReviewLabel={viewFullReviewLabel ?? 'View full review'}
          />
        ))}
      </EmblaCarousel>
    </Section>
  );
}
