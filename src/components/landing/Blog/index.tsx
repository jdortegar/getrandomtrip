'use client';

import React from 'react';
import { useBlogScroll } from '@/hooks/useBlogScroll';
import { BlogSectionHeader } from './BlogSectionHeader';
import { BlogSectionContent } from './BlogSectionContent';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';

function Blog() {
  const { scrollContainerRef, handleScroll } = useBlogScroll();

  return (
    <section
      id={BLOG_CONSTANTS.SECTION.ID}
      className="py-20 px-8 bg-[#111827] text-white"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <BlogSectionHeader onScroll={handleScroll} />

        <BlogSectionContent scrollContainerRef={scrollContainerRef} />
      </div>

      {/* <div className="max-w-7xl mx-auto mt-8">
        <GetRandomtripCta align="left" className="md:ml-0" />
      </div> */}
    </section>
  );
}

export default Blog;
