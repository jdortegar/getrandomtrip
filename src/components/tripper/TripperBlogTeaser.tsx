import Link from "next/link";
import { BlogIndexCard } from "@/components/blog/BlogIndexCard";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { BlogTeaserPost } from "@/lib/types/BlogIndexPost";
import type { MarketingDictionary } from "@/lib/types/dictionary";

type BlogTeaserCopy = MarketingDictionary["trippers"]["blogTeaser"];

interface TripperBlogTeaserProps {
  copy: BlogTeaserCopy;
  locale: Locale;
  posts: BlogTeaserPost[];
}

// Fixed 2-half + 1-full layout, matching the approved design for a 3-post teaser.
const COL_SPANS = ["md:col-span-3", "md:col-span-3", "md:col-span-6"];

export function TripperBlogTeaser({
  copy,
  locale,
  posts,
}: TripperBlogTeaserProps) {
  if (posts.length === 0) return null;

  return (
    <Section eyebrow={copy.eyebrow} title={copy.heading}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-6">
        {posts.map((post, index) => (
          <BlogIndexCard
            colSpan={COL_SPANS[index] ?? "md:col-span-3"}
            isLarge={index === 2}
            key={post.slug}
            locale={locale}
            post={post}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button asChild size="sm">
          <Link href={pathForLocale(locale, "/blog")}>
            {copy.viewAllButton}
          </Link>
        </Button>
      </div>
    </Section>
  );
}
