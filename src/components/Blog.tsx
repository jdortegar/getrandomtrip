'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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

interface BlogProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  posts: BlogPost[];
  viewAll?: BlogViewAll;
  id?: string;
  className?: string;
}

function BlogCarouselDots({ posts }: { posts: BlogPost[] }) {
  const { selectedIndex, scrollSnaps, scrollTo } = useCarousel();

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="flex items-center gap-2">
        {scrollSnaps.map((_: unknown, index: number) => (
          <button
            key={index}
            aria-label={`Go to slide ${index + 1}`}
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
  eyebrow,
  id,
  posts,
  subtitle,
  title,
  viewAll,
}: BlogProps) {
  return (
    <Section className="pl-[8%]" id={id} variant="default" fullWidth>
      <CarouselRoot
        className="relative p-0 m-0"
        edgeBleed={false}
        opts={{
          align: 'start',
          slidesToScroll: 1,
        }}
      >
        <div className="relative flex flex-col gap-12 md:flex-row md:items-stretch md:gap-8">
          {/* Left Column - Full-height white panel so carousel never bleeds through */}
          <aside className="relative z-20 flex w-full flex-col items-center justify-center bg-white py-12 md:ml-[-8vw] md:w-1/3 md:min-w-[calc(33.333%+8vw)] md:items-start md:justify-center md:pl-[8vw] md:pr-8 md:text-left">
            {eyebrow && (
              <motion.div
                className="text-base font-bold uppercase tracking-[6px] text-[#4F96B6] md:text-lg md:tracking-[9px]"
                initial={{ opacity: 0, y: 40 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ margin: '-100px', once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {eyebrow}
              </motion.div>
            )}

            <motion.h2
              className="font-barlow-condensed mt-4 text-[50px] font-bold uppercase leading-none text-gray-900 md:text-[70px]"
              initial={{ opacity: 0, y: 60 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ margin: '-100px', once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {title}
            </motion.h2>

            <motion.p
              className="mx-auto mt-8 text-lg text-[#888] md:mx-0"
              initial={{ opacity: 0, y: 40 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              viewport={{ margin: '-100px', once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {subtitle}
            </motion.p>
            {/* Gradient on right edge of white panel, over carousel: white → transparent (left side of carousel) */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 top-0 z-[6] w-12 translate-x-full bg-gradient-to-r from-white to-transparent md:w-20"
            />
          </aside>

          {/* Right Column - Carousel */}
          <div className="relative z-0 flex-1 md:min-w-2/3 mt-8 pl-6 pr-8 md:pl-8 md:pr-12">
            {/* Navigation buttons at top right */}
            <div className="absolute -top-20 right-[12.5%] z-10 flex items-center gap-2">
              <CarouselPrevious />
              <CarouselNext />
            </div>

            {/* Carousel Content */}
            <CarouselContent className="pb-8 md:pb-10 ">
              {posts.map((post, index) => (
                <CarouselItem key={post.title || index} className="!basis-auto">
                  <BlogCard post={post} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom Dots - Centered in full container width */}
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <BlogCarouselDots posts={posts} />
          </div>
        </div>
      </CarouselRoot>
    </Section>
  );
}
