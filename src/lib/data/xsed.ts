import type { Prisma, TripRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { DropEntry } from "@/types/core";

const SOLD_TRIP_REQUEST_STATUSES: TripRequestStatus[] = [
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
];

const xsedListSelect = {
  heroImage: true,
  id: true,
  maxSpots: true,
  revealAt: true,
  slug: true,
  titleInternal: true,
  teaser: true,
  tripDate: true,
  _count: {
    select: {
      tripRequests: {
        where: { status: { in: SOLD_TRIP_REQUEST_STATUSES } },
      },
    },
  },
} as const;

export type XsedListRow = Prisma.ExperienceGetPayload<{
  select: typeof xsedListSelect;
}>;

export async function findUpcomingActiveXsedExperiences(
  now: Date = new Date(),
): Promise<XsedListRow[]> {
  return prisma.experience.findMany({
    where: {
      type: { has: "XSED" },
      OR: [{ tripDate: { gte: now } }, { tripDate: null }],
    },
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

export async function findLatestActiveXsedExperience(): Promise<XsedListRow | null> {
  return prisma.experience.findFirst({
    where: { type: { has: "XSED" } },
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

export async function findPublicXsedExperiences(): Promise<XsedListRow[]> {
  return prisma.experience.findMany({
    where: { type: { has: "XSED" } },
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

/**
 * Completed trip requests with feedback across ALL XSED drops (not one
 * specific experience) — used for the general /xsed landing pages.
 */
export async function findAllCompletedXsedTripRequestsForTestimonials() {
  return prisma.tripRequest.findMany({
    where: {
      status: "COMPLETED",
      customerFeedback: { not: null },
      experience: { type: { has: "XSED" } },
    },
    orderBy: { completedAt: "desc" },
    take: 24,
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });
}

function parseDropNumber(slug: string | null): number {
  if (!slug) return 0;
  const parsed = Number.parseInt(slug, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDropGridDate(date: Date | null, locale: string): string {
  if (!date) return "";
  const tag = locale === "en" ? "en-US" : "es-AR";
  return date
    .toLocaleDateString(tag, { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

function getPassDate(
  drop: Pick<XsedListRow, "revealAt" | "tripDate">,
): Date | null {
  return drop.revealAt ?? drop.tripDate;
}

function hasDropPassed(
  drop: Pick<XsedListRow, "revealAt" | "tripDate">,
  now: Date,
): boolean {
  const passDate = getPassDate(drop);
  return passDate != null && passDate.getTime() < now.getTime();
}

function toDropEntry(drop: XsedListRow, locale: string): DropEntry {
  const soldCount = drop._count.tripRequests;
  const maxSpots = drop.maxSpots;
  const isCapacitySoldOut =
    maxSpots != null && maxSpots > 0 && soldCount >= maxSpots;

  return {
    date: formatDropGridDate(drop.tripDate, locale),
    image: drop.heroImage ?? "/images/drops/drops-mendoza.jpg",
    number: parseDropNumber(drop.slug),
    slug: drop.slug ?? "",
    soldOut: isCapacitySoldOut,
    // titleInternal is the primary source going forward — the admin XSED
    // authoring form no longer has a `teaser` field. teaser is kept as a
    // fallback only for drops authored before this migration.
    title: drop.titleInternal || drop.teaser || "",
  };
}

export interface CurrentXsedDrop {
  id: string;
  number: number;
  slug: string;
  soldCount: number;
  totalSlots: number;
}

export async function getCurrentXsedDrop(): Promise<CurrentXsedDrop | null> {
  const upcoming = await findUpcomingActiveXsedExperiences();
  const current = upcoming[0] ?? (await findLatestActiveXsedExperience());

  if (!current) return null;

  return {
    id: current.id,
    number: parseDropNumber(current.slug),
    slug: current.slug ?? "",
    soldCount: current._count.tripRequests,
    totalSlots: current.maxSpots ?? 10,
  };
}

export async function getXsedDropsForGrid(
  currentDropId: string | null,
  locale: string,
): Promise<DropEntry[]> {
  const now = new Date();
  const experiences = await findPublicXsedExperiences();

  const visible = experiences.filter((drop) => {
    if (currentDropId && drop.id === currentDropId) {
      return hasDropPassed(drop, now);
    }
    return true;
  });

  return visible.map((drop) => toDropEntry(drop, locale));
}

export async function getPublicDropEntries(
  locale: string,
  offset: number = 0,
  limit: number = 6,
  excludeId?: string,
): Promise<{ drops: DropEntry[]; hasMore: boolean }> {
  const experiences = await findPublicXsedExperiences();
  const filtered = excludeId
    ? experiences.filter((e) => e.id !== excludeId)
    : experiences;
  const drops = filtered
    .slice(offset, offset + limit)
    .map((drop) => toDropEntry(drop, locale));
  return { drops, hasMore: offset + limit < filtered.length };
}

const xsedBlogPostSelect = {
  id: true,
  slug: true,
  title: true,
  coverUrl: true,
  publishedAt: true,
  createdAt: true,
} as const;

type XsedBlogPostRow = Prisma.BlogPostGetPayload<{ select: typeof xsedBlogPostSelect }>;

/**
 * XSED grid entries sourced from BlogPost (tagged via `travelType: ["XSED"]`,
 * stamped automatically when a level="xsed" experience's "create blog post"
 * checkbox is used). This is a purely editorial/archive listing — no
 * booking flow or live capacity of its own, so soldOut never applies here.
 * `number` is a display-only ordinal (newest = highest), not a stored drop
 * number.
 */
function toXsedBlogDropEntry(
  blog: XsedBlogPostRow,
  position: number,
  total: number,
  locale: string,
): DropEntry {
  return {
    date: formatDropGridDate(blog.publishedAt ?? blog.createdAt, locale),
    image: blog.coverUrl || "/images/drops/drops-mendoza.jpg",
    number: total - position,
    slug: blog.slug ?? blog.id,
    title: blog.title,
  };
}

async function findPublicXsedBlogPosts(): Promise<XsedBlogPostRow[]> {
  return prisma.blogPost.findMany({
    where: {
      travelType: { has: "XSED" },
      status: "PUBLISHED",
      isActive: true,
      isReviewCopy: false,
    },
    orderBy: { createdAt: "desc" },
    select: xsedBlogPostSelect,
  });
}

export async function getXsedBlogDropsForGrid(locale: string): Promise<DropEntry[]> {
  const posts = await findPublicXsedBlogPosts();
  return posts.map((post, i) => toXsedBlogDropEntry(post, i, posts.length, locale));
}

export async function getPublicXsedBlogDropEntries(
  locale: string,
  offset: number = 0,
  limit: number = 6,
): Promise<{ drops: DropEntry[]; hasMore: boolean }> {
  const posts = await findPublicXsedBlogPosts();
  const page = posts.slice(offset, offset + limit);
  const drops = page.map((post, i) =>
    toXsedBlogDropEntry(post, offset + i, posts.length, locale),
  );
  return { drops, hasMore: offset + limit < posts.length };
}
