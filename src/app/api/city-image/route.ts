import { NextResponse } from "next/server";
import {
  GENERIC_FALLBACK_QUERY,
  searchUnsplashPhoto,
} from "@/lib/server/unsplash";

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
      (await searchUnsplashPhoto(accessKey, `${city}, ${country}`)) ??
      (await searchUnsplashPhoto(accessKey, GENERIC_FALLBACK_QUERY));

    return NextResponse.json({ image });
  } catch (error) {
    console.warn("[city-image] Fetch error:", error);
    return NextResponse.json({ image: null });
  }
}
