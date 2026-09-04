import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com";

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

function buildAlternates(path: string): {
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  const pathSegment = path ? `/${path}` : "";
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    languages[locale] = `${BASE_URL}/${locale}${pathSegment}`;
  }
  return { languages };
}

function toSitemapEntry(
  path: string,
  config: PathConfig,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  const pathSegment = path ? `/${path}` : "";
  const url = `${BASE_URL}/${DEFAULT_LOCALE}${pathSegment}`;
  return {
    alternates: buildAlternates(path),
    changeFrequency: config.changeFrequency,
    lastModified: lastModified ?? new Date(),
    priority: config.priority,
    url,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages
  for (const config of STATIC_PATHS) {
    entries.push(toSitemapEntry(config.path, config));
  }

  // Experiences by traveler type: /experiences/by-type/[type]
  for (const slug of TRAVELER_TYPE_SLUGS) {
    entries.push(
      toSitemapEntry(`experiences/by-type/${slug}`, {
        changeFrequency: "monthly",
        priority: 0.9,
      }),
    );
  }

  // Dynamic: published blog posts
  const [blogPosts, trippers, tripperTimestamps, xsedDrops] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isActive: true, isReviewCopy: false, status: "PUBLISHED" },
      select: { slug: true, id: true, updatedAt: true },
    }),
    getAllTrippers(),
    prisma.user.findMany({
      where: { roles: { has: "TRIPPER" }, tripperSlug: { not: null }, isActive: true },
      select: { tripperSlug: true, updatedAt: true },
    }),
    prisma.experience.findMany({
      where: { type: { has: "XSED" }, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const tripperUpdatedAt = new Map(
    tripperTimestamps
      .filter((t): t is typeof t & { tripperSlug: string } => t.tripperSlug !== null)
      .map((t) => [t.tripperSlug, t.updatedAt]),
  );

  for (const post of blogPosts) {
    const slug = post.slug ?? post.id;
    entries.push(
      toSitemapEntry(
        `blog/${slug}`,
        { changeFrequency: "monthly", priority: 0.7 },
        post.updatedAt,
      ),
    );
  }

  // Dynamic: active tripper profiles + their experience pages
  for (const tripper of trippers) {
    const slug = tripper.tripperSlug;
    const lastModified = tripperUpdatedAt.get(slug);
    entries.push(
      toSitemapEntry(
        `trippers/${slug}`,
        { changeFrequency: "weekly", priority: 0.8 },
        lastModified,
      ),
      toSitemapEntry(
        `experiences/by-tripper/${slug}`,
        { changeFrequency: "weekly", priority: 0.7 },
        lastModified,
      ),
    );
  }

  // Dynamic: public xsed drops
  for (const drop of xsedDrops) {
    if (!drop.slug) continue;
    entries.push(
      toSitemapEntry(
        `xsed/drops/${drop.slug}`,
        { changeFrequency: "weekly", priority: 0.8 },
        drop.updatedAt,
      ),
    );
  }

  return entries;
}
