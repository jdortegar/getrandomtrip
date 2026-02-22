// ============================================================================
// GET /api/blogs - Get all published blog posts (public, with pagination)
// ============================================================================

import { BlogStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const tripperId = searchParams.get('tripperId');
    const tripperIds = searchParams.get('tripperIds'); // comma-separated
    const travelType = searchParams.get('travelType');
    const excuseKey = searchParams.get('excuseKey');
    const skip = (page - 1) * limit;

    const where: {
      authorId?: string | { in: string[] };
      excuseKey?: string | null;
      status: BlogStatus;
      travelType?: string | null;
    } = {
      status: BlogStatus.PUBLISHED,
    };
    if (tripperId) {
      where.authorId = tripperId;
    } else if (tripperIds?.trim()) {
      const ids = tripperIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        where.authorId = { in: ids };
      }
    }

    if (travelType?.trim()) {
      where.travelType = travelType.trim();
    }

    if (excuseKey?.trim()) {
      where.excuseKey = excuseKey.trim();
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
          travelType: true,
          excuseKey: true,
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

    // Transform to match frontend type (author included via select)
    type BlogWithAuthor = (typeof blogs)[number];
    const transformedBlogs = blogs.map((blog: BlogWithAuthor) => ({
      author: {
        avatarUrl: blog.author.avatarUrl ?? '',
        id: blog.author.id,
        name: blog.author.name,
        slug: blog.author.tripperSlug ?? '',
      },
      coverUrl: blog.coverUrl,
      excuseKey: blog.excuseKey ?? null,
      format: blog.format.toLowerCase(),
      id: blog.id,
      publishedAt: blog.publishedAt?.toISOString(),
      subtitle: blog.subtitle ?? '',
      tagline: blog.tagline ?? '',
      tags: blog.tags,
      title: blog.title,
      travelType: blog.travelType ?? null,
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
