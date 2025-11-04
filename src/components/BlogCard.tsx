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
  const content = (
    <div className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg text-left h-[50vh] w-72 md:h-[65vh] md:w-96">
      <Image
        alt={post.title}
        className="transition-transform duration-300 group-hover:scale-105"
        fill
        src={post.image}
        style={{ objectFit: 'cover' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 text-white w-full md:p-6">
        <p className="font-jost text-yellow-400 text-xs font-semibold mb-2 uppercase tracking-wider md:text-sm">
          {post.category}
        </p>
        <h3 className="font-jost text-xl font-bold md:text-2xl">
          {post.title}
        </h3>
        <div className="border-b border-white font-bold mt-3 pb-1 text-left text-white text-xs tracking-widest uppercase md:mt-4">
          {post.href ? 'Leer más' : 'Explorar Trip'}
        </div>
      </div>
    </div>
  );

  if (post.href) {
    return <Link href={post.href}>{content}</Link>;
  }

  return content;
};

export default BlogCard;
