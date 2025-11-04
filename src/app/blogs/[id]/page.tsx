'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Quote,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
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
  const router = useRouter();
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
      } catch (error) {
        console.error('Error fetching blog:', error);
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
            className="text-lg text-neutral-700 leading-relaxed mb-6"
          >
            {block.text}
          </p>
        );

      case 'image':
        return (
          <div key={index} className="my-8">
            {block.url && (
              <div className="relative w-full h-96 rounded-xl overflow-hidden">
                <Image
                  src={block.url}
                  alt={block.caption || ''}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {block.caption && (
              <p className="text-sm text-neutral-500 italic mt-2 text-center">
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
                src={block.url}
                controls
                className="w-full rounded-xl"
              />
            )}
            {block.caption && (
              <p className="text-sm text-neutral-500 italic mt-2 text-center">
                {block.caption}
              </p>
            )}
          </div>
        );

      case 'embed':
        return (
          <div key={index} className="my-8">
            {block.url && (
              <div className="aspect-video rounded-xl overflow-hidden">
                {block.provider === 'youtube' && (
                  <iframe
                    src={block.url}
                    title={block.title || 'Embedded content'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {block.provider !== 'youtube' && (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100">
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
            className="my-8 border-l-4 border-blue-500 pl-6 italic text-xl text-neutral-700"
          >
            <p>"{block.text}"</p>
            {block.cite && (
              <footer className="mt-2 text-base text-neutral-500 not-italic">
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
          content={{
            title: 'Cargando Post',
            subtitle: 'Obteniendo información del post...',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="max-w-4xl mx-auto">
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
          content={{
            title: 'Post No Encontrado',
            subtitle: error || 'El post que buscas no existe',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">
                {error || 'El post que buscas no existe o ya no está disponible.'}
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
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
        content={{
          title: blog.title,
          subtitle: blog.subtitle || blog.tagline || '',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: blog.coverUrl || '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[50vh]"
      />

      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Blog
            </Link>
          </div>

          <article>
            {/* Cover Image */}
            {blog.coverUrl && (
              <div className="relative w-full h-96 rounded-xl overflow-hidden mb-8">
                <Image
                  src={blog.coverUrl}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Header */}
            <GlassCard>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-4xl font-bold text-neutral-900 mb-4">
                  {blog.title}
                </h1>

                {blog.subtitle && (
                  <p className="text-xl text-neutral-600 mb-6">{blog.subtitle}</p>
                )}

                {blog.tagline && (
                  <p className="text-lg text-neutral-500 italic mb-6">
                    {blog.tagline}
                  </p>
                )}

                {/* Author and Date */}
                <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                  <Link
                    href={`/trippers/${blog.author.slug}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {blog.author.avatarUrl ? (
                      <Image
                        src={blog.author.avatarUrl}
                        alt={blog.author.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {blog.author.name}
                      </p>
                      {blog.author.bio && (
                        <p className="text-sm text-neutral-600 line-clamp-1">
                          {blog.author.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {blog.publishedAt && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(blog.publishedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Content Blocks */}
            <GlassCard className="mt-8">
              <div className="p-8 prose prose-lg max-w-none">
                {blog.blocks && blog.blocks.length > 0 ? (
                  blog.blocks.map((block, index) => renderBlock(block, index))
                ) : (
                  <p className="text-neutral-500">
                    Este post aún no tiene contenido.
                  </p>
                )}
              </div>
            </GlassCard>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="mt-8">
                <GlassCard>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="w-5 h-5 text-neutral-500" />
                      <h3 className="font-semibold text-neutral-900">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-sm rounded-full bg-neutral-100 text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Author Card */}
            <div className="mt-8">
              <GlassCard>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {blog.author.avatarUrl ? (
                      <Image
                        src={blog.author.avatarUrl}
                        alt={blog.author.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-10 h-10 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link
                        href={`/trippers/${blog.author.slug}`}
                        className="block"
                      >
                        <h3 className="text-xl font-semibold text-neutral-900 mb-2 hover:text-blue-600 transition-colors">
                          {blog.author.name}
                        </h3>
                      </Link>
                      {blog.author.bio && (
                        <p className="text-neutral-600 mb-4">{blog.author.bio}</p>
                      )}
                      <Link
                        href={`/trippers/${blog.author.slug}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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

