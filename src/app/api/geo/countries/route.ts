import { NextResponse } from "next/server";
import { createGeoCache } from "@/lib/geo/cache";
import { normalizeCountryFeature } from "@/lib/geo/normalizers";
import type { CountryResult } from "@/lib/geo/types";

// Module-scope singleton cache — lives for the lifetime of the server process
const cache = createGeoCache<CountryResult>();

export async function GET(request: Request): Promise<NextResponse> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.error("[geo/countries] MAPBOX_ACCESS_TOKEN is not set");
    return NextResponse.json(
      { error: "Geo search is not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `${lang}:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&language=${lang}&types=country&autocomplete=true&limit=10`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(
        "[geo/countries] Mapbox error:",
        res.status,
        res.statusText,
      );
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as {
      features: {
        text: string;
        place_name: string;
        properties: { short_code?: string };
      }[];
    };
    const results: CountryResult[] = (data.features ?? [])
      .map(normalizeCountryFeature)
      .filter((r): r is CountryResult => r !== null);

    cache.set(cacheKey, results);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[geo/countries] Fetch error:", err);
    return NextResponse.json({ results: [] });
  }
}
