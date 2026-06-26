"use client";

import { BlogPostsList } from "@/components/app/dashboard/tripper/BlogPostsList";
import Section from "@/components/layout/Section";
import type { BlogPost } from "@/types/blog";

interface BlogsPageClientProps {
  posts: BlogPost[];
}

export function BlogsPageClient({ posts }: BlogsPageClientProps) {
  return (
    <Section>
      <div className="rt-container">
        <BlogPostsList posts={posts} />
      </div>
    </Section>
  );
}
