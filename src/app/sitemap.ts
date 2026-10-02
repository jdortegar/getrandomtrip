import { travelerStorySlugs } from "@/lib/blog/travelerStories";
import { availableBlogLocales } from "@/lib/seo/blogLocales";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

import { buildAlternates, canonicalUrl } from "@/lib/seo/urls";
import { isGateEnabled } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

const TRAVELER_TYPE_SLUGS: TravelerTypeSlug[] = [
  "couple",
  "solo",
  "family",
  "group",
  "honeymoon",
  "paws",
];

type PathConfig = {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_PATHS: (PathConfig & { path: string })[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "about-us", changeFrequency: "monthly", priority: 0.8 },
  { path: "blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "experiences", changeFrequency: "weekly", priority: 0.9 },
  { path: "faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "refund", changeFrequency: "yearly", priority: 0.3 },
  { path: "terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "trippers", changeFrequency: "weekly", priority: 0.7 },
  { path: "xsed", changeFrequency: "weekly", priority: 0.8 },
  { path: "xsed/drops", changeFrequency: "weekly", priority: 0.7 },
];

function toSitemapEntries(
  path: string,
  config: PathConfig,
  lastModified?: Date,
  available: readonly Locale[] = LOCALES,
): MetadataRoute.Sitemap {
  return available.map((locale) => ({
    alternates: {
      languages: buildAlternates(locale, path, available).languages,
    },
    changeFrequency: config.changeFrequency,
    ...(lastModified ? { lastModified } : {}),
    priority: config.priority,
    url: canonicalUrl(locale, path),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (await isGateEnabled()) return [];
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages
  for (const config of STATIC_PATHS) {
    entries.push(...toSitemapEntries(config.path, config));
  }

  // Experiences by traveler type: /experiences/by-type/[type]
  for (const slug of TRAVELER_TYPE_SLUGS) {
    entries.push(
      ...toSitemapEntries(`experiences/by-type/${slug}`, {
        changeFrequency: "monthly",
        priority: 0.9,
      }),
    );
  }

  // Dynamic: published blog posts
  const [blogPosts, trippers, tripperTimestamps] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isActive: true, isReviewCopy: false, status: "PUBLISHED" },
      select: { slug: true, id: true, updatedAt: true, translations: true },
    }),
    getAllTrippers(),
    prisma.user.findMany({
      where: {
        roles: { has: "TRIPPER" },
        tripperSlug: { not: null },
        isActive: true,
      },
      select: { tripperSlug: true, updatedAt: true },
    }),
  ]);

  const tripperUpdatedAt = new Map(
    tripperTimestamps
      .filter(
        (t): t is typeof t & { tripperSlug: string } => t.tripperSlug !== null,
      )
      .map((t) => [t.tripperSlug, t.updatedAt]),
  );

  for (const slug of travelerStorySlugs()) {
    entries.push(
      ...toSitemapEntries(`blog/${slug}`, {
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    );
  }

  for (const post of blogPosts) {
    const slug = post.slug ?? post.id;
    const available = availableBlogLocales(post);
    const localizedEntries = toSitemapEntries(
      `blog/${slug}`,
      { changeFrequency: "monthly", priority: 0.7 },
      post.updatedAt,
      available,
    );
    entries.push(...localizedEntries);
  }

  // Dynamic: active tripper profiles + their experience pages
  for (const tripper of trippers) {
    const slug = tripper.tripperSlug;
    const lastModified = tripperUpdatedAt.get(slug);
    entries.push(
      ...toSitemapEntries(
        `trippers/${slug}`,
        { changeFrequency: "weekly", priority: 0.8 },
        lastModified,
      ),
      ...toSitemapEntries(
        `experiences/by-tripper/${slug}`,
        { changeFrequency: "weekly", priority: 0.7 },
        lastModified,
      ),
    );
  }

  return entries;
}
