'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Carousel } from '@/components/display/Carousel';
import Section from '@/components/layout/Section';
import Img from '@/components/common/Img';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

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

function BlogCard({ post }: BlogCardProps) {
  return (
    <div className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1">
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

function PaginationDots({
  activeIndex,
  count,
  onDotClick,
}: {
  activeIndex: number;
  count: number;
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          aria-label={`Go to slide ${index + 1}`}
          className={cn(
            'h-2 w-2 rounded-full transition-all',
            index === activeIndex ? 'bg-[#4F96B6]' : 'bg-gray-300',
          )}
          key={index}
          onClick={() => onDotClick(index)}
          type="button"
        />
      ))}
    </div>
  );
}

export default function Blog({
  eyebrow,
  className,
  id,
  posts,
  subtitle,
  title,
  viewAll,
}: BlogProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [emblaApi, setEmblaApi] = useState<any>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  return (
    <Section className={className} id={id} variant="default">
      <div className="flex flex-col gap-12 md:flex-row md:items-center md:gap-16">
        {/* Left Column - Text Content */}
        <aside className="relative flex w-full flex-col items-center text-center md:w-1/3 md:items-start md:text-left md:self-center">
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
        <div className="relative flex-1 md:-mr-[40vw] md:min-w-2/3 md:pr-16 md:pl-8 md:py-8">
          <div className="relative">
            <Carousel
              className="pb-8 md:pb-10"
              onEmblaApi={setEmblaApi}
              showArrows={false}
              options={{
                align: 'start',
                slidesToScroll: 1,
              }}
            >
              {posts.map((post, index) => (
                <div
                  className="w-72 flex-shrink-0 pr-8 md:w-96"
                  key={post.title || index}
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
      {/* Pagination Dots */}
      <div className="mt-6 flex w-full justify-center">
        <PaginationDots
          activeIndex={activeIndex}
          count={posts.length}
          onDotClick={handleDotClick}
        />
      </div>
      {/* Custom Navigation Arrows - Top Right */}
      <div className="absolute right-4 top-4 z-20 flex gap-2 md:right-8 md:-top-10">
        <Button
          aria-label="Scroll left"
          className={cn(
            'md:w-12 md:h-12 w-8 h-8 rounded-full bg-[#4F96B6] hover:bg-[#367A95]',
            'text-white',
          )}
          disabled={!canScrollPrev}
          onClick={scrollPrev}
          type="button"
          variant="ghost"
        >
          <ArrowLeft className="md:size-[25px] size-[20px] text-white" />
          <span className="sr-only">Previous slide</span>
        </Button>
        <Button
          aria-label="Scroll right"
          className={cn(
            'md:w-12 md:h-12 w-8 h-8 rounded-full bg-[#4F96B6] hover:bg-[#367A95]',
            'text-white',
          )}
          disabled={!canScrollNext}
          onClick={scrollNext}
          type="button"
          variant="ghost"
        >
          <ArrowRight className="md:size-[25px] size-[20px] text-white" />
          <span className="sr-only">Next slide</span>
        </Button>
      </div>
    </Section>
  );
}
