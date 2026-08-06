import { NextResponse } from "next/server";

const REVALIDATE_SECONDS = 60 * 60 * 24;
const GENERIC_FALLBACK_QUERY = "sky clouds minimal";

interface UnsplashPhoto {
  urls: { regular: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

async function searchUnsplash(
  accessKey: string,
  query: string,
): Promise<string | null> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");

  // Cached via Next's Data Cache, keyed by this URL — repeat lookups for the
  // same city/country (or the generic fallback query) skip Unsplash entirely
  // until the 24h window elapses, and the cache persists across invocations.
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    console.warn("[city-image] Unsplash API error:", res.status);
    return null;
  }

  const data: UnsplashSearchResponse = await res.json();
  return data.results?.[0]?.urls.regular ?? null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") ?? "").trim();
  const country = (searchParams.get("country") ?? "").trim();

  if (!city || !country) {
    return NextResponse.json(
      { error: "city and country are required" },
      { status: 400 },
    );
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("[city-image] UNSPLASH_ACCESS_KEY is not set, using fallback");
    return NextResponse.json({ image: null });
  }

  try {
    // A neutral, city-agnostic photo (sky/clouds) for cities with no
    // Unsplash coverage — never a wrong real place, and itself cached above
    // so it's fetched from Unsplash at most once per revalidate window.
    const image =
      (await searchUnsplash(accessKey, `${city}, ${country}`)) ??
      (await searchUnsplash(accessKey, GENERIC_FALLBACK_QUERY));

    return NextResponse.json({ image });
  } catch (error) {
    console.warn("[city-image] Fetch error:", error);
    return NextResponse.json({ image: null });
  }
}
