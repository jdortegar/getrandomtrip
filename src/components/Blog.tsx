'use client';

import React from 'react';
import {
  CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/Carousel';
import { useCarousel } from '@/components/Carousel';
import BlogCard from '@/components/BlogCard';
import Section from '@/components/layout/Section';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import { motion } from 'framer-motion';
import EmblaCarousel from './EmblaCarousel/EmblaCarousel';

export interface BlogContent {
  carouselSlideAriaLabel: string;
  eyebrow: string;
  subtitle: string;
  title: string;
  viewAll: BlogViewAll;
}

interface BlogProps {
  className?: string;
  content?: BlogContent;
  eyebrow?: string;
  id?: string;
  posts: BlogPost[];
  subtitle?: string;
  title?: string;
  viewAll?: BlogViewAll;
}

function BlogCarouselDots({
  posts,
  slideAriaLabelPattern,
}: {
  posts: BlogPost[];
  slideAriaLabelPattern: string;
}) {
  const { selectedIndex, scrollSnaps, scrollTo } = useCarousel();

  return (
    <div className="mt-8 flex w-full justify-center">
      <div className="flex items-center gap-2">
        {scrollSnaps.map((_: unknown, index: number) => (
          <button
            key={index}
            aria-label={slideAriaLabelPattern.replace('{0}', String(index + 1))}
            className={`h-2 rounded-full transition-all ${
              selectedIndex === index
                ? 'bg-[#4F96B6] w-8'
                : 'bg-[#4F96B6]/30 hover:bg-[#4F96B6]/50 w-2'
            }`}
            onClick={() => scrollTo(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export default function Blog({
  className,
  content,
  eyebrow,
  id = 'blog',
  posts,
  subtitle,
  title,
  viewAll,
}: BlogProps) {
  const resolved: BlogContent = content ?? {
    carouselSlideAriaLabel: 'Go to slide {0}',
    eyebrow: eyebrow ?? '',
    subtitle: subtitle ?? '',
    title: title ?? '',
    viewAll: viewAll ?? { href: '/blog', subtitle: '', title: '' },
  };
  const {
    carouselSlideAriaLabel,
    eyebrow: resolvedEyebrow,
    subtitle: resolvedSubtitle,
    title: resolvedTitle,
  } = resolved;
  return (
    <Section
      // className="overflow-visible pl-4 md:pl-[8%]"
      id={id}
      variant="default"
      // fullWidth
    >
      <div className="container mx-auto mt-12 px-4 md:px-20">
        <div className="relative flex flex-col gap-12 lg:flex-row md:items-stretch md:gap-8 ">
          {/* Left Column - Full-height white panel so carousel never bleeds through */}
          <aside className="relative z-20 flex w-full flex-col items-center justify-center bg-white py-12 lg:w-1/3 lg:items-start lg:justify-center lg:text-left">
            {resolvedEyebrow && (
              <motion.div
                className="text-base font-bold uppercase tracking-[6px] text-[#4F96B6] md:text-lg md:tracking-[9px]"
                initial={{ opacity: 0, y: 40 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ margin: '-100px', once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {resolvedEyebrow}
              </motion.div>
            )}

            <motion.h2
              className="font-barlow-condensed mt-4 text-[50px] font-bold uppercase leading-none text-gray-900 md:text-[70px]"
              initial={{ opacity: 0, y: 60 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ margin: '-100px', once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {resolvedTitle}
            </motion.h2>

            <motion.p
              className="mx-auto mt-8 text-lg text-[#888] md:mx-0"
              initial={{ opacity: 0, y: 40 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              viewport={{ margin: '-100px', once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {resolvedSubtitle}
            </motion.p>
          </aside>

          {/* Right Column - Carousel */}
          <div className="relative z-0 flex-1 lg:min-w-2/3">
            <EmblaCarousel sliderPerView={2}>
              {posts.map((post, index) => (
                <BlogCard key={post.title || index} post={post} />
              ))}
            </EmblaCarousel>
          </div>
        </div>
      </div>
    </Section>
  );
}
