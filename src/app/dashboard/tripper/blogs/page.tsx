'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Plus, Edit, Eye, Book } from 'lucide-react';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';

function BlogListContent() {
  const { data: session } = useSession();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/tripper/blogs');
        const data = await response.json();

        if (response.ok && data.blogs) {
          setBlogs(data.blogs);
        } else {
          console.error('Error fetching blogs:', data.error);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <>
        <Hero
          content={{
            title: 'Mis Posts',
            subtitle: 'Cargando tus posts...',
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
          title: 'Mis Posts',
          subtitle: 'Gestiona tu blog y comparte tus experiencias',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="rt-container">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-neutral-800">Mis Posts</h1>
            <Link
              href="/dashboard/tripper/blogs/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Post
            </Link>
          </div>

          <GlassCard>
            <div className="p-6">
              {blogs.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 mb-4">
                    Aún no tienes posts. ¡Es hora de contar tu primera historia!
                  </p>
                  <Link
                    href="/dashboard/tripper/blogs/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Crear mi primer post
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {post.coverUrl && (
                        <div className="relative w-full h-40">
                          <Image
                            src={post.coverUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                          {post.title}
                        </h3>
                        {post.subtitle && (
                          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                            {post.subtitle}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.status && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {post.status === 'published'
                                ? 'Publicado'
                                : 'Borrador'}
                            </span>
                          )}
                          {post.tags?.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                          {post.publishedAt && (
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString(
                                'es-ES',
                              )}
                            </span>
                          )}
                          {post.updatedAt && (
                            <span>
                              Actualizado:{' '}
                              {new Date(post.updatedAt).toLocaleDateString(
                                'es-ES',
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/tripper/blogs/${post.id}`}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Link>
                          {post.status === 'published' && (
                            <Link
                              href={`/blogs/${post.id}`}
                              target="_blank"
                              className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </Section>
    </>
  );
}

function BlogListPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <BlogListContent />
    </SecureRoute>
  );
}

export default BlogListPage;

