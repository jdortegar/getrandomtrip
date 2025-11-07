'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Book, User, Calendar } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  tagline?: string;
  coverUrl: string;
  tags: string[];
  format: string;
  publishedAt?: string;
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
  const searchParams = useSearchParams();
  const tripperId = searchParams.get('tripperId');
  const tripperName = searchParams.get('tripper');

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '12',
        });

        if (tripperId) {
          params.append('tripperId', tripperId);
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
    [tripperId],
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

  if (loading && blogs.length === 0) {
    return (
      <>
        <Hero
          content={{
            title: tripperName
              ? `Blog de ${tripperName}`
              : 'Blog de Randomtrip',
            subtitle: 'Descubre historias, guías y experiencias de nuestros trippers',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="rt-container">
            <LoadingSpinner />
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Hero
        content={{
          title: tripperName ? `Blog de ${tripperName}` : 'Blog de Randomtrip',
          subtitle: 'Descubre historias, guías y experiencias de nuestros trippers',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="rt-container">
          {tripperName && (
            <div className="mb-6">
              <Link
                href={`/trippers/${tripperId}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Volver al perfil de {tripperName}
              </Link>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              {tripperName ? `Posts de ${tripperName}` : 'Todos los Posts'}
            </h1>
            <p className="text-neutral-600">
              {total > 0
                ? `${total} ${total === 1 ? 'post publicado' : 'posts publicados'}`
                : 'No hay posts publicados aún'}
            </p>
          </div>

          {blogs.length === 0 ? (
            <GlassCard>
              <div className="p-12 text-center">
                <Book className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500 text-lg mb-2">
                  Aún no hay posts publicados
                </p>
                <p className="text-neutral-400 text-sm">
                  Los trippers están trabajando en contenido increíble. ¡Vuelve
                  pronto!
                </p>
              </div>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.id}`}
                    className="group block"
                  >
                    <GlassCard className="h-full hover:shadow-lg transition-shadow">
                      <div className="p-0 overflow-hidden rounded-xl">
                        {post.coverUrl && (
                          <div className="relative w-full h-48">
                            <Image
                              src={post.coverUrl}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          {post.subtitle && (
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                              {post.subtitle}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-200">
                            <div className="flex items-center gap-2">
                              {post.author.avatarUrl ? (
                                <Image
                                  src={post.author.avatarUrl}
                                  alt={post.author.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              <span className="font-medium">
                                {post.author.name}
                              </span>
                            </div>
                            {post.publishedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(
                                    post.publishedAt,
                                  ).toLocaleDateString('es-ES', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>

              {/* Infinite scroll trigger */}
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
                  <p>Has visto todos los posts disponibles</p>
                </div>
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
    <Suspense
      fallback={
        <>
          <Hero
            content={{
              title: 'Blog de Randomtrip',
              subtitle: 'Cargando...',
              videoSrc: '/videos/hero-video.mp4',
              fallbackImage: '/images/bg-playa-mexico.jpg',
            }}
            className="!h-[40vh]"
          />
          <Section>
            <div className="rt-container">
              <LoadingSpinner />
            </div>
          </Section>
        </>
      }
    >
      <BlogListContent />
    </Suspense>
  );
}

export default function BlogPage() {
  return <BlogPageContent />;
}
