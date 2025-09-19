'use client';

import React from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';

interface BlogSectionContentProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function BlogSectionContent({
  scrollContainerRef,
}: BlogSectionContentProps) {
  return (
    <div className="md:col-span-2">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-8 py-8 hide-scrollbar"
      >
        {BLOG_CONSTANTS.POSTS.map((post) => (
          <BlogCard key={post.title} post={post} />
        ))}

        <Link href={BLOG_CONSTANTS.VIEW_ALL.HREF}>
          <div className="group relative h-[60vh] w-80 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-white text-gray-900 flex flex-col items-center justify-center p-6 hover:scale-[1.03] transition-all duration-300 shadow-xl hover:shadow-2xl">
            <div className="text-center">
              <h3 className="font-caveat text-2xl font-bold mb-2 text-primary">
                {BLOG_CONSTANTS.VIEW_ALL.TITLE}
              </h3>
              <p className="text-sm mb-4 text-gray-600">
                {BLOG_CONSTANTS.VIEW_ALL.SUBTITLE}
              </p>
              <div className="inline-flex items-center gap-2 text-primary font-medium">
                <span>Explorar Blog</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
