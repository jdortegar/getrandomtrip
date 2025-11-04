'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import BlogComposer from '@/components/tripper/blog/BlogComposer';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import type { BlogPost } from '@/types/blog';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function EditBlogContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Partial<BlogPost> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postId = params?.id?.toString() ?? '';

  useEffect(() => {
    async function fetchPost() {
      if (!session?.user?.id || !postId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/tripper/blogs/${postId}`);

        if (response.ok) {
          const data = await response.json();
          setPost(data.blog);
        } else if (response.status === 404) {
          setError('Post no encontrado');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Error al cargar el post');
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError('Error al cargar el post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [session?.user?.id, postId]);

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
          <div className="max-w-full mx-auto">
            <LoadingSpinner />
          </div>
        </Section>
      </>
    );
  }

  if (error || !post) {
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
          <div className="max-w-full mx-auto">
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">
                {error ||
                  'El post que buscas no existe o no tienes permisos para verlo.'}
              </p>
              <Link
                href="/dashboard/tripper/blogs"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mis Posts
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
          title: post.title || 'Editar Post',
          subtitle: post.subtitle || 'Modifica tu contenido',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: post.coverUrl || '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-full mx-auto">
          <BlogComposer post={post} mode="edit" />
        </div>
      </Section>
    </>
  );
}

function EditBlogPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <EditBlogContent />
    </SecureRoute>
  );
}

export default EditBlogPage;

