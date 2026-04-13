"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BlogArticle from "@/components/blog/BlogArticle";
import Img from "@/components/common/Img";
import HeaderHero from "@/components/journey/HeaderHero";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import { BLOG_LISTING_HERO_CONFIG } from "@/lib/constants/blog-listing-hero";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import type { BlogPost } from "@/types/blog";

function getTripperBlogs(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

export function TripperBlogPreviewClient() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const rawLocale = params?.locale;
  const localeStr = typeof rawLocale === "string" ? rawLocale : rawLocale?.[0];
  const locale: Locale = hasLocale(localeStr) ? (localeStr as Locale) : "es";
  const postId = params?.id?.toString() ?? "";
  const tripperBlogs = getTripperBlogs(locale);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [post, setPost] = useState<Partial<BlogPost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDictionary(locale).then((d) => {
      if (!cancelled) setDict(d);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const tripperDict = getTripperBlogs(locale);

    if (sessionStatus === "loading") {
      return;
    }

    if (!postId || !session?.user?.id) {
      setLoading(false);
      setPost(null);
      setError(tripperDict.previewPage.loadError);
      return;
    }

    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tripper/blogs/${postId}`);
        const data = (await response.json()) as {
          blog?: Partial<BlogPost>;
          error?: string;
        };

        if (cancelled) return;

        if (response.ok && data.blog) {
          setPost(data.blog);
          setError(null);
        } else {
          setPost(null);
          setError(data.error ?? tripperDict.previewPage.loadError);
        }
      } catch {
        if (!cancelled) {
          setPost(null);
          setError(tripperDict.previewPage.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPost();

    return () => {
      cancelled = true;
    };
  }, [locale, postId, session?.user?.id, sessionStatus]);

  if (!dict || loading || sessionStatus === "loading") {
    return <LoadingSpinner />;
  }

  if (error || !post) {
    return (
      <Section>
        <div className="rt-container max-w-3xl py-12">
          <p className="mb-6 text-sm text-neutral-600">
            {error ?? tripperBlogs.composer.editNotFound.descriptionFallback}
          </p>
          <Button asChild variant="secondary">
            <Link href="/dashboard/tripper/blogs">
              {tripperBlogs.composer.editNotFound.backToList}
            </Link>
          </Button>
        </div>
      </Section>
    );
  }

  const contentHtml =
    typeof post.content === "string" && post.content.length > 0
      ? post.content
      : null;

  const heroTitle =
    post.title && post.title.length > 0
      ? post.title
      : dict.blogPage.heroTitleDefault;

  return (
    <>
      <HeaderHero
        {...BLOG_LISTING_HERO_CONFIG}
        description={dict.blogPage.heroDescription}
        title={heroTitle}
      />
      <Section>
        <div className="rt-container">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {tripperBlogs.previewPage.banner}
          </div>
          <div className="mb-8">
            <Button asChild variant="secondary">
              <Link href={`/dashboard/tripper/blogs/${postId}`}>
                {tripperBlogs.previewPage.backToEdit}
              </Link>
            </Button>
          </div>
          <GlassCard>
            <div className="p-8 md:p-12">
              {post.coverUrl ? (
                <div className="relative mb-8 h-56 w-full overflow-hidden rounded-xl md:h-72">
                  <Img
                    alt={post.title ?? ""}
                    className="h-full w-full object-cover"
                    height={432}
                    sizes="(max-width: 768px) 100vw, 896px"
                    src={post.coverUrl}
                    width={896}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                  />
                </div>
              ) : null}
              {post.subtitle && post.subtitle.length > 0 ? (
                <p className="mb-6 text-lg font-semibold text-neutral-700">
                  {post.subtitle}
                </p>
              ) : null}
              <BlogArticle
                content={contentHtml}
                emptyMessage={tripperBlogs.previewPage.emptyBody}
                showTitle={false}
                title={post.title ?? ""}
              />
            </div>
          </GlassCard>
        </div>
      </Section>
    </>
  );
}
