"use client";

import Link from "next/link";
import CountryFlag from "@/components/common/CountryFlag";
import SafeImage from "@/components/common/SafeImage";
import GlassCard from "@/components/ui/GlassCard";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { BlogTeaserPost } from "@/lib/types/BlogIndexPost";
import { cn } from "@/lib/utils";

interface BlogIndexCardProps {
  colSpan: string;
  isLarge: boolean;
  locale: Locale;
  post: BlogTeaserPost;
}

/** Derive country for flag from location string (e.g. "Ciudad de México, México" → "México"). */
function getCountryFromLocation(
  location: string | null | undefined,
): string | null {
  if (!location?.trim()) return null;
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : location;
}

export function BlogIndexCard({
  colSpan,
  isLarge,
  locale,
  post,
}: BlogIndexCardProps) {
  const { author } = post;
  const countryForFlag = getCountryFromLocation(author?.location);

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
              className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent"
            />
          )}
          <div
            className={cn(
              "absolute bottom-0 left-0 flex w-full flex-col gap-3 p-4 pb-6 text-left",
              post.coverUrl ? "text-white" : "text-ink",
            )}
          >
            {author?.avatarUrl && (
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
                  <SafeImage
                    alt={author.name}
                    className="object-cover"
                    fill
                    sizes="36px"
                    src={author.avatarUrl}
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  {countryForFlag && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                      <CountryFlag
                        country={countryForFlag}
                        title={author.location}
                      />
                      {countryForFlag}
                    </span>
                  )}
                  <span className="font-barlow-condensed text-sm font-bold uppercase tracking-wide">
                    {author.name}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h3
                className={cn(
                  "font-barlow-condensed text-xl font-extrabold uppercase tracking-wide transition-colors sm:text-2xl md:text-3xl",
                  post.coverUrl
                    ? "text-white group-hover:text-blue-200"
                    : "text-ink group-hover:text-blue-600",
                )}
              >
                {post.title}
              </h3>
              {post.subtitle && (
                <p
                  className={cn(
                    "line-clamp-2 text-sm font-normal",
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
