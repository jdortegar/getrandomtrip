"use client";

import { useParams } from "next/navigation";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { BlogPost } from "@/types/blog";

function getTripperBlogsCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

interface TripperBlogEditDemoClientProps {
  post: Partial<BlogPost>;
}

export function TripperBlogEditDemoClient({ post }: TripperBlogEditDemoClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const blogsCopy = getTripperBlogsCopy(locale);

  return (
    <div className="p-8">
      <BlogComposer copy={blogsCopy.composer} mode="edit" post={post} />
    </div>
  );
}
