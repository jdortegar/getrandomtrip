'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import BlogPostHero from '@/components/blog/BlogPostHero';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Carousel } from '@/components/Carousel';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import Img from '@/components/common/Img';
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [lightboxUrl]);

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
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-sm text-neutral-600"
          >
            <Link
              className="inline-flex items-center gap-1 transition-colors hover:text-neutral-900"
              href="/blog"
            >
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              Tripper Inspirations
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="font-medium capitalize text-neutral-900">
              {blog.title.toLowerCase()}
            </span>
          </nav>

          {/* Main content */}
          <article className="text-left">
            <h1 className="mb-8 font-barlow-condensed text-4xl font-bold uppercase leading-tight text-neutral-900 md:text-5xl">
              {blog.title}
            </h1>

            {blog.content ? (
              <div
                className="prose prose-neutral max-w-none text-left text-lg leading-relaxed prose-p:mb-6 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            ) : (
              <p className="text-neutral-500">
                Este post aún no tiene contenido.
              </p>
            )}
          </article>

          {/* FAQ Section */}
          {faqItems.length > 0 && (
            <section aria-labelledby="faq-heading" className="mt-10 text-left">
              <Accordion collapsible type="single">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    className="border-neutral-200"
                    value={`faq-${index}`}
                  >
                    <AccordionTrigger className="flex gap-3 py-4 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180 items-center">
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-neutral-900"
                      >
                        <Img
                          src="/assets/icons/isologo.png"
                          alt="FAQ"
                          width={32}
                          height={32}
                        />
                      </span>
                      <span className="flex-1 text-left font-medium text-neutral-900">
                        {item.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-11 text-left text-neutral-600">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Image carousel */}
        </div>
      </Section>
      {carouselImages.length > 0 && (
        <Section className="!py-0">
          <div className="relative">
            <Carousel
              edgeBleed={false}
              itemClassName="min-w-0 flex-shrink-0 basis-full md:basis-[calc((100%-2*1rem)/3)]"
              opts={{ align: 'start', loop: true }}
              showArrows
              showDots
              showNavWithSingleSlide
              slidesToScroll={3}
            >
              {carouselImages.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  className="relative h-[316px] w-full cursor-pointer overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                  onClick={() => setLightboxUrl(url)}
                  type="button"
                >
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 85vw, (max-width: 1024px) 70vw, 55vw"
                    src={url}
                  />
                </button>
              ))}
            </Carousel>
          </div>
        </Section>
      )}

      {lightboxUrl && (
        <div
          aria-label="Ver imagen en grande"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50"
            onClick={() => setLightboxUrl(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            <button
              aria-label="Cerrar"
              className="absolute right-2 top-2 z-10 rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              onClick={() => setLightboxUrl(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full">
              <Image
                alt=""
                className="object-contain"
                fill
                sizes="90vw"
                src={lightboxUrl}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {blog.author.motto && (
        <Section fullWidth>
          <TripperMottoBanner
            authorName={blog.author.name}
            authorSlug={blog.author.slug}
            avatarUrl={blog.author.avatarUrl}
            backgroundImageUrl={blog.coverUrl}
            motto={blog.author.motto}
            specialization={blog.author.specialization}
          />
        </Section>
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
          avatar: blog.author.avatarUrl ?? '',
          location: blog.author.location ?? '',
          name: blog.author.name,
          slug: blog.author.slug,
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
