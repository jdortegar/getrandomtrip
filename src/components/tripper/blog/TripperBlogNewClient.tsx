"use client";

import BlogComposer from "@/components/tripper/blog/BlogComposer";
import type { BlogPost } from "@/types/blog";
import { useDictionary } from "@/hooks/useDictionary";

export function TripperBlogNewClient() {
  const blogsCopy = useDictionary(d => d.tripperBlogs);

  const initialPost: Partial<BlogPost> = {
    blocks: [],
    content: "",
    id: "new",
    status: "draft",
    subtitle: "",
    title: "",
  };

  return (
    <div className="p-8">
      <BlogComposer
        copy={blogsCopy.composer}
        mode="create"
        post={initialPost}
      />
    </div>
  );
}
