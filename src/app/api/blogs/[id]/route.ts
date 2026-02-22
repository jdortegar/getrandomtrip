// ============================================================================
// GET /api/blogs/[id] - Get a single published blog post by ID or slug (public)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** CUIDs start with 'c' and are 25 chars; slug is lowercase with dashes */
function isCuid(param: string): boolean {
  return param.length === 25 && param.startsWith('c') && /^c[a-z0-9]+$/.test(param);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const idOrSlug = params.id;

    const blog = await prisma.blogPost.findFirst({
      where: {
        status: 'PUBLISHED',
        ...(isCuid(idOrSlug)
          ? { id: idOrSlug }
          : { slug: idOrSlug }),
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

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 },
      );
    }

    const transformedBlog = {
      id: blog.id,
      slug: blog.slug ?? blog.id,
      title: blog.title,
      subtitle: blog.subtitle ?? '',
      tagline: blog.tagline ?? '',
      coverUrl: blog.coverUrl,
      content: blog.content ?? '',
      blocks: blog.blocks as any,
      faq: blog.faq as
        | { items?: { question: string; answer: string }[] }
        | { question: string; answer: string }[]
        | null,
      tags: blog.tags,
      format: blog.format.toLowerCase(),
      seo: blog.seo,
      publishedAt: blog.publishedAt?.toISOString(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      author: {
        bio: blog.author.bio ?? '',
        id: blog.author.id,
        location: blog.author.location ?? '',
        motto: blog.author.motto ?? null,
        name: blog.author.name,
        slug: blog.author.tripperSlug ?? '',
        specialization: blog.author.specialization ?? null,
        avatarUrl: blog.author.avatarUrl ?? '',
      },
    };

    return NextResponse.json({ blog: transformedBlog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
