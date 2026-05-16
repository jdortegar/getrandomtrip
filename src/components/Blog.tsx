"use client";

import BlogCard from "@/components/BlogCard";
import BlogViewAllCard from "@/components/BlogViewAllCard";
import Section from "@/components/layout/Section";
import type { BlogPost, BlogViewAll } from "@/lib/data/shared/blog-types";
import { motion } from "framer-motion";
import EmblaCarousel from "./EmblaCarousel/EmblaCarousel";

interface BlogProps {
  eyebrow?: string;
  subtitle?: string;
  title: string;
  id?: string;
  posts: BlogPost[];
  viewAll?: BlogViewAll;
}


export default function Blog({
  eyebrow, subtitle, title,
  id = "blog",
  posts,
  viewAll,
}: BlogProps) {

  return (
    <Section
      id={id}
      fullWidth
      className="pt-24!"
    >
      <div className="relative flex flex-col gap-12 lg:flex-row lg:rt-container">
        {/* Left Column - Full-height white panel so carousel never bleeds through */}
        <aside className="relative flex w-full flex-col items-center justify-center bg-white py-12 lg:w-1/3 lg:items-start lg:justify-center lg:text-left rt-container lg:p-0!">
          {eyebrow && (
            <motion.div
              className="text-base font-bold uppercase tracking-[6px] text-light-blue md:text-lg md:tracking-[9px]"
              initial={{ opacity: 0, y: 40 }} 
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ margin: "-100px", once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {eyebrow}
            </motion.div>
          )}

          <motion.h2
            className="font-barlow-condensed mt-4 text-[50px] font-bold uppercase leading-none text-gray-900 md:text-[70px]"
            initial={{ opacity: 0, y: 60 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ margin: "-100px", once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {title}
          </motion.h2>

          <motion.p
            className="mx-auto mt-8 text-lg text-[#888] md:mx-0"
            initial={{ opacity: 0, y: 40 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ margin: "-100px", once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {subtitle}
          </motion.p>
        </aside>

        {/* Right Column - Carousel */}
        <div className="relative z-0 flex-1 lg:min-w-2/3">
          <EmblaCarousel slidesPerView={2} overflow="right" arrowsClassName="lg:pr-0!" slideClassName="md:flex-[0_0_50%] lg:flex-[0_0_50%]">
            {posts.map((post, index) => (
              <BlogCard key={post.title || index} post={post} />
            ))}
            {viewAll && <BlogViewAllCard viewAll={viewAll} />}
          </EmblaCarousel>
        </div>
      </div>
    </Section>
  );
}
