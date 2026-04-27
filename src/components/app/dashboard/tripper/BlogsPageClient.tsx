"use client";

import { useParams } from "next/navigation";
import { BlogPostsList } from "@/components/app/dashboard/tripper/BlogPostsList";
import { PageHeading } from "@/components/layout/PageHeading";
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
        <PageHeading
          description={tripperBlogs.header.description}
          title={tripperBlogs.header.title}
        />
        <BlogPostsList posts={posts} />
      </div>
    </Section>
  );
}
