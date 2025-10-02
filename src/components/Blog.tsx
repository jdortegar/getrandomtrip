'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import Section from './layout/Section';

interface BlogPost {
  image: string;
  category: string;
  title: string;
  href?: string;
}

interface BlogContent {
  title: string;
  subtitle: string;
  posts: BlogPost[];
  viewAll?: {
    title: string;
    subtitle: string;
    href: string;
  };
}

interface BlogProps {
  content: BlogContent;
  id?: string;
  className?: string;
  showViewAll?: boolean;
}

export default function Blog({
  content,
  id,
  className = '',
  showViewAll = true,
}: BlogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Calculate scroll amount based on card width (w-72 = 288px) + spacing (space-x-8 = 32px)
    const cardWidth = 288; // w-72 = 288px
    const spacing = 32; // space-x-8 = 32px
    const scrollAmount = cardWidth + spacing; // 320px total per card

    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <Section id={id} variant="dark">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Header Section */}
        <div className="md:col-span-1 text-left flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <h2 className="font-caveat text-5xl font-bold text-white">
              {content.title}
            </h2>
            <p className="font-jost text-lg text-gray-300">
              {content.subtitle}
            </p>
          </div>

          {/* Scroll Controls */}
          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => handleScroll('left')}
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
              onClick={() => handleScroll('right')}
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

        {/* Content Section */}
        <div className="md:col-span-2">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-8 py-8 hide-scrollbar"
          >
            {content.posts.map((post, index) => (
              <BlogCard key={`${post.title}-${index}`} post={post} />
            ))}

            {/* View All Card */}
            {showViewAll && content.viewAll && (
              <Link href={content.viewAll.href}>
                <div className="group relative h-[50vh] w-72 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-white text-gray-900 flex flex-col items-center justify-center p-6 hover:scale-[1.03] transition-all duration-300 shadow-xl hover:shadow-2xl">
                  <div className="text-center">
                    <h3 className="font-caveat text-2xl font-bold mb-2 text-primary">
                      {content.viewAll.title}
                    </h3>
                    <p className="text-sm mb-4 text-gray-600">
                      {content.viewAll.subtitle}
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
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
