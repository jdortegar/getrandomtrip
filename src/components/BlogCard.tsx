'use client';

import Img from '@/components/common/Img';
import { Button } from '@/components/ui/Button';
import type { BlogPost } from '@/lib/data/shared/blog-types';
import Link from 'next/link';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const href = post.href ?? '/blog';

  return (
    <div className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1">
      <Link
        aria-label={`Read ${post.title}`}
        className="absolute inset-0 z-0"
        href={href}
      />
      <div className="pointer-events-none relative z-10 h-full w-full">
        <Img
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          height={600}
          src={post.image}
          width={400}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="absolute bottom-0 left-0 z-20 w-full p-5 text-white md:p-7">
        <span className="text-amber-300 text-xs font-semibold uppercase tracking-[0.4em]">
          {post.category}
        </span>
        <h3 className="mt-2 font-barlow-condensed text-xl font-bold leading-tight md:text-2xl">
          {post.title}
        </h3>
        <Button
          className="pointer-events-auto relative mt-4 h-9 border-white/50 bg-transparent px-4 text-xs font-medium hover:bg-white/10 mr-auto! w-fit"
          variant="outline"
        >
          Explorar Trip
        </Button>
      </div>
    </div>
  );
}
