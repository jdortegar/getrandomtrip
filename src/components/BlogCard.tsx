'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
  post: {
    image: string;
    category: string;
    title: string;
    href?: string;
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const card = (
    <div className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1">
      <Image
        alt={post.title}
        className="transition-transform duration-300 group-hover:scale-105"
        fill
        src={post.image}
        style={{ objectFit: 'cover' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full p-5 text-white md:p-7">
        <p className="font-jost mb-2 text-xs font-semibold uppercase tracking-[0.4em] text-amber-300 md:text-sm">
          {post.category}
        </p>
        <h3 className="font-jost text-xl font-bold md:text-2xl">
          {post.title}
        </h3>
        <div className="mt-4 inline-flex items-center gap-2 border-b border-white pb-1 text-xs font-semibold uppercase tracking-[0.3em] md:text-sm">
          {post.href ? 'Leer más' : 'Explorar Trip'}
        </div>
      </div>
    </div>
  );

  if (post.href) {
    return <Link href={post.href}>{card}</Link>;
  }

  return card;
};

export default BlogCard;
