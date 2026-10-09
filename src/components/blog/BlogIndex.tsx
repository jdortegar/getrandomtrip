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
import { Button } from "@/components/ui/Button";
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

  const requestGeneration = useRef(0);
  const [resultLocale, setResultLocale] = useState(locale);
  const [blogs, setBlogs] = useState<BlogIndexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trippers, setTrippers] = useState<TripperFilterOption[]>([]);
  const [filter, setFilter] = useState<BlogFilterState>({
    excuseKey: null,
    levelKey: "",
    tripperId: tripperId ?? null,
    travelTypeKey: "",
  });

  const heroTitle = tripperName
    ? copy.heroTitleByTripper.replace("{name}", tripperName)
    : copy.heroTitleDefault;
  const backToProfileText = tripperName
    ? copy.backToProfile.replace("{name}", tripperName)
    : "";

  const fetchBlogs = useCallback(
    (pageNum: number, append: boolean = false) => {
      const generation = ++requestGeneration.current;
        const query = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          locale,
          page: pageNum.toString(),
        });

        if (filter.tripperId) query.append("tripperId", filter.tripperId);
        if (filter.levelKey) query.append("level", filter.levelKey);
        if (filter.travelTypeKey)
          query.append("travelType", filter.travelTypeKey);
        if (filter.excuseKey) query.append("excuseKey", filter.excuseKey);

        return fetch(`/api/blogs?${query.toString()}`)
          .then(async (response) => ({ response, data: await response.json() as BlogIndexResponse }))
          .then(({ response, data }) => {
        if (generation !== requestGeneration.current) return;
        if (response.ok && data.blogs) {
          setResultLocale(locale);
          setBlogs((prev) => (append ? [...prev, ...data.blogs] : data.blogs));
          setHasMore(data.pagination.hasMore);
        } else {
          console.error("Error fetching blogs:", data);
        }
      }).catch((error: unknown) => {
        console.error("Error fetching blogs:", error);
      }).finally(() => {
        if (generation === requestGeneration.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    },
    [
      locale,
      filter.excuseKey,
      filter.levelKey,
      filter.tripperId,
      filter.travelTypeKey,
      setLoading,
      setLoadingMore,
      setBlogs,
      setHasMore,
      setResultLocale,
    ],
  );

  const [previousTripperId, setPreviousTripperId] = useState(tripperId);
  if (previousTripperId !== tripperId) {
    setPreviousTripperId(tripperId);
    setFilter((prev) => ({ ...prev, tripperId: tripperId ?? null }));
  }

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

  const queryKey = JSON.stringify([locale, filter]);
  const [previousQueryKey, setPreviousQueryKey] = useState(queryKey);
  if (previousQueryKey !== queryKey) {
    setPreviousQueryKey(queryKey);
    setPage(1);
    setBlogs([]);
    setHasMore(true);
    setLoading(true);
    setLoadingMore(false);
  }

  useEffect(() => {
    void fetchBlogs(1, false);
    return () => { requestGeneration.current += 1; };
  }, [fetchBlogs]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    void fetchBlogs(nextPage, true);
  }, [page, fetchBlogs, setPage, setLoadingMore]);

  const visibleBlogs = resultLocale === locale ? blogs : [];

  return (
    <>
      <HeaderHero
        {...BLOG_LISTING_HERO_CONFIG}
        description={copy.heroDescription}
        title={heroTitle}
        titleClassName={tripperName ? undefined : "uppercase"}
      />

      <Section>
        <div className="rt-container text-left">
          <BlogFilterHeader
            className="mb-8"
            labels={copy.filters}
            locale={locale}
            onChange={setFilter}
            trippers={trippers}
            value={filter}
          />

          {loading && visibleBlogs.length === 0 ? (
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

              {visibleBlogs.length === 0 ? (
                <GlassCard>
                  <div className="p-12 text-center">
                    <Book className="mx-auto mb-4 h-16 w-16 text-neutral-400" />
                    <p className="mb-2 text-lg text-ink">
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
                    {visibleBlogs.map((post, index) => (
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
                    <div className="flex justify-center py-8">
                      <Button
                        disabled={loadingMore}
                        onClick={handleLoadMore}
                        size="sm"
                      >
                        {loadingMore ? "..." : copy.loadMore}
                      </Button>
                    </div>
                  )}

                  {!hasMore && visibleBlogs.length > 0 && (
                    <div className="py-8 text-center text-ink">
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
