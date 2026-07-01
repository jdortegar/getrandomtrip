"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Book } from "lucide-react";
import {
  BlogFilterHeader,
  type BlogFilterState,
} from "@/components/blog/BlogFilterHeader";
import { BlogIndexCard } from "@/components/blog/BlogIndexCard";
import HeaderHero from "@/components/journey/HeaderHero";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import Section from "@/components/layout/Section";
import GlassCard from "@/components/ui/GlassCard";
import type { TripperFilterOption } from "@/lib/constants/blog-filters";
import { BLOG_LISTING_HERO_CONFIG } from "@/lib/constants/blog-listing-hero";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type {
  BlogIndexPost,
  BlogIndexResponse,
} from "@/lib/types/BlogIndexPost";
import type { MarketingDictionary } from "@/lib/types/dictionary";

type BlogPageCopy = MarketingDictionary["blogPage"];

interface BlogIndexProps {
  copy: BlogPageCopy;
  locale: Locale;
}

interface TripperApiUser {
  avatarUrl: string | null;
  id: string;
  name: string;
  tripperSlug: string | null;
}

const PAGE_SIZE = 12;

function getColSpan(index: number): string {
  const pattern = index % 6;
  if (pattern === 0 || pattern === 1) return "md:col-span-3";
  if (pattern === 2) return "md:col-span-6";
  return "md:col-span-2";
}

function isLargeCard(index: number): boolean {
  return index % 6 === 2;
}

export function BlogIndex({ copy, locale }: BlogIndexProps) {
  const searchParams = useSearchParams();
  const tripperId = searchParams.get("tripperId");
  const tripperName = searchParams.get("tripper");

  const [blogs, setBlogs] = useState<BlogIndexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trippers, setTrippers] = useState<TripperFilterOption[]>([]);
  const [filter, setFilter] = useState<BlogFilterState>({
    excuseKey: null,
    tripperId: tripperId ?? null,
    travelTypeKey: "",
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  const heroTitle = tripperName
    ? copy.heroTitleByTripper.replace("{name}", tripperName)
    : copy.heroTitleDefault;
  const backToProfileText = tripperName
    ? copy.backToProfile.replace("{name}", tripperName)
    : "";

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const query = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          page: pageNum.toString(),
        });

        if (filter.tripperId) query.append("tripperId", filter.tripperId);
        if (filter.travelTypeKey)
          query.append("travelType", filter.travelTypeKey);
        if (filter.excuseKey) query.append("excuseKey", filter.excuseKey);

        const response = await fetch(`/api/blogs?${query.toString()}`);
        const data: BlogIndexResponse = await response.json();

        if (response.ok && data.blogs) {
          setBlogs((prev) => (append ? [...prev, ...data.blogs] : data.blogs));
          setHasMore(data.pagination.hasMore);
        } else {
          console.error("Error fetching blogs:", data);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter.excuseKey, filter.tripperId, filter.travelTypeKey],
  );

  useEffect(() => {
    setFilter((prev) => ({ ...prev, tripperId: tripperId ?? null }));
  }, [tripperId]);

  useEffect(() => {
    async function loadTrippers() {
      try {
        const res = await fetch("/api/trippers");
        if (!res.ok) return;
        const data = await res.json();
        const list: TripperFilterOption[] = (
          Array.isArray(data) ? data : []
        ).map((user: TripperApiUser) => ({
          avatarUrl: user.avatarUrl ?? null,
          id: user.id,
          name: user.name,
          slug: user.tripperSlug ?? user.id,
        }));
        setTrippers(list);
      } catch {
        setTrippers([]);
      }
    }
    loadTrippers();
  }, []);

  useEffect(() => {
    setPage(1);
    setBlogs([]);
    setHasMore(true);
    fetchBlogs(1, false);
  }, [fetchBlogs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchBlogs(nextPage, true);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loadingMore, loading, page, fetchBlogs]);

  return (
    <>
      <HeaderHero
        {...BLOG_LISTING_HERO_CONFIG}
        description={copy.heroDescription}
        title={heroTitle}
      />

      <Section>
        <div className="rt-container text-left">
          <BlogFilterHeader
            className="mb-8"
            labels={copy.filters}
            onChange={setFilter}
            trippers={trippers}
            value={filter}
          />

          {loading && blogs.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <>
              {tripperName && (
                <div className="mb-6">
                  <Link
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    href={pathForLocale(locale, `/trippers/${tripperId}`)}
                  >
                    {backToProfileText}
                  </Link>
                </div>
              )}

              {blogs.length === 0 ? (
                <GlassCard>
                  <div className="p-12 text-center">
                    <Book className="mx-auto mb-4 h-16 w-16 text-neutral-400" />
                    <p className="mb-2 text-lg text-neutral-500">
                      {copy.emptyTitle}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {copy.emptySubtitle}
                    </p>
                  </div>
                </GlassCard>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-6">
                    {blogs.map((post, index) => (
                      <BlogIndexCard
                        colSpan={getColSpan(index)}
                        isLarge={isLargeCard(index)}
                        key={post.id}
                        locale={locale}
                        post={post}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div
                      className="flex justify-center py-8"
                      ref={observerTarget}
                    >
                      {loadingMore && <LoadingSpinner />}
                    </div>
                  )}

                  {!hasMore && blogs.length > 0 && (
                    <div className="py-8 text-center text-neutral-500">
                      <p>{copy.seenAll}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Section>
    </>
  );
}
