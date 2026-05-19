'use client';

import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import Section from '@/components/layout/Section';
import { TestimonialCard } from './TestimonialCard';
import type { TestimonialData } from './types';
import { useDictionary } from '@/hooks/useDictionary';

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
  const dict = useDictionary((d) => d.xsedPage.testimonials);
  const resolvedTitle = title ?? dict.title;
  const resolvedSubtitle = subtitle ?? dict.subtitle;
  const resolvedEyebrow = eyebrow ?? dict.eyebrow;
  const resolvedViewFullReviewLabel = viewFullReviewLabel ?? dict.viewFullReviewLabel;
  return (
    <Section
      className="min-h-[60vh]"
      eyebrow={resolvedEyebrow}
      eyebrowColor={featureColor}
      subtitle={resolvedSubtitle}
      title={resolvedTitle}
      fullWidth
    >
      <EmblaCarousel accentColor={featureColor} slidesPerView={3} overflow="both">
        {testimonials.slice(0, 9).map((testimonial, index) => (
          <TestimonialCard
            accentColor={featureColor}
            index={index}
            key={`${testimonial.author}-${index}`}
            testimonial={testimonial}
            viewFullReviewLabel={resolvedViewFullReviewLabel}
          />
        ))}
      </EmblaCarousel>
    </Section>
  );
}
