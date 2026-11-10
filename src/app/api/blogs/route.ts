// ============================================================================
// GET /api/blogs - Get all published blog posts (public, with pagination)
// ============================================================================

import { listBlogIndexPage } from "@/lib/blog/listBlogIndexPage";
import { NextRequest, NextResponse } from "next/server";
import { isValidExperienceLevel } from "@/lib/constants/packages";
import type { PublicBlogListFilters } from "@/types/blog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") === "en" ? "en" : "es";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const tripperId = searchParams.get("tripperId");
    const tripperIds = searchParams.get("tripperIds"); // comma-separated
    const level = searchParams.get("level");
    const travelType = searchParams.get("travelType");
    const excuseKey = searchParams.get("excuseKey");

    // Visibility (PUBLISHED, active, not a review copy) and the locale's
    // complete-translation gate are enforced by the repository.
    const filters: PublicBlogListFilters = {};
    if (tripperId) {
      filters.authorId = tripperId;
    } else if (tripperIds?.trim()) {
      const ids = tripperIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        filters.authorId = ids;
      }
    }

    // "level" is backed by BlogPost.level — independent of travelType (both
    // filters can be applied together; see TitleImageStep).
    if (level?.trim() && isValidExperienceLevel(level.trim())) {
      filters.level = level.trim();
    }
    if (travelType?.trim()) {
      filters.travelType = travelType.trim();
    }

    if (excuseKey?.trim()) {
      filters.excuseKey = excuseKey.trim();
    }

    return NextResponse.json(
      await listBlogIndexPage(locale, filters, page, limit),
    );
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
