"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { BlogPost } from "@/types/blog";
import { ArrowLeft } from "lucide-react";

function getTripperBlogsCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

function EditBlogContent() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const blogsCopy = getTripperBlogsCopy(locale);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Partial<BlogPost> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postId = params?.id?.toString() ?? "";

  useEffect(() => {
    async function fetchPost() {
      if (!session?.user?.id || !postId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/tripper/blogs/${postId}`);

        if (response.ok) {
          const data = await response.json();
          setError(null);
          setPost(data.blog);
        } else if (response.status === 404) {
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Error al cargar el post");
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
        setError("Error al cargar el post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [session?.user?.id, postId]);

  if (loading) {
    return (
      <Section>
        <div className="mx-auto max-w-full">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-neutral-900">
              {blogsCopy.composer.editLoading.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {blogsCopy.composer.editLoading.description}
            </p>
          </div>
          <LoadingSpinner />
        </div>
      </Section>
    );
  }

  if (!loading && (error || !post)) {
    const description =
      error && error.length > 0
        ? error
        : blogsCopy.composer.editNotFound.descriptionFallback;
    return (
      <Section>
        <div className="mx-auto max-w-full">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-neutral-900">
              {blogsCopy.composer.editNotFound.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{description}</p>
          </div>
          <div className="py-12 text-center">
            <Button asChild variant="link">
              <Link href="/dashboard/tripper/blogs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {blogsCopy.composer.editNotFound.backToList}
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <Section>
      <div className="mx-auto max-w-full">
        <BlogComposer
          copy={blogsCopy.composer}
          key={post.id}
          mode="edit"
          post={post}
        />
      </div>
    </Section>
  );
}

function EditBlogPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <EditBlogContent />
    </SecureRoute>
  );
}

export default EditBlogPage;
