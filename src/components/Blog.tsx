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

    // Calculate scroll amount based on viewport size
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 288 : 384; // w-72 (mobile) or w-96 (desktop)
    const spacing = 32; // space-x-8 = 32px
    const scrollAmount = cardWidth + spacing;

    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <Section
      id={id}
      variant="dark"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Subtle accent glow */}
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative w-full">
        {/* Decorative top border accent */}
        <div className="absolute -top-8 left-4 h-1 w-24 rounded-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Column 1: Header Section (1/3 width = 4 columns) */}
          <div className="md:col-span-4 text-left flex flex-col gap-4 relative md:gap-6">
            {/* Elegant side accent */}
            <div className="absolute -left-4 top-0 bottom-0 hidden md:block w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-caveat text-4xl md:text-6xl font-bold bg-gradient-to-br from-white via-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                {content.title}
              </h2>
              <p className="font-jost text-base md:text-lg text-gray-300/90 leading-relaxed">
                {content.subtitle}
              </p>
            </div>

            {/* Elegant Scroll Controls */}
            <div className="hidden md:flex space-x-4 mt-4">
              <button
                aria-label="Scroll left"
                className="group relative backdrop-blur-sm rounded-full border border-white/20 bg-white/5 p-2.5 transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10 md:p-3"
                onClick={() => handleScroll('left')}
              >
                <svg
                  className="h-5 w-5 text-white/80 transition-colors group-hover:text-white md:h-6 md:w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                aria-label="Scroll right"
                className="group relative backdrop-blur-sm rounded-full border border-white/20 bg-white/5 p-2.5 transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10 md:p-3"
                onClick={() => handleScroll('right')}
              >
                <svg
                  className="h-5 w-5 text-white/80 transition-colors group-hover:text-white md:h-6 md:w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Columns 2-3: Carousel Section (2/3 width = 8 columns) */}
          <div className="md:col-span-8 -mr-[50vw] md:pr-0">
            <div
              className="flex overflow-x-auto space-x-8 py-8 pr-8 md:pr-16 hide-scrollbar"
              ref={scrollContainerRef}
            >
              {content.posts.map((post, index) => (
                <BlogCard key={`${post.title}-${index}`} post={post} />
              ))}

              {/* View All Card - Enhanced */}
              {showViewAll && content.viewAll && (
                <Link className="mr-[50vw]" href={content.viewAll.href}>
                  <div className="group relative flex h-[50vh] w-72 flex-shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-100/50 bg-gradient-to-br from-white via-gray-50 to-white p-6 text-gray-900 shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:shadow-primary/20 md:h-[65vh] md:w-96 md:p-8">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 group-hover:opacity-100" />

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 blur-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent group-hover:opacity-100" />

                    <div className="text-center relative z-10">
                      <h3 className="font-caveat text-2xl font-bold mb-2 bg-gradient-to-br from-primary via-primary to-primary/80 bg-clip-text text-transparent md:text-3xl md:mb-3">
                        {content.viewAll.title}
                      </h3>
                      <p className="text-xs mb-4 leading-relaxed text-gray-600 md:text-sm md:mb-6">
                        {content.viewAll.subtitle}
                      </p>
                      <div className="inline-flex items-center gap-2 font-medium text-primary text-xs transition-all duration-300 group-hover:gap-3 md:text-sm">
                        <span className="font-semibold">Explorar Blog</span>
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-1 md:h-5 md:w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
      </div>
    </Section>
  );
}
