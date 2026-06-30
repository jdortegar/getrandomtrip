"use client";

import Link from "next/link";
import SafeImage from "@/components/common/SafeImage";
import GlassCard from "@/components/ui/GlassCard";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { BlogIndexPost } from "@/lib/types/BlogIndexPost";
import { cn } from "@/lib/utils";

interface BlogIndexCardProps {
  colSpan: string;
  isLarge: boolean;
  locale: Locale;
  post: BlogIndexPost;
}

export function BlogIndexCard({
  colSpan,
  isLarge,
  locale,
  post,
}: BlogIndexCardProps) {
  return (
    <Link
      className={cn("group block", colSpan)}
      href={pathForLocale(locale, `/blog/${post.slug}`)}
    >
      <GlassCard className="relative h-full overflow-hidden rounded-xl transition-shadow hover:shadow-lg">
        <div className="relative h-[304.83px] w-full overflow-hidden">
          <SafeImage
            alt={post.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes={
              isLarge
                ? "(min-width: 768px) 100vw, 100vw"
                : "(min-width: 768px) 50vw, 100vw"
            }
            src={post.coverUrl}
          />
          {post.coverUrl && (
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"
            />
          )}
          <div
            className={cn(
              "absolute bottom-10 left-0 flex w-full flex-col items-center justify-center p-4",
              post.coverUrl ? "text-white" : "text-neutral-900",
            )}
          >
            <div className="flex flex-col gap-6 text-left">
              <h3
                className={cn(
                  "font-barlow-condensed text-lg font-extrabold uppercase tracking-wide transition-colors sm:text-xl md:text-4xl",
                  post.coverUrl
                    ? "text-white group-hover:text-blue-200"
                    : "text-neutral-900 group-hover:text-blue-600",
                )}
              >
                {post.title}
              </h3>
              {post.subtitle && (
                <p
                  className={cn(
                    "mt-2 line-clamp-2 text-base font-normal",
                    post.coverUrl ? "text-white/95" : "text-neutral-600",
                  )}
                >
                  {post.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
