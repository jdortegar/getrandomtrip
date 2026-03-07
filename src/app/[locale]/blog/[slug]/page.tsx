'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import BlogPostHero from '@/components/blog/BlogPostHero';
import BlogArticle from '@/components/blog/BlogArticle';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import LightboxCarousel from '@/components/media/LightboxCarousel';
import FaqSection from '@/components/display/FaqSection';
import { ArrowLeft } from 'lucide-react';
import Blog from '@/components/Blog';
import TripperMottoBanner from '@/components/blog/TripperMottoBanner';
import Testimonials from '@/components/Testimonials';
import { getAllTestimonialsForTripper } from '@/lib/helpers/Tripper';
import type { BlogPost as BlogCardPost } from '@/lib/data/shared/blog-types';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline?: string;
  coverUrl: string | null;
  content: string | null;
  blocks?: Array<{ type: string; url?: string }>;
  faq?: { items?: { question: string; answer: string }[] } | null;
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
    location?: string;
    motto?: string | null;
    specialization?: string | null;
  };
}

function BlogDetailContent() {
  const params = useParams();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [authorPosts, setAuthorPosts] = useState<BlogCardPost[]>([]);
  const [otherPosts, setOtherPosts] = useState<BlogCardPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isSofia =
    blog?.author?.name?.toLowerCase() === 'sofia' ||
    blog?.author?.slug?.toLowerCase() === 'sofia';

  const slugOrId = params?.slug?.toString() ?? '';

  useEffect(() => {
    async function fetchBlog() {
      if (!slugOrId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/blogs/${slugOrId}`);
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
  }, [slugOrId]);

  useEffect(() => {
    if (!blog?.author?.id) return;
    const authorId = blog.author.id;
    const currentId = blog.id;
    const currentSlug = blog.slug;

    async function fetchAuthorPosts() {
      try {
        const res = await fetch(`/api/blogs?tripperId=${authorId}&limit=6`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.blogs)) return;
        const posts: BlogCardPost[] = data.blogs
          .filter(
            (b: { id?: string; slug?: string }) =>
              b.id !== currentId && b.slug !== currentSlug,
          )
          .filter((b: { coverUrl?: string | null }) => b.coverUrl)
          .map(
            (b: {
              slug?: string;
              id?: string;
              title: string;
              coverUrl: string;
              tags: string[];
            }) => ({
              category: b.tags?.[0] ?? 'Viajes',
              href: `/blog/${b.slug ?? b.id}`,
              image: b.coverUrl,
              title: b.title,
            }),
          );
        setAuthorPosts(posts);
      } catch {
        setAuthorPosts([]);
      }
    }

    fetchAuthorPosts();
  }, [blog?.id, blog?.slug, blog?.author?.id]);

  useEffect(() => {
    if (!blog) return;
    const isAuthorSofia =
      blog.author.name?.toLowerCase() === 'sofia' ||
      blog.author.slug?.toLowerCase() === 'sofia';
    if (!isAuthorSofia) return;

    const currentId = blog.id;
    const currentSlug = blog.slug;

    async function fetchOtherPosts() {
      try {
        const res = await fetch(`/api/blogs?limit=8`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.blogs)) return;
        const posts: BlogCardPost[] = data.blogs
          .filter(
            (b: { id?: string; slug?: string }) =>
              b.id !== currentId && b.slug !== currentSlug,
          )
          .filter((b: { coverUrl?: string | null }) => b.coverUrl)
          .slice(0, 6)
          .map(
            (b: {
              slug?: string;
              id?: string;
              title: string;
              coverUrl: string;
              tags: string[];
            }) => ({
              category: b.tags?.[0] ?? 'Viajes',
              href: `/blog/${b.slug ?? b.id}`,
              image: b.coverUrl,
              title: b.title,
            }),
          );
        setOtherPosts(posts);
      } catch {
        setOtherPosts([]);
      }
    }

    fetchOtherPosts();
  }, [blog?.id, blog?.slug]);

  const carouselImages = useMemo(() => {
    if (!blog) return [];
    const urls: string[] = [];
    if (blog.coverUrl) urls.push(blog.coverUrl);
    (blog.blocks ?? []).forEach((b) => {
      if (b.type === 'image' && b.url) urls.push(b.url);
    });
    return urls;
  }, [blog?.coverUrl, blog?.blocks]);

  if (loading) {
    return (
      <>
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
        <Section>
          <div className="mx-auto max-w-4xl">
            <div className="py-12 text-center">
              <p className="mb-4 text-neutral-500">
                {error ??
                  'El post que buscas no existe o ya no está disponible.'}
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

  const faqFromSchema = (() => {
    if (!blog.faq) return null;
    const f = blog.faq as
      | { items?: { question: string; answer: string }[] }
      | { question: string; answer: string }[];
    if (Array.isArray(f)) return f;
    if (f.items && Array.isArray(f.items)) return f.items;
    return null;
  })();
  const faqItems = faqFromSchema ?? [];

  return (
    <>
      <BlogPostHero
        author={{
          avatarUrl: blog.author.avatarUrl,
          location: blog.author.location,
          name: blog.author.name,
          slug: blog.author.slug,
        }}
        coverUrl={blog.coverUrl}
        subtitle={blog.subtitle || blog.tagline || ''}
        title={blog.title}
      />

      <Section>
        <div className="mx-auto max-w-4xl px-4">
          <Breadcrumb
            items={[
              { href: '/blog', label: 'Tripper Inspirations' },
              { label: blog.title },
            ]}
          />

          {/* Main content */}
          <BlogArticle
            content={blog.content}
            emptyMessage="Este post aún no tiene contenido."
            title={blog.title}
          />

          <FaqSection items={faqItems} />
        </div>
      </Section>
      <LightboxCarousel images={carouselImages} />

      {blog.author.motto && (
        <TripperMottoBanner
          authorName={blog.author.name}
          authorSlug={blog.author.slug}
          avatarUrl={blog.author.avatarUrl}
          backgroundImageUrl={blog.coverUrl}
          motto={blog.author.motto}
          specialization={blog.author.specialization}
        />
      )}

      {authorPosts.length > 0 && (
        <Blog
          eyebrow="EXPLORA"
          id="more-posts"
          posts={authorPosts}
          subtitle="Notas, guías y momentos que inspiran. Escritos en primera persona."
          title="MÁS DE MIS AVENTURAS"
          viewAll={{
            href: `/blog?tripperId=${blog.author.id}&tripper=${blog.author.name}`,
            subtitle: 'Explora más contenido',
            title: 'Ver Todo',
          }}
        />
      )}

      <Testimonials
        testimonials={getAllTestimonialsForTripper({
          location: blog.author.location ?? '',
          testimonials: [],
        })}
        title={`Lo que dicen sobre ${blog.author.name}`}
      />
    </>
  );
}

export default function BlogDetailPage() {
  return <BlogDetailContent />;
}
