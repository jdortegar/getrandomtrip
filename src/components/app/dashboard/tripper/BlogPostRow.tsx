import Link from 'next/link';
import { BookOpen, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Img from '@/components/common/Img';
import type { BlogPost } from '@/types/blog';
import type { TripperBlogsDict } from '@/lib/types/dictionary';

interface BlogPostRowProps {
  copy: TripperBlogsDict['row'];
  dateLocale: string;
  post: BlogPost;
}

function StatusBadge({
  copy,
  status,
}: {
  copy: TripperBlogsDict['row'];
  status: BlogPost['status'];
}) {
  const isPublished = status === 'published';
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full border ${
        isPublished
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }`}
    >
      {isPublished ? copy.published : copy.draft}
    </span>
  );
}

export function BlogPostRow({ copy, dateLocale, post }: BlogPostRowProps) {
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(dateLocale, dateOptions)
    : `${copy.updatedAt}: ${new Date(post.updatedAt).toLocaleDateString(
        dateLocale,
        dateOptions,
      )}`;

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md p-3">
      {/* Thumbnail */}
      <div className="w-[80px] h-[90px] rounded-lg overflow-hidden shrink-0">
        {post.coverUrl ? (
          <Img
            alt={post.title}
            className="h-full w-full object-cover"
            height={90}
            sizes="80px"
            src={post.coverUrl}
            width={80}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
        <p className="font-bold text-base leading-tight text-neutral-900 truncate">
          {post.title}
        </p>
        {post.subtitle && (
          <p className="text-sm text-neutral-500 line-clamp-2">{post.subtitle}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-neutral-400 pt-0.5">{dateLabel}</p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col items-end gap-2 px-4 py-3">
        <StatusBadge copy={copy} status={post.status} />
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/tripper/blogs/${post.id}`}>
            <Edit className="h-3.5 w-3.5" />
            {copy.edit}
          </Link>
        </Button>
        {post.status === 'published' && (
          <Button asChild size="sm" variant="ghost">
            <Link
              href={`/blog/${post.slug ?? post.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Eye className="h-3.5 w-3.5" />
              {copy.view}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
