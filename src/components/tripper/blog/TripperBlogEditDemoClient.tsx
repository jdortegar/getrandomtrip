"use client";

import BlogComposer from "@/components/tripper/blog/BlogComposer";
import type { BlogPost } from "@/types/blog";
import { useDictionary } from "@/hooks/useDictionary";

interface TripperBlogEditDemoClientProps {
  post: Partial<BlogPost>;
}

export function TripperBlogEditDemoClient({
  post,
}: TripperBlogEditDemoClientProps) {
  const blogsCopy = useDictionary((d) => d.tripperBlogs);

  return (
    <div className="p-8">
      <BlogComposer copy={blogsCopy.composer} mode="edit" post={post} />
    </div>
  );
}
