import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com';
  return [
    { url: `${base}/`, priority: 1, changeFrequency: 'weekly' },
    { url: `${base}/packages/by-type/paws`, priority: 0.9, changeFrequency: 'monthly' },
  ];
}