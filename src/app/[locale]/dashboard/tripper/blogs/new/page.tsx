"use client";

import { useParams } from "next/navigation";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { BlogPost } from "@/types/blog";

function getTripperBlogsCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

function CreateBlogContent() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const blogsCopy = getTripperBlogsCopy(locale);

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
