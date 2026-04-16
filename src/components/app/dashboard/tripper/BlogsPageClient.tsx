"use client";

import { useParams } from "next/navigation";
import { BlogPostsList } from "@/components/app/dashboard/tripper/BlogPostsList";
import Section from "@/components/layout/Section";
import type { BlogPost } from "@/types/blog";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";

interface BlogsPageClientProps {
  posts: BlogPost[];
}

function getTripperBlogs(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

export function BlogsPageClient({ posts }: BlogsPageClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const tripperBlogs = getTripperBlogs(locale);

  return (
    <Section>
      <div className="rt-container">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-neutral-900">
            {tripperBlogs.header.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {tripperBlogs.header.description}
          </p>
        </div>
        <BlogPostsList posts={posts} />
      </div>
    </Section>
  );
}
