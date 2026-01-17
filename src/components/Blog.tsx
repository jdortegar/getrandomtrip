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
import Section from '@/components/layout/Section';
import Img from '@/components/common/Img';
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

interface BlogCardProps {
  post: BlogPost;
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

function BlogCard({ post }: BlogCardProps) {
  return (
    <div className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1 max-w-[380px]">
      <div className="relative h-full w-full">
        <Img
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          height={600}
          src={post.image}
          width={400}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="absolute bottom-0 left-0 w-full p-5 text-white md:p-7">
        <span className="text-amber-300 text-xs font-semibold uppercase tracking-[0.4em]">
          {post.category}
        </span>
        <h3 className="mt-2 font-barlow-condensed text-xl font-bold leading-tight md:text-2xl">
          {post.title}
        </h3>
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white hover:text-gray-900 md:text-sm"
          type="button"
        >
          Explorar Trip
        </button>
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
        <div className="relative flex flex-col gap-12 md:flex-row md:items-center md:gap-16">
          {/* Left Column - Text Content */}
          <aside className="relative z-20 flex w-full flex-col items-center text-center md:w-1/3 md:items-start md:text-left md:self-center bg-white">
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
          </aside>

          {/* Right Column - Carousel */}
          <div className="relative z-0 flex-1 md:min-w-2/3 mt-8">
            {/* Navigation buttons at top right */}
            <div className="absolute -top-20 right-[12.5%] flex items-center gap-2 z-10">
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
