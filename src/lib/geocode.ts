// /lib/geocode.ts
export async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
  lang = 'es'
): Promise<{ label: string | null; country: 'MX' | 'AR' | 'US' | null }> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return { label: null, country: null };
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${lang}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return { label: null, country: null } as any;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return { label: null, country: null } as any;
    const label = first.formatted_address as string;
    const comp = (first.address_components || []) as Array<{ short_name: string; types: string[] }>;
    const cc = comp.find((c) => c.types.includes('country'))?.short_name as 'MX' | 'AR' | 'US' | undefined;
    return { label, country: (cc || null) as any };
  } catch {
    return { label: null, country: null } as any;
  }
}