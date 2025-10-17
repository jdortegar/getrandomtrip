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
    <div className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg text-left h-[65vh] w-96">
      <Image
        alt={post.title}
        className="transition-transform duration-300 group-hover:scale-105"
        fill
        src={post.image}
        style={{ objectFit: 'cover' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
        <p className="font-jost text-yellow-400 text-sm font-semibold mb-2 uppercase tracking-wider">
          {post.category}
        </p>
        <h3 className="font-jost text-2xl font-bold">{post.title}</h3>
        <button className="border-b border-white font-bold mt-4 pb-1 text-left text-white text-xs tracking-widest uppercase">
          Explorar Trip
        </button>
      </div>
    </div>
  );
};

export default BlogCard;
