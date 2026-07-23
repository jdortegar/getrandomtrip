// ============================================================================
// GET /api/tripper/blogs - Get all blogs for tripper
// POST /api/tripper/blogs - Create a new blog post (tripper only)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/helpers/slugify";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    // Fetch blogs from database. Review copies (isReviewCopy: true) share
    // authorId with the original and must never appear in the tripper's own
    // list — they only surface on admin review surfaces until resolved.
    const blogs = await prisma.blogPost.findMany({
      where: { authorId: user.id, isReviewCopy: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        content: true,
        blocks: true,
        faq: true,
        tags: true,
        travelType: true,
        excuseKey: true,
        format: true,
        status: true,
        isActive: true,
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
    console.error("Error fetching tripper blogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      tagline,
      content,
      blocks,
      faq,
      tags,
      format,
      // status is intentionally NOT accepted from the client — every new post
      // starts DRAFT and only transitions via the guarded submit/approve
      // endpoints, same as PATCH.
      coverUrl,
      seo,
      travelType,
      excuseKey,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const blogFormat = format?.toUpperCase() || "ARTICLE";
    const formatMap: Record<string, "ARTICLE" | "PHOTO" | "VIDEO" | "MIXED"> = {
      article: "ARTICLE",
      photo: "PHOTO",
      video: "VIDEO",
      mixed: "MIXED",
    };
    const prismaFormat = formatMap[blogFormat.toLowerCase()] || "ARTICLE";

    const travelTypeValue =
      typeof travelType === "string" && travelType.trim().length > 0
        ? travelType.trim()
        : null;
    const excuseKeyValue =
      typeof excuseKey === "string" && excuseKey.trim().length > 0
        ? excuseKey.trim()
        : null;

    const baseSlug = slugify(title) || "post";
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const blog = await prisma.blogPost.create({
      data: {
        authorId: user.id,
        title,
        slug,
        subtitle: subtitle || null,
        tagline: tagline || null,
        content: content ?? null,
        blocks: blocks || [],
        faq: faq ?? null,
        tags: tags || [],
        excuseKey: excuseKeyValue,
        travelType: travelTypeValue,
        format: prismaFormat,
        coverUrl: coverUrl || null,
        seo: seo || null,
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        content: true,
        blocks: true,
        faq: true,
        tags: true,
        travelType: true,
        excuseKey: true,
        format: true,
        status: true,
        isActive: true,
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
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
