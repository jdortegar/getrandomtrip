// Cache for images to avoid repeated calls to our own /api/city-image route.
const imageCache: Record<string, string | null> = {};

/**
 * Get an image for a city, or null when no confidently-relevant photo was
 * found (callers should render a neutral placeholder in that case, never a
 * specific real place that isn't actually the requested city). Proxies
 * through /api/city-image so the Unsplash access key stays server-side —
 * never call the Unsplash API directly from the client.
 */
export async function getCityImage(
  cityName: string,
  countryName: string,
): Promise<string | null> {
  const cacheKey = `${cityName}-${countryName}`;
  if (cacheKey in imageCache) return imageCache[cacheKey];

  try {
    const url = `/api/city-image?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryName)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`city-image request failed: ${res.status}`);
    }

    const data: { image: string | null } = await res.json();
    imageCache[cacheKey] = data.image;
    return data.image;
  } catch (error) {
    console.warn(`Failed to fetch image for ${cityName}:`, error);
    imageCache[cacheKey] = null;
    return null;
  }
}
