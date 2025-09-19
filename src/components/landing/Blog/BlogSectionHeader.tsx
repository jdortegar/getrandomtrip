'use client';

import React from 'react';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';

interface BlogSectionHeaderProps {
  onScroll: (direction: 'left' | 'right') => void;
}

export function BlogSectionHeader({ onScroll }: BlogSectionHeaderProps) {
  return (
    <div className="md:col-span-1 text-left">
      <h2 className="font-caveat text-5xl font-bold text-white">
        {BLOG_CONSTANTS.SECTION.TITLE}
      </h2>
      <p className="font-jost text-lg text-gray-300 mt-4">
        {BLOG_CONSTANTS.SECTION.SUBTITLE}
      </p>

      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => onScroll('left')}
          className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <button
          onClick={() => onScroll('right')}
          className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
