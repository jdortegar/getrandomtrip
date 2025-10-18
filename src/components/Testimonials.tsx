'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Section from './layout/Section';

export interface TestimonialData {
  quote: string;
  author: string;
  city: string;
}

interface TestimonialsProps {
  testimonials: TestimonialData[];
  title: string;
  testId?: string;
}

export default function Testimonials({
  testimonials,
  title,
  testId = 'testimonials',
}: TestimonialsProps) {
  // Group testimonials into sets of 3 for the carousel
  const testimonialGroups = React.useMemo(() => {
    const groups = [];
    for (let i = 0; i < testimonials.length; i += 3) {
      groups.push(testimonials.slice(i, i + 3));
    }
    return groups;
  }, [testimonials]);

  return (
    <Section
      title={title}
      subtitle="Tu próximo recuerdo inolvidable está a un solo click de distancia.
            No lo pienses más."
      className=" min-h-[60vh]"
    >
      {/* Carousel Section - 70% of available space */}
      <div className="flex-1 flex items-center justify-center relative">
        <Carousel
          opts={{
            align: 'center',
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {testimonialGroups.map((group, groupIndex) => (
              <CarouselItem key={groupIndex} className="pl-2 md:pl-4">
                <div className="grid md:grid-cols-3 gap-6 px-4">
                  {group.map((testimonial, index) => (
                    <div
                      key={`${testimonial.author}-${index}`}
                      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm text-primary h-full flex flex-col justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-md text-neutral-700 leading-relaxed font-jost italic mb-6">
                          &quot;{testimonial.quote}&quot;
                        </p>
                      </div>
                      <div className="mt-auto">
                        <h4 className="text-xl md:text-2xl font-bold font-caveat">
                          {testimonial.author}
                        </h4>
                        <p className="text-sm text-neutral-600 font-jost">
                          {testimonial.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </Section>
  );
}
