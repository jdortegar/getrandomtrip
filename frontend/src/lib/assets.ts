// src/lib/assets.ts
export function unsplashQueryUrl(query: string, width = 1920, height = 1080) {
  // Imagen aleatoria por consulta (sin API). Ideal para fallback rápido.
  const q = encodeURIComponent(query);
  return `https://source.unsplash.com/${width}x${height}/?${q}`;
}

// Dado el nombre del país, genera consultas algo más ricas:
export function countryQuery(countryName: string) {
  // Ajusta términos por destino si quieres (montaña, costa, cityscape, etc.)
  return `${countryName}, landscape`;
}

export function getFallbackHeroImage(countryName: string) {
  return unsplashQueryUrl(countryQuery(countryName));
}

// Si en el futuro quieres videos automáticos, aquí podrías:
export function getFallbackHeroVideo(_countryName: string): string | null {
  // Por ahora devolvemos null para evitar dependencias frágiles de CDNs de video.
  // Más adelante podemos integrar Coverr/Pexels API y devolver un MP4 real.
  return null;
}