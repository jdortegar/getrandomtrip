// ============================================================================
// GET /api/blogs - Get all published blog posts (public, with pagination)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const tripperId = searchParams.get('tripperId');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    };

    if (tripperId) {
      where.authorId = tripperId;
    }

    // Fetch blogs with pagination
    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          tagline: true,
          coverUrl: true,
          tags: true,
          format: true,
          publishedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              tripperSlug: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    // Transform to match frontend type
    const transformedBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      subtitle: blog.subtitle || '',
      tagline: blog.tagline || '',
      coverUrl: blog.coverUrl || '/images/placeholders/cover-1.jpg',
      tags: blog.tags,
      format: blog.format.toLowerCase(),
      publishedAt: blog.publishedAt?.toISOString(),
      author: {
        id: blog.author.id,
        name: blog.author.name,
        slug: blog.author.tripperSlug || '',
        avatarUrl: blog.author.avatarUrl || '',
      },
    }));

    const hasMore = skip + blogs.length < total;

    return NextResponse.json({
      blogs: transformedBlogs,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
