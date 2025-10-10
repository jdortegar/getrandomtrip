// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  alt_description?: string;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

// Cache for images to avoid repeated API calls
const imageCache: Record<string, string> = {};

// Fallback images by country (using Pexels free images)
const FALLBACK_IMAGES: Record<string, string> = {
  US: 'https://images.pexels.com/photos/64271/queen-of-liberty-statue-of-liberty-new-york-liberty-statue-64271.jpeg?auto=compress&cs=tinysrgb&w=800',
  CA: 'https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=800',
  MX: 'https://images.pexels.com/photos/2412609/pexels-photo-2412609.jpeg?auto=compress&cs=tinysrgb&w=800',
  BR: 'https://images.pexels.com/photos/351283/pexels-photo-351283.jpeg?auto=compress&cs=tinysrgb&w=800',
  AR: 'https://images.pexels.com/photos/4388164/pexels-photo-4388164.jpeg?auto=compress&cs=tinysrgb&w=800',
  PE: 'https://images.pexels.com/photos/2356059/pexels-photo-2356059.jpeg?auto=compress&cs=tinysrgb&w=800',
  CL: 'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=800',
  CO: 'https://images.pexels.com/photos/3299905/pexels-photo-3299905.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Add more countries as needed
  GT: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  BZ: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  SV: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  HN: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  NI: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  CR: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  PA: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  CU: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  JM: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  HT: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  DO: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  TT: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  BB: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  LC: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  VC: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  GD: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  AG: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  KN: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  DM: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  BS: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  VE: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  GY: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  SR: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  GF: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  EC: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  BO: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  UY: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
  PY: 'https://images.pexels.com/photos/2232/landscape-nature-man-person.jpg?auto=compress&cs=tinysrgb&w=800',
};

/**
 * Search for city images using Unsplash API
 */
async function searchCityImage(
  cityName: string,
  countryCode: string,
): Promise<string> {
  const cacheKey = `${cityName}-${countryCode}`;

  console.log(`🔍 Searching image for: ${cityName}, ${countryCode}`);

  // Return cached image if available
  if (imageCache[cacheKey]) {
    console.log(`📦 Using cached image for: ${cityName}`);
    return imageCache[cacheKey];
  }

  // Check if API key is available
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn(
      `⚠️ No Unsplash API key found for ${cityName}, using fallback`,
    );
    const fallback = FALLBACK_IMAGES[countryCode] || FALLBACK_IMAGES['US'];
    imageCache[cacheKey] = fallback;
    return fallback;
  }

  try {
    const query = `${cityName} ${countryCode} landmark`;
    console.log(`🌐 Unsplash API query: "${query}"`);

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '1');
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    console.log(`📡 Unsplash API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data: UnsplashSearchResponse = await response.json();
    console.log(
      `📊 Unsplash API results: ${data.results?.length || 0} images found`,
    );

    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      console.log(`✅ Found Unsplash image for ${cityName}: ${imageUrl}`);
      imageCache[cacheKey] = imageUrl;
      return imageUrl;
    }
  } catch (error) {
    console.warn(`❌ Failed to fetch image for ${cityName}:`, error);
  }

  // Fallback to country image
  const fallback = FALLBACK_IMAGES[countryCode] || FALLBACK_IMAGES['US'];
  console.log(`🔄 Using fallback image for ${cityName}: ${fallback}`);
  imageCache[cacheKey] = fallback;
  return fallback;
}

/**
 * Get image for a city (async)
 */
export async function getCityImage(
  cityName: string,
  countryCode: string,
): Promise<string> {
  return await searchCityImage(cityName, countryCode);
}

/**
 * Get landmark image for a country (fallback/sync)
 */
export function getLandmarkImageForCountry(countryCode: string): string {
  return FALLBACK_IMAGES[countryCode] || FALLBACK_IMAGES['US'];
}
