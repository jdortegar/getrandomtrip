import { NextResponse } from "next/server";
import { createGeoCache } from "@/lib/geo/cache";
import { normalizeCityFeature } from "@/lib/geo/normalizers";
import type { CityResult } from "@/lib/geo/types";

// Module-scope singleton cache — lives for the lifetime of the server process
const cache = createGeoCache<CityResult>();

export async function GET(request: Request): Promise<NextResponse> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.error("[geo/cities] MAPBOX_ACCESS_TOKEN is not set");
    return NextResponse.json(
      { error: "Geo search is not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const countryCode = (searchParams.get("countryCode") ?? "").trim();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  if (!countryCode) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `${lang}:${countryCode.toUpperCase()}:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  try {
    const iso2 = countryCode.toLowerCase();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&language=${lang}&types=place&country=${iso2}&autocomplete=true&limit=10`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error("[geo/cities] Mapbox error:", res.status, res.statusText);
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as {
      features: {
        text: string;
        place_name: string;
        context?: Array<{ id: string; short_code?: string }>;
      }[];
    };
    const results: CityResult[] = (data.features ?? []).map((f) =>
      normalizeCityFeature(f, countryCode),
    );

    cache.set(cacheKey, results);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[geo/cities] Fetch error:", err);
    return NextResponse.json({ results: [] });
  }
}
