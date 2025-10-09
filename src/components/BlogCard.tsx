'use client';

import React from 'react';
import Image from 'next/image';

interface BlogCardProps {
  post: {
    image: string;
    category: string;
    title: string;
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <div className="relative h-[50vh] w-72 flex-shrink-0 cursor-pointer group overflow-hidden rounded-lg text-left">
      <Image
        src={post.image}
        alt={post.title}
        fill
        style={{ objectFit: 'cover' }}
        className="group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
        <p className="text-yellow-400 text-sm font-semibold mb-2 uppercase tracking-wider font-jost">
          {post.category}
        </p>
        <h3 className="text-2xl font-bold font-jost">{post.title}</h3>
        <button className="mt-4 text-left font-bold text-white uppercase text-xs tracking-widest border-b border-white pb-1">
          Explorar Trip
        </button>
      </div>
    </div>
  );
};

export default BlogCard;
