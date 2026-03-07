'use client';

import React from 'react';
import { EmblaCarousel } from '@/components/EmblaCarousel';
import Section from '@/components/layout/Section';
import { TestimonialCard } from './TestimonialCard';
import type { TestimonialData, TestimonialsContent } from './types';

export type { TestimonialData, TestimonialsContent } from './types';

interface TestimonialsProps {
  content: TestimonialsContent;
  testimonials: TestimonialData[];
}

export default function Testimonials({
  content,
  testimonials,
}: TestimonialsProps) {
  const {
    eyebrow = '',
    subtitle = '',
    title = '',
    viewFullReviewLabel = '',
  } = content;

  return (
    <Section
      className="min-h-[60vh]"
      eyebrow={eyebrow}
      subtitle={subtitle}
      title={title}
    >
      <div className="container mx-auto mt-12 px-4 md:px-20">
        <EmblaCarousel
          align={testimonials.length < 3 ? 'center' : 'start'}
          gap={24}
          showArrows
          showDots
          slidesPerView={3}
          slidesToScroll={1}
        >
          {testimonials.slice(0, 9).map((testimonial, index) => (
            <TestimonialCard
              index={index}
              key={`${testimonial.author}-${index}`}
              testimonial={testimonial}
              viewFullReviewLabel={viewFullReviewLabel}
            />
          ))}
        </EmblaCarousel>
      </div>
    </Section>
  );
}
