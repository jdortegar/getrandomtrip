'use client';

import { useEffect, useRef } from 'react';

import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { type Testimonial } from '@/lib/types';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      // Screen size check logic can be added here if needed
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handlePrevious = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth =
        container.querySelector('.testimonial-card')?.clientWidth || 0;
      const gap = 24; // 6 * 4 (gap-6 = 1.5rem = 24px)
      const scrollAmount = cardWidth + gap;

      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth =
        container.querySelector('.testimonial-card')?.clientWidth || 0;
      const gap = 24; // 6 * 4 (gap-6 = 1.5rem = 24px)
      const scrollAmount = cardWidth + gap;

      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMoreTestimonials = () => {
    // Navigate to testimonials page or open modal
    console.log('View more testimonials');
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-16">
          <div className="mb-8 lg:mb-0">
            <p className="text-sm font-medium text-gray-600 mb-2">
              +250.000 AVENTUREROS
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              NUESTROS VIAJEROS NOS ADORAN
            </h2>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 rounded-full border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleNext}
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 rounded-full border-gray-300 hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative mb-12">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide"
          >
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="testimonial-card flex-shrink-0 w-80 p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="flex items-center space-x-1 mr-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {testimonial.rating}/5
                  </span>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">
                  &ldquo;{testimonial.review}&rdquo;
                </p>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={handleMoreTestimonials}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Ver más testimonios
          </Button>
        </div>
      </div>
    </section>
  );
}
