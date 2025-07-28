export async function fetchPexelsImages(query: string, perPage = 6) {
  const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=${perPage}`, {
      headers: {
        Authorization: apiKey || ''
      }
    });

    if (!res.ok) {
      throw new Error(`Pexels fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos.map((photo: any) => ({
        src: photo.src.large,
        alt: photo.alt || query
      }));
    } else {
      return [{ src: '/images/fallback.jpg', alt: 'Fallback' }];
    }
  } catch (err) {
    console.error('Pexels error:', err);
    return [{ src: '/images/fallback.jpg', alt: 'Fallback' }];
  }
}
