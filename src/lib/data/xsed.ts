import type { PackageStatus, Prisma, TripRequestStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type { DropEntry } from '@/types/core';

export const PUBLIC_XSED_GRID_STATUSES: PackageStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
];

const SOLD_TRIP_REQUEST_STATUSES: TripRequestStatus[] = [
  'CONFIRMED',
  'REVEALED',
  'COMPLETED',
];

const xsedListSelect = {
  heroImage: true,
  id: true,
  maxSpots: true,
  revealAt: true,
  slug: true,
  status: true,
  titleInternal: true,
  titlePublicTeaser: true,
  tripDate: true,
  _count: {
    select: {
      tripRequests: {
        where: { status: { in: SOLD_TRIP_REQUEST_STATUSES } },
      },
    },
  },
} as const;

export type XsedListRow = Prisma.XsedExperienceGetPayload<{
  select: typeof xsedListSelect;
}>;

const xsedDetailInclude = {
  benefits: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      photos: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
} satisfies Prisma.XsedExperienceInclude;

export type XsedExperienceDetail = Prisma.XsedExperienceGetPayload<{
  include: typeof xsedDetailInclude;
}>;

export async function findUpcomingActiveXsedExperiences(
  now: Date = new Date(),
): Promise<XsedListRow[]> {
  return prisma.xsedExperience.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ tripDate: { gte: now } }, { tripDate: null }],
    },
    orderBy: [{ tripDate: 'asc' }, { createdAt: 'desc' }],
    select: xsedListSelect,
  });
}

export async function findLatestActiveXsedExperience(): Promise<XsedListRow | null> {
  return prisma.xsedExperience.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: [{ tripDate: 'desc' }, { createdAt: 'desc' }],
    select: xsedListSelect,
  });
}

export async function findPublicXsedExperiences(): Promise<XsedListRow[]> {
  return prisma.xsedExperience.findMany({
    where: { status: { in: PUBLIC_XSED_GRID_STATUSES } },
    orderBy: [{ tripDate: 'desc' }, { createdAt: 'desc' }],
    select: xsedListSelect,
  });
}

export async function findActiveXsedExperienceBySlug(
  slug: string,
): Promise<XsedExperienceDetail | null> {
  return prisma.xsedExperience.findUnique({
    where: { slug },
    include: xsedDetailInclude,
  });
}

export async function findCompletedXsedTripRequestsForTestimonials(
  xsedExperienceId: string,
) {
  return prisma.tripRequest.findMany({
    where: {
      xsedExperienceId,
      status: 'COMPLETED',
      customerFeedback: { not: null },
    },
    orderBy: { completedAt: 'desc' },
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
  if (!date) return '';
  const tag = locale === 'en' ? 'en-US' : 'es-AR';
  return date
    .toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
}

function getPassDate(
  drop: Pick<XsedListRow, 'revealAt' | 'tripDate'>,
): Date | null {
  return drop.revealAt ?? drop.tripDate;
}

function hasDropPassed(
  drop: Pick<XsedListRow, 'revealAt' | 'tripDate'>,
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
  const isStatusSoldOut = drop.status === 'INACTIVE' || drop.status === 'ARCHIVED';

  return {
    date: formatDropGridDate(drop.tripDate, locale),
    image: drop.heroImage ?? '/images/drops/drops-mendoza.jpg',
    number: parseDropNumber(drop.slug),
    slug: drop.slug ?? '',
    soldOut: isCapacitySoldOut || isStatusSoldOut,
    title: drop.titlePublicTeaser ?? drop.titleInternal,
  };
}

export interface CurrentXsedDrop {
  id: string;
  number: number;
  soldCount: number;
  targetDate: string;
  totalSlots: number;
}

export async function getCurrentXsedDrop(): Promise<CurrentXsedDrop | null> {
  const upcoming = await findUpcomingActiveXsedExperiences();
  const current = upcoming[0] ?? (await findLatestActiveXsedExperience());

  if (!current) return null;

  const countdownDate = current.revealAt ?? current.tripDate;
  if (!countdownDate) return null;

  return {
    id: current.id,
    number: parseDropNumber(current.slug),
    soldCount: current._count.tripRequests,
    targetDate: countdownDate.toISOString(),
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
  const drops = filtered.slice(offset, offset + limit).map((drop) => toDropEntry(drop, locale));
  return { drops, hasMore: offset + limit < filtered.length };
}
