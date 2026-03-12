'use client';

import React from 'react';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import Section from '@/components/layout/Section';
import { TestimonialCard } from './TestimonialCard';
import type { TestimonialData, TestimonialsContent } from './types';
import { EmblaOptionsType } from 'embla-carousel';

export type { TestimonialData, TestimonialsContent } from './types';

interface TestimonialsProps {
  content?: TestimonialsContent;
  eyebrow?: string;
  testimonials: TestimonialData[];
  testId?: string;
  subtitle?: string;
  title?: string;
  viewFullReviewLabel?: string;
}

export default function Testimonials({
  content,
  eyebrow,
  testimonials,
  testId = 'testimonials',
  subtitle,
  title,
  viewFullReviewLabel,
}: TestimonialsProps) {
  const {
    eyebrow: resolvedEyebrow,
    subtitle: resolvedSubtitle,
    title: resolvedTitle,
    viewFullReviewLabel: resolvedViewFullReviewLabel,
  } = {
    eyebrow: eyebrow ?? '',
    subtitle: subtitle ?? '',
    title: title ?? '',
    viewFullReviewLabel: viewFullReviewLabel ?? 'View full review',
    ...content,
  };

  return (
    <Section
      className="min-h-[60vh]"
      eyebrow={resolvedEyebrow}
      subtitle={resolvedSubtitle}
      title={resolvedTitle}
    >
      <div className="container mx-auto mt-12 px-4 md:px-20">
        <EmblaCarousel sliderPerView={3}>
          {testimonials.slice(0, 9).map((testimonial, index) => (
            <TestimonialCard
              index={index}
              key={`${testimonial.author}-${index}`}
              testimonial={testimonial}
              viewFullReviewLabel={resolvedViewFullReviewLabel}
            />
          ))}
        </EmblaCarousel>
      </div>
    </Section>
  );
}
