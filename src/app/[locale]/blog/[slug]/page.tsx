import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import { hasLocale } from "@/lib/i18n/config";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildBlogPostingSchema } from "@/lib/seo/schemas";
import BlogPostClient, {
  type BlogPost,
  BlogPostLoading,
} from "@/components/app/blog/BlogPostClient";

function isCuid(param: string): boolean {
  return (
    param.length === 25 && param.startsWith("c") && /^c[a-z0-9]+$/.test(param)
  );
}

async function getBlogPost(slugOrId: string): Promise<BlogPost | null> {
  const blog = await prisma.blogPost.findFirst({
    where: {
      isActive: true,
      isReviewCopy: false,
      status: "PUBLISHED",
      ...(isCuid(slugOrId) ? { id: slugOrId } : { slug: slugOrId }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      tagline: true,
      coverUrl: true,
      content: true,
      blocks: true,
      faq: true,
      tags: true,
      format: true,
      seo: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          tripperSlug: true,
          avatarUrl: true,
          bio: true,
          location: true,
          motto: true,
          specialization: true,
        },
      },
    },
  });

  if (!blog) return null;

  return {
    id: blog.id,
    slug: blog.slug ?? blog.id,
    title: blog.title,
    subtitle: blog.subtitle ?? "",
    tagline: blog.tagline ?? "",
    coverUrl: blog.coverUrl,
    content: blog.content ?? "",
    blocks: blog.blocks as BlogPost["blocks"],
    faq: blog.faq as BlogPost["faq"],
    tags: blog.tags,
    format: blog.format.toLowerCase(),
    seo: blog.seo as BlogPost["seo"],
    publishedAt: blog.publishedAt?.toISOString() ?? null,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    author: {
      bio: blog.author.bio ?? "",
      id: blog.author.id,
      location: blog.author.location ?? "",
      motto: blog.author.motto ?? null,
      name: blog.author.name,
      slug: blog.author.tripperSlug ?? "",
      specialization: blog.author.specialization ?? null,
      avatarUrl: normalizeUploadUrl(blog.author.avatarUrl) ?? "",
    },
  };
}

export async function generateMetadata(props: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const blog = await getBlogPost(params.slug);
  if (!blog) return { title: "Randomtrip" };

  const seoTitle = blog.seo?.title ?? `${blog.title} | Randomtrip`;
  const seoDescription = blog.seo?.description ?? blog.subtitle ?? undefined;

  return {
    description: seoDescription,
    openGraph: {
      description: seoDescription,
      images: blog.coverUrl ? [{ url: blog.coverUrl }] : undefined,
      title: seoTitle,
      type: "article",
    },
    title: seoTitle,
  };
}

export default async function BlogDetailPage(props: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale! : "es";
  const blog = await getBlogPost(params.slug);

  if (!blog) notFound();

  const jsonLdSchema = buildBlogPostingSchema({
    authorName: blog.author.name,
    createdAt: blog.createdAt,
    description: blog.seo?.description ?? blog.subtitle ?? undefined,
    heroImage: blog.coverUrl ?? undefined,
    publishedAt: blog.publishedAt ?? undefined,
    slug: blog.slug,
    title: blog.title,
  });

  return (
    <>
      <JsonLd schema={jsonLdSchema} />
      <Suspense fallback={<BlogPostLoading />}>
        <BlogPostClient blog={blog} locale={locale} />
      </Suspense>
    </>
  );
}
