'use client';

import React from 'react';
import { Carousel } from '@/components/Carousel';
import CountryFlag from '@/components/common/CountryFlag';
import Img from '@/components/common/Img';
import Section from './layout/Section';

export interface TestimonialData {
  author: string;
  avatarUrl?: string;
  country: string;
  countryCode?: string;
  quote: string;
  reviewUrl?: string;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

interface TestimonialCardProps {
  index: number;
  testimonial: TestimonialData;
}

function TestimonialCard({ index, testimonial }: TestimonialCardProps) {
  const { author, avatarUrl, country, countryCode, quote, reviewUrl } =
    testimonial;
  const initial = getInitial(author);

  return (
    <div className="relative flex h-full min-h-[250px] flex-col justify-around overflow-visible rounded-md border border-neutral-200 bg-white p-6 shadow-sm text-center">
      <p className="mb-6 font-barlow leading-relaxed text-lg text-[#888]">
        &quot;{quote}&quot;
      </p>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#333] font-semibold text-base text-white">
            {avatarUrl ? (
              <Img
                alt={author}
                className="h-full object-cover w-full"
                height={40}
                src={avatarUrl}
                width={40}
              />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
          <div className="flex flex-col font-barlow items-start text-left">
            <h4 className="font-semibold  text-xl text-[#333]">{author}</h4>
            <p className="font-medium text-[#666] text-xs">
              <span className="inline-flex items-center gap-1.5">
                {(countryCode || country) && (
                  <CountryFlag
                    className="shrink-0 scale-[1.5]"
                    country={country}
                    countryCode={countryCode}
                    title={country}
                  />
                )}
                {country}
              </span>
            </p>
          </div>
        </div>
        <a
          className="mt-6 block font-barlow text-[#1A73E8] text-base font-medium cursor-pointer hover:underline"
          href={reviewUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Ver opinión completa
        </a>
      </div>
    </div>
  );
}

interface TestimonialsProps {
  eyebrow?: string;
  testimonials: TestimonialData[];
  title: string;
  testId?: string;
}

export default function Testimonials({
  eyebrow,
  testimonials,
  title,
  testId = 'testimonials',
}: TestimonialsProps) {
  const testimonialGroups = React.useMemo(() => {
    const groups = [];
    for (let i = 0; i < testimonials.length; i += 3) {
      groups.push(testimonials.slice(i, i + 3));
    }
    return groups;
  }, [testimonials]);

  return (
    <Section
      className="min-h-[60vh]"
      eyebrow="opiniones de viajeros"
      subtitle="Tu próximo recuerdo inolvidable está a un solo click de distancia. No lo pienses más."
      title={title}
    >
      <div className="relative">
        <Carousel
          classes={{ content: 'items-start' }}
          fullViewportWidth
          itemClassName="min-w-0 shrink-0 basis-full"
          showArrows
          showDots
          slidesToScroll={1}
        >
          {testimonialGroups.map((group, groupIndex) => (
            <div
              className="grid auto-rows-fr gap-6 px-4 md:grid-cols-3"
              key={groupIndex}
            >
              {group.map((testimonial, index) => (
                <TestimonialCard
                  index={index}
                  key={`${testimonial.author}-${index}`}
                  testimonial={testimonial}
                />
              ))}
            </div>
          ))}
        </Carousel>
      </div>
    </Section>
  );
}
