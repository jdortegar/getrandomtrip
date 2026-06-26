"use client";

import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import type { BlogPost } from "@/types/blog";
import { useDictionary } from "@/hooks/useDictionary";

function CreateBlogContent() {
  const blogsCopy = useDictionary((d) => d.tripperBlogs);

  const initialPost: Partial<BlogPost> = {
    blocks: [],
    content: "",
    id: "new",
    status: "draft",
    subtitle: "",
    title: "",
  };

  return (
    <>
      <Section>
        <div className="mx-auto max-w-full">
          <BlogComposer
            copy={blogsCopy.composer}
            mode="create"
            post={initialPost}
          />
        </div>
      </Section>
    </>
  );
}

function CreateBlogPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <CreateBlogContent />
    </SecureRoute>
  );
}

export default CreateBlogPage;
