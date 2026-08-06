const REVALIDATE_SECONDS = 60 * 60 * 24;
export const GENERIC_FALLBACK_QUERY = "sky clouds minimal";

interface UnsplashPhoto {
  urls: { regular: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

/**
 * Server-only Unsplash photo search, shared by every /api/*-image route.
 * Cached via Next's Data Cache, keyed by the request URL (i.e. by query) —
 * repeat lookups for the same term skip Unsplash entirely until the 24h
 * window elapses, and the cache persists across invocations.
 */
export async function searchUnsplashPhoto(
  accessKey: string,
  query: string,
): Promise<string | null> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    console.warn("[unsplash] Unsplash API error:", res.status);
    return null;
  }

  const data: UnsplashSearchResponse = await res.json();
  return data.results?.[0]?.urls.regular ?? null;
}
