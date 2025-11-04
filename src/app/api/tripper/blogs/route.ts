// ============================================================================
// GET /api/tripper/blogs - Get all blogs for tripper
// POST /api/tripper/blogs - Create a new blog post (tripper only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'TRIPPER') {
      return NextResponse.json(
        { error: 'Forbidden - Tripper access only' },
        { status: 403 },
      );
    }

    // Fetch blogs from database
    const blogs = await prisma.blogPost.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        blocks: true,
        tags: true,
        format: true,
        status: true,
        seo: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    // Transform to match frontend type (convert enum to lowercase)
    const transformedBlogs = blogs.map((blog) => ({
      ...blog,
      status: blog.status.toLowerCase(),
      format: blog.format.toLowerCase(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    }));

    return NextResponse.json({ blogs: transformedBlogs });
  } catch (error) {
    console.error('Error fetching tripper blogs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'TRIPPER') {
      return NextResponse.json(
        { error: 'Forbidden - Tripper access only' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      tagline,
      blocks,
      tags,
      format,
      status,
      coverUrl,
      seo,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      );
    }

    // Convert string enums to uppercase for Prisma
    const blogStatus = status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const blogFormat = format?.toUpperCase() || 'ARTICLE';
    const formatMap: Record<string, 'ARTICLE' | 'PHOTO' | 'VIDEO' | 'MIXED'> = {
      article: 'ARTICLE',
      photo: 'PHOTO',
      video: 'VIDEO',
      mixed: 'MIXED',
    };
    const prismaFormat = formatMap[blogFormat.toLowerCase()] || 'ARTICLE';

    // Create blog in database
    const blog = await prisma.blogPost.create({
      data: {
        authorId: user.id,
        title,
        subtitle: subtitle || null,
        tagline: tagline || null,
        blocks: blocks || [],
        tags: tags || [],
        format: prismaFormat,
        status: blogStatus,
        coverUrl: coverUrl || null,
        seo: seo || null,
        publishedAt: blogStatus === 'PUBLISHED' ? new Date() : null,
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        blocks: true,
        tags: true,
        format: true,
        status: true,
        seo: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    // Transform to match frontend type
    const transformedBlog = {
      ...blog,
      status: blog.status.toLowerCase(),
      format: blog.format.toLowerCase(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    };

    return NextResponse.json({ blog: transformedBlog }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

