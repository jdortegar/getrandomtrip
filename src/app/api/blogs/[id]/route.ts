// ============================================================================
// GET /api/blogs/[id] - Get a single published blog post by ID (public)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blogId = params.id;

    // Fetch blog post (only published posts are public)
    const blog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        blocks: true,
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

    // Transform to match frontend type
    const transformedBlog = {
      id: blog.id,
      title: blog.title,
      subtitle: blog.subtitle || '',
      tagline: blog.tagline || '',
      coverUrl: blog.coverUrl || '/images/placeholders/cover-1.jpg',
      blocks: blog.blocks as any,
      tags: blog.tags,
      format: blog.format.toLowerCase(),
      seo: blog.seo,
      publishedAt: blog.publishedAt?.toISOString(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      author: {
        id: blog.author.id,
        name: blog.author.name,
        slug: blog.author.tripperSlug || '',
        avatarUrl: blog.author.avatarUrl || '',
        bio: blog.author.bio || '',
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
