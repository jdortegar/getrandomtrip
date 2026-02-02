'use client';

import Img from '@/components/common/Img';
import { Button } from '@/components/ui/Button';
import type { BlogPost } from '@/lib/data/shared/blog-types';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <div className="group relative block aspect-[3/4] w-full max-w-[380px] overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1">
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
        <Button className="mt-4 text-xs" size="sm" variant="outline">
          Explorar Trip
        </Button>
      </div>
    </div>
  );
}
