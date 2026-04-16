"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BlogArticle from "@/components/blog/BlogArticle";
import BlogPostHero from "@/components/blog/BlogPostHero";
import FaqSection from "@/components/display/FaqSection";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import Section from "@/components/layout/Section";
import LightboxCarousel from "@/components/media/LightboxCarousel";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import { Button } from "@/components/ui/Button";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { BlogPost } from "@/types/blog";

function getTripperBlogs(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

interface PreviewBlogPost extends Partial<BlogPost> {
  author?: {
    id: string;
    name: string;
    tripperSlug: string | null;
    avatarUrl: string | null;
    bio?: string | null;
    location?: string | null;
    motto?: string | null;
    specialization?: string | null;
  };
}

export function TripperBlogPreviewClient() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const rawLocale = params?.locale;
  const localeStr = typeof rawLocale === "string" ? rawLocale : rawLocale?.[0];
  const locale: Locale = hasLocale(localeStr) ? (localeStr as Locale) : "es";
  const postId = params?.id?.toString() ?? "";
  const tripperBlogs = getTripperBlogs(locale);

  const [post, setPost] = useState<PreviewBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!postId || !session?.user?.id) {
      setLoading(false);
      setError(tripperBlogs.previewPage.loadError);
      return;
    }

    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tripper/blogs/${postId}`);
        const data = (await response.json()) as {
          blog?: PreviewBlogPost;
          error?: string;
        };
        if (cancelled) return;
        if (response.ok && data.blog) {
          setPost(data.blog);
        } else {
          setError(data.error ?? tripperBlogs.previewPage.loadError);
        }
      } catch {
        if (!cancelled) setError(tripperBlogs.previewPage.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPost();
    return () => {
      cancelled = true;
    };
  }, [
    locale,
    postId,
    session?.user?.id,
    sessionStatus,
    tripperBlogs.previewPage.loadError,
  ]);

  const carouselImages = useMemo(() => {
    if (!post) return [];
    const items: { url: string; caption?: string }[] = [];
    if (post.coverUrl) items.push({ url: post.coverUrl });
    (post.blocks ?? []).forEach((b) => {
      if (b.type === "image" && "url" in b && b.url) {
        items.push({
          url: b.url,
          caption:
            "caption" in b ? (b.caption as string | undefined) : undefined,
        });
      }
    });
    return items;
  }, [post?.coverUrl, post?.blocks]);

  if (loading || sessionStatus === "loading") {
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

  const author = post.author;
  const faqItems = (() => {
    if (!post.faq) return [];
    const f = post.faq as
      | { items?: { question: string; answer: string }[] }
      | { question: string; answer: string }[];
    if (Array.isArray(f)) return f;
    if (f.items && Array.isArray(f.items)) return f.items;
    return [];
  })();

  return (
    <div className="flex flex-col mb-10">
      <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
        {tripperBlogs.previewPage.banner}
        {" · "}
        <Link
          className="font-medium underline underline-offset-2"
          href={`/dashboard/tripper/blogs/${postId}`}
        >
          {tripperBlogs.previewPage.backToEdit}
        </Link>
      </div>

      <BlogPostHero
        author={{
          avatarUrl: author?.avatarUrl ?? "",
          location: author?.location ?? undefined,
          name: author?.name ?? "",
          slug: author?.tripperSlug ?? author?.id ?? "",
        }}
        coverUrl={post.coverUrl ?? null}
        subtitle={post.subtitle ?? post.tagline ?? ""}
        title={post.title ?? ""}
      />

      <Section>
        <div className="mx-auto max-w-4xl px-4">
          <Breadcrumb
            items={[
              { href: "/blog", label: "Tripper Inspirations" },
              { label: post.title ?? "" },
            ]}
          />

          <BlogArticle
            content={typeof post.content === "string" ? post.content : null}
            emptyMessage={tripperBlogs.previewPage.emptyBody}
            title={post.title ?? ""}
          />

          <FaqSection items={faqItems} />
        </div>
      </Section>

      <LightboxCarousel images={carouselImages} />
    </div>
  );
}
