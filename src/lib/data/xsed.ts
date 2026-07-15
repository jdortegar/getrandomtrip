import type {
  ExperienceStatus,
  Prisma,
  TripRequestStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { DropEntry } from "@/types/core";

export const PUBLIC_XSED_GRID_STATUSES: ExperienceStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

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
  status: true,
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

const xsedDetailSelect = {
  id: true,
  slug: true,
  status: true,
  titleInternal: true,
  teaser: true,
  heroImage: true,
  destinationCity: true,
  destinationCountry: true,
  tripDate: true,
  revealAt: true,
  basePrice: true,
  currency: true,
  maxSpots: true,
  minSpots: true,
  inclusions: true,
  exclusions: true,
  cancellationPolicy: true,
  weatherPolicy: true,
  accessibilityNotes: true,
  safetyNotes: true,
  packingHints: true,
  sections: true,
  gallery: true,
} as const;

export type XsedExperienceDetail = Prisma.ExperienceGetPayload<{
  select: typeof xsedDetailSelect;
}>;

export interface XsedDropSectionPhoto {
  url: string;
  credit: string;
}

export interface XsedDropSection {
  title: string;
  body: string;
  photos: XsedDropSectionPhoto[];
}

/**
 * Parses the `sections` Json column into the public-page narrative body
 * structure. Replaces the old `parseDropBenefits(hotels, activities)`
 * derivation — the admin XSED authoring form no longer feeds hotels/
 * activities into the public body, it authors `sections` directly.
 */
export function parseDropSections(sections: Prisma.JsonValue | null): XsedDropSection[] {
  return Array.isArray(sections) ? (sections as unknown as XsedDropSection[]) : [];
}

export async function findUpcomingActiveXsedExperiences(
  now: Date = new Date(),
): Promise<XsedListRow[]> {
  return prisma.experience.findMany({
    where: {
      type: { has: "XSED" },
      status: "ACTIVE",
      OR: [{ tripDate: { gte: now } }, { tripDate: null }],
    },
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

export async function findLatestActiveXsedExperience(): Promise<XsedListRow | null> {
  return prisma.experience.findFirst({
    where: { type: { has: "XSED" }, status: "ACTIVE" },
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

export async function findPublicXsedExperiences(): Promise<XsedListRow[]> {
  return prisma.experience.findMany({
    where: { type: { has: "XSED" }, status: { in: PUBLIC_XSED_GRID_STATUSES } },
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
    select: xsedListSelect,
  });
}

export async function findActiveXsedExperienceBySlug(
  slug: string,
): Promise<XsedExperienceDetail | null> {
  return prisma.experience.findUnique({
    where: { slug },
    select: xsedDetailSelect,
  });
}

export async function findCompletedXsedTripRequestsForTestimonials(
  experienceId: string,
) {
  return prisma.tripRequest.findMany({
    where: {
      experienceId,
      status: "COMPLETED",
      customerFeedback: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: 24,
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
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
  const isStatusSoldOut =
    drop.status === "INACTIVE" || drop.status === "ARCHIVED";

  return {
    date: formatDropGridDate(drop.tripDate, locale),
    image: drop.heroImage ?? "/images/drops/drops-mendoza.jpg",
    number: parseDropNumber(drop.slug),
    slug: drop.slug ?? "",
    soldOut: isCapacitySoldOut || isStatusSoldOut,
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
