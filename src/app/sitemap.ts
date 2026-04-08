import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com';

/** Canonical slugs for experiences/by-type routes (one sitemap entry per type). */
const TRAVELER_TYPE_SLUGS: TravelerTypeSlug[] = [
  'couple',
  'solo',
  'family',
  'group',
  'honeymoon',
  'paws',
];

type PathConfig = {
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

/** Public routes to include in the sitemap (no auth-only or dynamic IDs). */
const STATIC_PATHS: (PathConfig & { path: string })[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: 'about-us', changeFrequency: 'monthly', priority: 0.8 },
  { path: 'add-ons', changeFrequency: 'monthly', priority: 0.7 },
  { path: 'blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: 'experiences', changeFrequency: 'weekly', priority: 0.9 },
  { path: 'filters-premium', changeFrequency: 'monthly', priority: 0.6 },
  { path: 'journey', changeFrequency: 'weekly', priority: 0.9 },
  { path: 'trippers', changeFrequency: 'weekly', priority: 0.7 },
];

function buildAlternates(path: string): {
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  const pathSegment = path ? `/${path}` : '';
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    languages[locale] = `${BASE_URL}/${locale}${pathSegment}`;
  }
  return { languages };
}

function toSitemapEntry(
  path: string,
  config: PathConfig
): MetadataRoute.Sitemap[number] {
  const pathSegment = path ? `/${path}` : '';
  const url = `${BASE_URL}/${DEFAULT_LOCALE}${pathSegment}`;
  return {
    alternates: buildAlternates(path),
    changeFrequency: config.changeFrequency,
    lastModified: new Date(),
    priority: config.priority,
    url,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages (one entry per page with locale alternates)
  for (const config of STATIC_PATHS) {
    entries.push(toSitemapEntry(config.path, config));
  }

  // Experiences by traveler type: /experiences/by-type/[type]
  for (const slug of TRAVELER_TYPE_SLUGS) {
    entries.push(
      toSitemapEntry(`experiences/by-type/${slug}`, {
        changeFrequency: 'monthly',
        priority: 0.9,
      })
    );
  }

  return entries;
}
