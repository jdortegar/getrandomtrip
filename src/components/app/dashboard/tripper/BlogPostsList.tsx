"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BlogPostRow } from "@/components/app/dashboard/tripper/BlogPostRow";
import type { BlogPost } from "@/types/blog";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface BlogPostsListProps {
  posts: BlogPost[];
}

export function BlogPostsList({ posts }: BlogPostsListProps) {
  const locale = useLocale();
  const tripperBlogs = useDictionary(d => d.tripperBlogs);
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-end">
        <Button asChild size="sm">
          <Link href="/dashboard/tripper/blogs/new">
            <Plus className="h-4 w-4" />
            {tripperBlogs.newPost}
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
          <p className="mb-4 text-neutral-500">{tripperBlogs.empty.message}</p>
          <Button asChild>
            <Link href="/dashboard/tripper/blogs/new">
              <Plus className="h-4 w-4" />
              {tripperBlogs.empty.cta}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <BlogPostRow
                dateLocale={dateLocale}
                post={post}
                rowLabels={tripperBlogs.row}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
