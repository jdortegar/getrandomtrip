'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Book } from 'lucide-react';
import {
  BlogFilterHeader,
  type BlogFilterState,
} from '@/components/blog/BlogFilterHeader';
import HeaderHero from '@/components/journey/HeaderHero';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import Section from '@/components/layout/Section';
import GlassCard from '@/components/ui/GlassCard';
import type { TripperFilterOption } from '@/lib/constants/blog-filters';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import { cn } from '@/lib/utils';

/** Single source of truth for blog page hero (SOLID: single responsibility, no duplication). */
const BLOG_HERO_CONFIG = {
  className: '!min-h-[40vh]',
  eyebrowColor: '#F2C53D',
  fallbackImage: '/images/hero-image-1.jpeg',
  subtitle: 'BLOG',
  videoSrc: '/videos/hero-video.mp4',
} as const;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline?: string;
  coverUrl: string | null;
  tags: string[];
  format: string;
  publishedAt?: string;
  travelType: string | null;
  excuseKey: string | null;
  /** Single author (tripper) per post. */
  author: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string;
  };
}

interface BlogResponse {
  blogs: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

function BlogListContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawLocale = params?.locale;
  const localeStr = typeof rawLocale === 'string' ? rawLocale : rawLocale?.[0];
  const locale: Locale = hasLocale(localeStr) ? (localeStr as Locale) : 'es';
  const tripperId = searchParams.get('tripperId');
  const tripperName = searchParams.get('tripper');

  const [dict, setDict] = useState<Dictionary | null>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState<BlogFilterState>({
    excuseKey: null,
    tripperId: tripperId ?? null,
    travelTypeKey: '',
  });
  const [trippers, setTrippers] = useState<TripperFilterOption[]>([]);

  useEffect(() => {
    getDictionary(locale).then(setDict);
  }, [locale]);

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      tripperId: tripperId ?? null,
    }));
  }, [tripperId]);

  useEffect(() => {
    async function loadTrippers() {
      try {
        const res = await fetch('/api/trippers');
        if (!res.ok) return;
        const data = await res.json();
        const list: TripperFilterOption[] = (
          Array.isArray(data) ? data : []
        ).map(
          (u: {
            id: string;
            name: string;
            tripperSlug: string | null;
            avatarUrl: string | null;
          }) => ({
            avatarUrl: u.avatarUrl ?? null,
            id: u.id,
            name: u.name,
            slug: u.tripperSlug ?? u.id,
          }),
        );
        setTrippers(list);
      } catch {
        setTrippers([]);
      }
    }
    loadTrippers();
  }, []);

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = new URLSearchParams({
          limit: '12',
          page: pageNum.toString(),
        });

        if (filter.tripperId) {
          params.append('tripperId', filter.tripperId);
        }

        if (filter.travelTypeKey) {
          params.append('travelType', filter.travelTypeKey);
        }
        if (filter.excuseKey) {
          params.append('excuseKey', filter.excuseKey);
        }

        const response = await fetch(`/api/blogs?${params.toString()}`);
        const data: BlogResponse = await response.json();

        if (response.ok && data.blogs) {
          if (append) {
            setBlogs((prev) => [...prev, ...data.blogs]);
          } else {
            setBlogs(data.blogs);
          }
          setHasMore(data.pagination.hasMore);
          setTotal(data.pagination.total);
        } else {
          console.error('Error fetching blogs:', data);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter.excuseKey, filter.tripperId, filter.travelTypeKey],
  );

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
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, fetchBlogs]);

  if (!dict) {
    return <LoadingSpinner />;
  }

  const heroTitle = tripperName
    ? dict.blogPage.heroTitleByTripper.replace('{name}', tripperName)
    : dict.blogPage.heroTitleDefault;
  const backToProfileText = tripperName
    ? dict.blogPage.backToProfile.replace('{name}', tripperName)
    : '';

  return (
    <>
      <HeaderHero
        {...BLOG_HERO_CONFIG}
        description={dict.blogPage.heroDescription}
        title={heroTitle}
      />

      <Section>
        <div className="rt-container">
          <BlogFilterHeader
            className="mb-8"
            labels={dict.blogPage.filters}
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
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    href={pathForLocale(locale, `/trippers/${tripperId}`)}
                  >
                    {backToProfileText}
                  </Link>
                </div>
              )}

              {blogs.length === 0 ? (
                <GlassCard>
                  <div className="p-12 text-center">
                    <Book className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg mb-2">
                      {dict.blogPage.emptyTitle}
                    </p>
                    <p className="text-neutral-400 text-sm">
                      {dict.blogPage.emptySubtitle}
                    </p>
                  </div>
                </GlassCard>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-6">
                    {blogs.map((post, index) => {
                      const pattern = index % 6;
                      const colSpan =
                        pattern === 0 || pattern === 1
                          ? 'md:col-span-3'
                          : pattern === 2
                            ? 'md:col-span-6'
                            : 'md:col-span-2';
                      const isLarge = pattern === 2;
                      return (
                        <Link
                          key={post.id}
                          href={pathForLocale(locale, `/blog/${post.slug}`)}
                          className={cn('group block', colSpan)}
                        >
                          <GlassCard className="relative h-full overflow-hidden rounded-xl transition-shadow hover:shadow-lg">
                            <div className="relative h-[304.83px] w-full overflow-hidden">
                              {post.coverUrl ? (
                                <>
                                  <Image
                                    alt={post.title}
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    fill
                                    sizes={
                                      isLarge
                                        ? '(min-width: 768px) 100vw, 100vw'
                                        : '(min-width: 768px) 50vw, 100vw'
                                    }
                                    src={post.coverUrl}
                                  />
                                  <div
                                    aria-hidden
                                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 bg-neutral-200" />
                              )}
                              <div
                                className={cn(
                                  'absolute bottom-10 left-0 flex w-full flex-col items-center justify-center p-4',
                                  post.coverUrl
                                    ? 'text-white'
                                    : 'text-neutral-900',
                                )}
                              >
                                <div className="flex flex-col gap-6 text-left">
                                  <h3
                                    className={cn(
                                      'font-barlow-condensed text-lg font-extrabold uppercase tracking-wide transition-colors sm:text-xl md:text-4xl',
                                      post.coverUrl
                                        ? 'text-white group-hover:text-blue-200'
                                        : 'text-neutral-900 group-hover:text-blue-600',
                                    )}
                                  >
                                    {post.title}
                                  </h3>
                                  {post.subtitle && (
                                    <p
                                      className={cn(
                                        'mt-2 line-clamp-2 text-base font-normal',
                                        post.coverUrl
                                          ? 'text-white/95'
                                          : 'text-neutral-600',
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
                    })}
                  </div>

                  {/* Infinite scroll trigger (observer pattern) */}
                  {hasMore && (
                    <div
                      ref={observerTarget}
                      className="flex justify-center py-8"
                    >
                      {loadingMore && <LoadingSpinner />}
                    </div>
                  )}

                  {!hasMore && blogs.length > 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <p>{dict.blogPage.seenAll}</p>
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

function BlogPageContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BlogListContent />
    </Suspense>
  );
}

export default function BlogPage() {
  return <BlogPageContent />;
}
