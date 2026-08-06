import { NextResponse } from "next/server";
import {
  GENERIC_FALLBACK_QUERY,
  searchUnsplashPhoto,
} from "@/lib/server/unsplash";

/**
 * Generic free-text Unsplash lookup — used as a live fallback when a
 * hardcoded photo URL (e.g. in excuses.ts) 404s, searching by the card's own
 * title instead of showing the static placeholder immediately.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("[topic-image] UNSPLASH_ACCESS_KEY is not set, using fallback");
    return NextResponse.json({ image: null });
  }

  try {
    const image =
      (await searchUnsplashPhoto(accessKey, q)) ??
      (await searchUnsplashPhoto(accessKey, GENERIC_FALLBACK_QUERY));

    return NextResponse.json({ image });
  } catch (error) {
    console.warn("[topic-image] Fetch error:", error);
    return NextResponse.json({ image: null });
  }
}
