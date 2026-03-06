'use client';

import React from 'react';
import CountryFlag from '@/components/common/CountryFlag';
import Img from '@/components/common/Img';
import { getInitial } from '@/lib/helpers/stringHelpers';
import type { TestimonialData } from './types';

interface TestimonialCardProps {
  index: number;
  testimonial: TestimonialData;
  viewFullReviewLabel: string;
}

export function TestimonialCard({
  index,
  testimonial,
  viewFullReviewLabel,
}: TestimonialCardProps) {
  const { author, avatarUrl, country, countryCode, quote, reviewUrl } =
    testimonial;
  const initial = getInitial(author);

  return (
    <div className="relative flex h-full min-h-[250px] flex-col justify-around overflow-visible rounded-md border border-neutral-200 bg-white p-6 text-center shadow-sm">
      <p className="mb-6 font-barlow text-lg leading-relaxed text-[#888]">
        &quot;{quote}&quot;
      </p>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#333] font-barlow text-base font-semibold text-white">
            {avatarUrl ? (
              <Img
                alt={author}
                className="h-full w-full object-cover"
                height={40}
                src={avatarUrl}
                width={40}
              />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
          <div className="flex flex-col items-start text-left font-barlow">
            <h4 className="font-semibold text-xl text-[#333]">{author}</h4>
            <p className="text-xs font-medium text-[#666]">
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
        {reviewUrl && (
          <a
            className="mt-6 block cursor-pointer font-barlow text-base font-medium text-[#1A73E8] hover:underline"
            href={reviewUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {viewFullReviewLabel}
          </a>
        )}
      </div>
    </div>
  );
}
