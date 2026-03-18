'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { getTiersForDisplay } from '@/lib/utils/experiencesData';

interface ExperienceLevelGridProps {
  className?: string;
  onSelect: (packageId: string) => void;
  /** Traveler type for level set; defaults to 'couple'. */
  type?: string;
}

export default function ExperienceLevelGrid({
  className,
  onSelect,
  type = 'couple',
}: ExperienceLevelGridProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const tiers = getTiersForDisplay(type, locale);

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className ?? ''}`}
    >
      {tiers.map((level) => (
        <div
          key={level.key}
          className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex-grow p-6">
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              {level.title}
            </h3>
            <p className="mb-4 text-sm text-gray-600">{level.tagline ?? ''}</p>
            <p className="mb-4 text-2xl font-extrabold text-[#D4AF37]">
              {level.price ?? ''}
            </p>
            <ul className="text-gray-700 text-sm space-y-2">
              {level.bullets.map((bullet, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 text-[#D4AF37] mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 border-t border-gray-100">
            <button
              className="w-full rounded-lg bg-[#D4AF37] py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#EACD65]"
              onClick={() => onSelect(level.key)}
              type="button"
            >
              {level.cta}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
