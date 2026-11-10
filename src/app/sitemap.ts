import { travelerStorySlugs } from "@/lib/blog/travelerStories";
import { availableBlogLocales, blogLocalePaths } from "@/lib/seo/blogLocales";
import {
  findPublishedBySlug,
  listPublishedLocaleSlugs,
} from "@/lib/blog/blogRepository";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import { getPublicTravelerTypeSlugs } from "@/lib/data/traveler-types";

import { buildAlternates } from "@/lib/seo/urls";
import { isGateEnabled } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

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

/** `path` may differ per locale (blog translations own their slugs). */
function toSitemapEntries(
  path: string | Partial<Record<Locale, string>>,
  config: PathConfig,
  lastModified?: Date,
  available: readonly Locale[] = LOCALES,
): MetadataRoute.Sitemap {
  return available.map((locale) => {
    const alternates = buildAlternates(locale, path, available);
    return {
      alternates: { languages: alternates.languages },
      changeFrequency: config.changeFrequency,
      ...(lastModified ? { lastModified } : {}),
      priority: config.priority,
      url: alternates.canonical,
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (await isGateEnabled()) return [];
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages
  for (const config of STATIC_PATHS) {
    entries.push(...toSitemapEntries(config.path, config));
  }

  // Experiences by traveler type: /experiences/by-type/[type]
  for (const slug of getPublicTravelerTypeSlugs()) {
    entries.push(
      ...toSitemapEntries(`experiences/by-type/${slug}`, {
        changeFrequency: "monthly",
        priority: 0.9,
      }),
    );
  }

  // Dynamic: published blog posts
  const [blogPosts, trippers, tripperTimestamps] = await Promise.all([
    listPublishedLocaleSlugs(),
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

  // Stories only render where no published post claims the slug; claimed
  // slugs redirect, and the post is listed below at its own slug.
  const storyLocales = await Promise.all(
    travelerStorySlugs().map(async (slug) => ({
      slug,
      locales: (
        await Promise.all(
          LOCALES.map(async (locale) =>
            (await findPublishedBySlug(locale, slug)).kind === "not_found"
              ? [locale]
              : [],
          ),
        )
      ).flat(),
    })),
  );
  for (const { slug, locales } of storyLocales) {
    if (!locales.length) continue;
    entries.push(
      ...toSitemapEntries(
        `blog/${slug}`,
        { changeFrequency: "monthly", priority: 0.6 },
        undefined,
        locales,
      ),
    );
  }

  // One entry per complete translation, each at its own locale slug.
  for (const post of blogPosts) {
    entries.push(
      ...toSitemapEntries(
        blogLocalePaths(post.localeSlugs),
        { changeFrequency: "monthly", priority: 0.7 },
        post.updatedAt,
        availableBlogLocales(post.localeSlugs),
      ),
    );
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
