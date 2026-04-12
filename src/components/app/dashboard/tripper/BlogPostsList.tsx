import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BlogPostRow } from "@/components/app/dashboard/tripper/BlogPostRow";
import type { BlogPost } from "@/types/blog";
import type { TripperBlogsDict } from "@/lib/types/dictionary";

interface BlogPostsListProps {
  copy: TripperBlogsDict;
  dateLocale: string;
  posts: BlogPost[];
}

export function BlogPostsList({ copy, dateLocale, posts }: BlogPostsListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          {copy.header.title}
        </h2>
        <Button asChild size="sm">
          <Link href="/dashboard/tripper/blogs/new">
            <Plus className="h-4 w-4" />
            {copy.newPost}
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
          <p className="mb-4 text-neutral-500">{copy.empty.message}</p>
          <Button asChild>
            <Link href="/dashboard/tripper/blogs/new">
              <Plus className="h-4 w-4" />
              {copy.empty.cta}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <BlogPostRow copy={copy.row} dateLocale={dateLocale} post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
