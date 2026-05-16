"use client";

import { BlogPostsList } from "@/components/app/dashboard/tripper/BlogPostsList";
import { PageHeading } from "@/components/layout/PageHeading";
import Section from "@/components/layout/Section";
import type { BlogPost } from "@/types/blog";
import { useDictionary } from "@/hooks/useDictionary";

interface BlogsPageClientProps {
  posts: BlogPost[];
}

export function BlogsPageClient({ posts }: BlogsPageClientProps) {
  const tripperBlogs = useDictionary(d => d.tripperBlogs);

  return (
    <Section>
      <div className="rt-container">
        <PageHeading
          description={tripperBlogs.header.description}
          title={tripperBlogs.header.title}
        />
        <BlogPostsList posts={posts} />
      </div>
    </Section>
  );
}
