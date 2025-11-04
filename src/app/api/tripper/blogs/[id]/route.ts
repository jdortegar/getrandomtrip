// ============================================================================
// GET /api/tripper/blogs/[id] - Get a single blog post by ID for tripper
// PATCH /api/tripper/blogs/[id] - Update a blog post by ID for tripper
// DELETE /api/tripper/blogs/[id] - Delete a blog post by ID for tripper
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const blogId = params.id;

    // Find blog and verify ownership
    const blog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
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

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog post not found or access denied' },
        { status: 404 },
      );
    }

    // Transform to match frontend type
    const transformedBlog = {
      ...blog,
      status: blog.status.toLowerCase(),
      format: blog.format.toLowerCase(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const blogId = params.id;

    // Verify blog exists and belongs to user
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
      },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog post not found or access denied' },
        { status: 404 },
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
    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      );
    }

    // Convert string enums to uppercase for Prisma
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (tagline !== undefined) updateData.tagline = tagline || null;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (tags !== undefined) updateData.tags = tags;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;
    if (seo !== undefined) updateData.seo = seo || null;

    if (format !== undefined) {
      const formatMap: Record<string, 'ARTICLE' | 'PHOTO' | 'VIDEO' | 'MIXED'> = {
        article: 'ARTICLE',
        photo: 'PHOTO',
        video: 'VIDEO',
        mixed: 'MIXED',
      };
      updateData.format = formatMap[format.toLowerCase()] || 'ARTICLE';
    }

    if (status !== undefined) {
      updateData.status = status.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
      // Set publishedAt if status changed to published and it wasn't published before
      if (updateData.status === 'PUBLISHED' && !existingBlog.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Update blog in database
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: updateData,
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
      ...updatedBlog,
      status: updatedBlog.status.toLowerCase(),
      format: updatedBlog.format.toLowerCase(),
      createdAt: updatedBlog.createdAt.toISOString(),
      updatedAt: updatedBlog.updatedAt.toISOString(),
      publishedAt: updatedBlog.publishedAt?.toISOString(),
    };

    return NextResponse.json({ blog: transformedBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const blogId = params.id;

    // Find blog and verify ownership
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
      },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog post not found or access denied' },
        { status: 404 },
      );
    }

    // Delete blog from database
    await prisma.blogPost.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

