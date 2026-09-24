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
import { getAppRoles, hasRoleAccess } from "@/lib/auth/roleAccess";
import { getRandomtripUserId } from "@/lib/randomtrip-user";
import { isValidExperienceLevel } from "@/lib/constants/packages";

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
    const levelParam = searchParams.get("level");
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
    // "level" is backed by BlogPost.level — independent of travelType (both
    // filters can be applied together; see TitleImageStep).
    if (levelParam && isValidExperienceLevel(levelParam)) {
      where.level = levelParam;
    }
    if (travelTypeParam) {
      where.travelType = { has: travelTypeParam };
    }
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
          level: true,
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
      level,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const levelValue: string | null = level && level !== "" ? level : null;
    if (levelValue !== null && !isValidExperienceLevel(levelValue)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
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

    // source is server-derived from the caller's role only — never trusted
    // from the request body — mirrors /api/tripper/experiences.
    const isAdmin = getAppRoles(user).includes("admin");

    // XSED is fulfilled centrally by the admin team — only admins may tag a
    // post with it (mirrors the client-side gate in TitleImageStep).
    if (levelValue === "xsed" && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can set the XSED level" },
        { status: 403 },
      );
    }

    // RANDOMTRIP posts are owned by the Randomtrip pseudo-user, not whichever
    // admin clicked create — createdById keeps the real creator for audit.
    const authorId = isAdmin ? await getRandomtripUserId() : user.id;

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
        authorId,
        createdById: user.id,
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
        level: levelValue,
        format: prismaFormat,
        coverUrl: coverUrl || null,
        seo: seo || null,
        source: isAdmin ? "RANDOMTRIP" : "TRIPPER",
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
        level: true,
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
