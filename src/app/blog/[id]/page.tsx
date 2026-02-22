'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
} from 'lucide-react';

interface BlogBlock {
  type: 'paragraph' | 'image' | 'video' | 'embed' | 'quote';
  text?: string;
  url?: string;
  caption?: string;
  cite?: string;
  provider?: string;
  title?: string;
}

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  tagline?: string;
  coverUrl: string;
  blocks: BlogBlock[];
  tags: string[];
  format: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string;
    bio?: string;
  };
}

function BlogDetailContent() {
  const params = useParams();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const blogId = params?.id?.toString() ?? '';

  useEffect(() => {
    async function fetchBlog() {
      if (!blogId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/blogs/${blogId}`);
        const data = await response.json();

        if (response.ok && data.blog) {
          setBlog(data.blog);
        } else if (response.status === 404) {
          setError('Post no encontrado');
        } else {
          setError(data.error || 'Error al cargar el post');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Error al cargar el post');
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [blogId]);

  const renderBlock = (block: BlogBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p
            key={index}
            className="mb-6 text-lg leading-relaxed text-neutral-700"
          >
            {block.text}
          </p>
        );

      case 'image':
        return (
          <div key={index} className="my-8">
            {block.url && (
              <div className="relative h-96 w-full overflow-hidden rounded-xl">
                <Image
                  alt={block.caption || ''}
                  className="object-cover"
                  fill
                  src={block.url}
                />
              </div>
            )}
            {block.caption && (
              <p className="mt-2 text-center text-sm italic text-neutral-500">
                {block.caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div key={index} className="my-8">
            {block.url && (
              <video
                className="w-full rounded-xl"
                controls
                src={block.url}
              />
            )}
            {block.caption && (
              <p className="mt-2 text-center text-sm italic text-neutral-500">
                {block.caption}
              </p>
            )}
          </div>
        );

      case 'embed':
        return (
          <div key={index} className="my-8">
            {block.url && (
              <div className="aspect-video overflow-hidden rounded-xl">
                {block.provider === 'youtube' && (
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    src={block.url}
                    title={block.title || 'Embedded content'}
                  />
                )}
                {block.provider !== 'youtube' && (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                    <p className="text-neutral-500">Embed: {block.url}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'quote':
        return (
          <blockquote
            key={index}
            className="my-8 border-l-4 border-blue-500 pl-6 text-xl italic text-neutral-700"
          >
            <p>"{block.text}"</p>
            {block.cite && (
              <footer className="mt-2 text-base not-italic text-neutral-500">
                — {block.cite}
              </footer>
            )}
          </blockquote>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <Hero
          className="!h-[40vh]"
          content={{
            fallbackImage: '/images/bg-playa-mexico.jpg',
            subtitle: 'Obteniendo información del post...',
            title: 'Cargando Post',
            videoSrc: '/videos/hero-video.mp4',
          }}
        />
        <Section>
          <div className="mx-auto max-w-4xl">
            <LoadingSpinner />
          </div>
        </Section>
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Hero
          className="!h-[40vh]"
          content={{
            fallbackImage: '/images/bg-playa-mexico.jpg',
            subtitle: error || 'El post que buscas no existe',
            title: 'Post No Encontrado',
            videoSrc: '/videos/hero-video.mp4',
          }}
        />
        <Section>
          <div className="mx-auto max-w-4xl">
            <div className="py-12 text-center">
              <p className="mb-4 text-neutral-500">
                {error || 'El post que buscas no existe o ya no está disponible.'}
              </p>
              <Link
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
                href="/blog"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Blog
              </Link>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Hero
        className="!h-[50vh]"
        content={{
          fallbackImage: blog.coverUrl ?? undefined,
          subtitle: blog.subtitle || blog.tagline || '',
          title: blog.title,
          videoSrc: '/videos/hero-video.mp4',
        }}
      />

      <Section>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
              href="/blog"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Blog
            </Link>
          </div>

          <article>
            {blog.coverUrl && (
              <div className="relative mb-8 h-96 w-full overflow-hidden rounded-xl">
                <Image
                  alt={blog.title}
                  className="object-cover"
                  fill
                  src={blog.coverUrl}
                />
              </div>
            )}

            <GlassCard>
              <div className="p-8">
                <div className="mb-4 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="mb-4 text-4xl font-bold text-neutral-900">
                  {blog.title}
                </h1>

                {blog.subtitle && (
                  <p className="mb-6 text-xl text-neutral-600">{blog.subtitle}</p>
                )}

                {blog.tagline && (
                  <p className="mb-6 text-lg italic text-neutral-500">
                    {blog.tagline}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
                  <Link
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    href={`/trippers/${blog.author.slug}`}
                  >
                    {blog.author.avatarUrl ? (
                      <Image
                        alt={blog.author.name}
                        className="rounded-full"
                        height={48}
                        width={48}
                        src={blog.author.avatarUrl}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {blog.author.name}
                      </p>
                      {blog.author.bio && (
                        <p className="line-clamp-1 text-sm text-neutral-600">
                          {blog.author.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {blog.publishedAt && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(blog.publishedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="mt-8">
              <div className="prose prose-lg max-w-none p-8">
                {blog.blocks && blog.blocks.length > 0 ? (
                  blog.blocks.map((block, index) => renderBlock(block, index))
                ) : (
                  <p className="text-neutral-500">
                    Este post aún no tiene contenido.
                  </p>
                )}
              </div>
            </GlassCard>

            {blog.tags.length > 0 && (
              <div className="mt-8">
                <GlassCard>
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-neutral-500" />
                      <h3 className="font-semibold text-neutral-900">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            <div className="mt-8">
              <GlassCard>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {blog.author.avatarUrl ? (
                      <Image
                        alt={blog.author.name}
                        className="rounded-full"
                        height={80}
                        width={80}
                        src={blog.author.avatarUrl}
                      />
                    ) : (
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-10 w-10 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link
                        className="block"
                        href={`/trippers/${blog.author.slug}`}
                      >
                        <h3 className="mb-2 text-xl font-semibold text-neutral-900 transition-colors hover:text-blue-600">
                          {blog.author.name}
                        </h3>
                      </Link>
                      {blog.author.bio && (
                        <p className="mb-4 text-neutral-600">{blog.author.bio}</p>
                      )}
                      <Link
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        href={`/trippers/${blog.author.slug}`}
                      >
                        Ver perfil completo →
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </article>
        </div>
      </Section>
    </>
  );
}

export default function BlogDetailPage() {
  return <BlogDetailContent />;
}
