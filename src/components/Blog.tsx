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

const CARD_WIDTH = { mobile: 288, desktop: 384 } as const;
const CARD_GAP = 32;

function ArrowButton({
  direction,
  onClick,
  className = '',
  size = 'md',
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  className?: string;
  size?: 'md' | 'lg';
}) {
  const label = direction === 'left' ? 'Ver anteriores' : 'Ver siguientes';
  const symbol = direction === 'left' ? '‹' : '›';
  const sizeClasses =
    size === 'lg' ? 'h-11 w-11 shadow-lg' : 'h-10 w-10 shadow-sm';
  const baseClasses =
    'flex items-center justify-center rounded-full border border-gray-300 bg-white text-lg text-gray-600 transition-all hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${className}`.trim()}
    >
      {symbol}
    </button>
  );
}

export default function Blog({
  content,
  id,
  className = '',
  showViewAll = true,
}: BlogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const width = isMobile ? CARD_WIDTH.mobile : CARD_WIDTH.desktop;

    container.scrollBy({
      left: direction === 'right' ? width + CARD_GAP : -(width + CARD_GAP),
      behavior: 'smooth',
    });
  };

  return (
    <Section
      id={id}
      variant="dark"
      className={`relative overflow-hidden py-24 ${className}`}
    >
      <div className="rt-container relative z-10 flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
        <aside className="flex w-full max-w-xl flex-col items-center text-center md:w-1/3 md:items-start md:text-left md:self-center">
          <h2 className="font-caveat text-4xl font-bold text-white md:text-6xl">
            {content.title}
          </h2>
          <p className="font-jost mt-4 text-base text-white/75 md:text-lg">
            {content.subtitle}
          </p>
          <div className="mt-6 hidden gap-4 md:flex">
            <ArrowButton
              direction="left"
              onClick={() => handleScroll('left')}
              size="lg"
            />
            <ArrowButton
              direction="right"
              onClick={() => handleScroll('right')}
              size="lg"
            />
          </div>
        </aside>

        <div className="relative flex-1 md:-mr-[40vw] md:pr-16 md:min-w-2/3">
          <div
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto pb-8 pr-8 md:pb-10 hide-scrollbar"
          >
            {content.posts.map((post, index) => (
              <div
                key={`${post.title}-${index}`}
                className="w-72 flex-shrink-0 md:w-96"
              >
                <BlogCard post={post} />
              </div>
            ))}

            {showViewAll && content.viewAll && (
              <Link
                className="w-72 flex-shrink-0 md:w-96"
                href={content.viewAll.href}
              >
                <div className="group flex aspect-[3/4] w-full items-center justify-center rounded-2xl border border-white/25 bg-white/10 p-6 text-center text-white transition-transform duration-300 hover:-translate-y-1 md:p-8">
                  <div>
                    <h3 className="font-caveat text-3xl font-bold md:text-4xl">
                      {content.viewAll.title}
                    </h3>
                    <p className="font-jost mt-2 text-sm text-white/75 md:text-base">
                      {content.viewAll.subtitle}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-jost text-xs uppercase tracking-[0.3em] text-white/80 transition-all group-hover:gap-3 md:text-sm">
                      Explorar blog
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-4 flex justify-center gap-4 md:hidden">
            <ArrowButton
              direction="left"
              onClick={() => handleScroll('left')}
            />
            <ArrowButton
              direction="right"
              onClick={() => handleScroll('right')}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
