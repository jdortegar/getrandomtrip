// ============================================================================
// GET /api/tripper/blogs - Get all blogs for tripper
// POST /api/tripper/blogs - Create a new blog post (tripper only)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/helpers/slugify";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";

/** Normalizes an incoming value into a deduped array of non-empty trimmed strings. */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen);
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    const statusParam = searchParams.get("status");
    const formatParam = searchParams.get("format");
    const travelTypeParam = searchParams.get("travelType");
    const searchParam = searchParams.get("search");

    // Fetch blogs from database. Review copies (isReviewCopy: true) share
    // authorId with the original and must never appear in the tripper's own
    // list — they only surface on admin review surfaces until resolved.
    const where: Prisma.BlogPostWhereInput = {
      authorId: user.id,
      isReviewCopy: false,
    };
    if (statusParam) {
      where.status = statusParam.toUpperCase() as Prisma.BlogPostWhereInput["status"];
    }
    if (formatParam) {
      where.format = formatParam.toUpperCase() as Prisma.BlogPostWhereInput["format"];
    }
    if (travelTypeParam) where.travelType = { has: travelTypeParam };
    if (searchParam) {
      where.title = { contains: searchParam, mode: "insensitive" };
    }

    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.blogPost.count({ where }),
    ]);

    // Transform to match frontend type (convert enum to lowercase)
    const transformedBlogs = blogs.map((blog) => ({
      ...blog,
      status: blog.status.toLowerCase(),
      format: blog.format.toLowerCase(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    }));

    return NextResponse.json({ blogs: transformedBlogs, total, page, limit });
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

    const travelTypeValue = normalizeStringArray(travelType);
    const excuseKeyValue = normalizeStringArray(excuseKey);

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
