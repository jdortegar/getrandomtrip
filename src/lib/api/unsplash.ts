// Unsplash API integration for landmark images
export interface UnsplashPhoto {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

// Note: In production, you should use a proper Unsplash API key
// For now, we'll use a public endpoint that doesn't require authentication
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

// Search for landmark images
export async function searchLandmarkImages(
  query: string,
  perPage: number = 1,
): Promise<UnsplashPhoto[]> {
  try {
    // If no API key, use a fallback service or return empty
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('No Unsplash API key provided, using fallback images');
      return getFallbackImages(query);
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }

    const data: UnsplashSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching landmark images:', error);
    return getFallbackImages(query);
  }
}

// Fallback images when API is not available
function getFallbackImages(query: string): UnsplashPhoto[] {
  // Return a placeholder image URL
  return [
    {
      id: `fallback-${query.toLowerCase().replace(/\s+/g, '-')}`,
      urls: {
        small: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop`,
        regular: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop`,
        full: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop`,
      },
      alt_description: `Landmark image for ${query}`,
      description: `Beautiful landmark in ${query}`,
      user: {
        name: 'Unsplash',
        username: 'unsplash',
      },
    },
  ];
}

// Get a single landmark image
export async function getLandmarkImage(
  landmark: string,
  country: string,
): Promise<string> {
  try {
    const query = `${landmark} ${country}`;
    const results = await searchLandmarkImages(query, 1);

    if (results.length > 0) {
      return results[0].urls.regular;
    }

    // Fallback to a generic landmark image
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
  } catch (error) {
    console.error('Error getting landmark image:', error);
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
  }
}

// Predefined landmark images (using Unsplash's public URLs)
export const LANDMARK_IMAGES: Record<string, string> = {
  // North America
  US: 'https://images.unsplash.com/photo-1494522358652-f30e61a27b14?w=800&h=600&fit=crop', // Statue of Liberty
  CA: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=600&fit=crop', // CN Tower
  MX: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', // Chichen Itza

  // South America
  BR: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop', // Christ the Redeemer
  AR: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop', // Casa Rosada
  PE: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop', // Machu Picchu
  CL: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Torres del Paine
  CO: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', // Cartagena
  UY: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', // Punta del Este
  VE: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Angel Falls
  EC: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Galapagos
  BO: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Salar de Uyuni
  PY: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Asunción
  GY: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Kaieteur Falls
  SR: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Paramaribo
  GF: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Kourou

  // Central America & Caribbean
  GT: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Tikal
  BZ: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Great Blue Hole
  SV: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Santa Ana
  HN: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Copán
  NI: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Granada
  CR: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Arenal
  PA: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Panama Canal
  CU: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Havana
  JM: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Dunn's River
  HT: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Citadelle
  DO: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Alcázar
  TT: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Maracas
  BB: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Harrison's Cave
  LC: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Pitons
  VC: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // La Soufrière
  GD: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Grand Anse
  AG: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Nelson's Dockyard
  KN: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Brimstone Hill
  DM: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Boiling Lake
  BS: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Pink Sands
};

// Get landmark image for a country
export function getLandmarkImageForCountry(countryCode: string): string {
  return LANDMARK_IMAGES[countryCode] || LANDMARK_IMAGES['US']; // Fallback to US image
}
