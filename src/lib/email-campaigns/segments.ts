/**
 * Server-only segments repository (odd/tasks/email-campaign-segments.md,
 * decisions 1–3). Names are unique ignoring case; the two system segments can
 * be renamed but never deleted, and a segment targeted by any campaign cannot
 * be deleted (the foreign key also restricts it).
 */
import type { Segment as SegmentRow } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SYSTEM_SEGMENT_IDS } from "@/lib/email-campaigns/segmentRules";
import type {
  ContactSource,
  Segment,
  SegmentErrorCode,
  SegmentInput,
  SegmentRef,
  SegmentSummary,
  SegmentUpdateInput,
} from "@/types/emailCampaign";

export class SegmentError extends Error {
  constructor(readonly code: SegmentErrorCode) {
    super(code);
    this.name = "SegmentError";
  }
}

/** HTTP status for each repository failure, shared by the admin routes. */
export const SEGMENT_ERROR_STATUS: Record<SegmentErrorCode, number> = {
  not_found: 404,
  duplicate_segment: 409,
  system_segment: 409,
  segment_in_use: 409,
};

/** Prisma select for the `SegmentRef` embedded in contacts and campaigns. */
export const SEGMENT_REF_SELECT = {
  id: true,
  name: true,
  systemKey: true,
} as const;

/** Include for a join relation (`ContactSegment` / `CampaignSegment`) ordered by name. */
export const SEGMENT_REFS_INCLUDE = {
  select: { segment: { select: SEGMENT_REF_SELECT } },
  orderBy: { segment: { name: "asc" } },
} as const;

/** Id of a system segment; the migration seeds them with fixed ids. */
export function systemSegmentId(key: ContactSource): string {
  return SYSTEM_SEGMENT_IDS[key];
}

export function toSegmentRefs(
  links: { segment: SegmentRef }[] | undefined,
): SegmentRef[] {
  return (links ?? []).map(({ segment }) => ({
    id: segment.id,
    name: segment.name,
    systemKey: segment.systemKey,
  }));
}

export function toSegment(row: SegmentRow): Segment {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    systemKey: row.systemKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: unknown }).code === code
  );
}

/** System segments first, then by name ignoring case and accents. */
function compareSegments(a: Segment, b: Segment): number {
  const system = Number(a.systemKey === null) - Number(b.systemKey === null);
  return system || a.name.localeCompare(b.name, "es", { sensitivity: "base" });
}

export async function listSegments(): Promise<SegmentSummary[]> {
  const [rows, subscribed] = await Promise.all([
    prisma.segment.findMany({
      include: { _count: { select: { contacts: true } } },
    }),
    prisma.contactSegment.groupBy({
      by: ["segmentId"],
      where: { contact: { status: "SUBSCRIBED" } },
      _count: { _all: true },
    }),
  ]);
  const subscribedById = new Map(
    subscribed.map((group) => [group.segmentId, group._count._all]),
  );

  return rows
    .map((row) => ({
      ...toSegment(row),
      memberCount: row._count.contacts,
      subscribedCount: subscribedById.get(row.id) ?? 0,
    }))
    .sort(compareSegments);
}

async function assertNameAvailable(name: string, exceptId?: string) {
  const existing = await prisma.segment.findFirst({
    select: { id: true },
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(exceptId && { NOT: { id: exceptId } }),
    },
  });
  if (existing) throw new SegmentError("duplicate_segment");
}

/** Input is already trimmed and length-checked by the API schema. */
export async function createSegment(input: SegmentInput): Promise<Segment> {
  await assertNameAvailable(input.name);
  try {
    const row = await prisma.segment.create({
      data: { name: input.name, description: input.description },
    });
    return toSegment(row);
  } catch (error) {
    if (hasErrorCode(error, "P2002")) throw new SegmentError("duplicate_segment");
    throw error;
  }
}

/** Rename and / or describe a segment; system segments may be renamed too. */
export async function updateSegment(
  id: string,
  input: SegmentUpdateInput,
): Promise<Segment> {
  const existing = await prisma.segment.findUnique({ where: { id } });
  if (!existing) throw new SegmentError("not_found");
  if (input.name !== undefined) await assertNameAvailable(input.name, id);

  try {
    const row = await prisma.segment.update({ where: { id }, data: input });
    return toSegment(row);
  } catch (error) {
    if (hasErrorCode(error, "P2002")) throw new SegmentError("duplicate_segment");
    if (hasErrorCode(error, "P2025")) throw new SegmentError("not_found");
    throw error;
  }
}

export async function deleteSegment(id: string): Promise<void> {
  const existing = await prisma.segment.findUnique({
    select: { systemKey: true, _count: { select: { campaigns: true } } },
    where: { id },
  });
  if (!existing) throw new SegmentError("not_found");
  if (existing.systemKey) throw new SegmentError("system_segment");
  if (existing._count.campaigns > 0) throw new SegmentError("segment_in_use");

  try {
    await prisma.segment.delete({ where: { id } });
  } catch (error) {
    // A campaign started targeting it after the check (ON DELETE RESTRICT).
    if (hasErrorCode(error, "P2003")) throw new SegmentError("segment_in_use");
    if (hasErrorCode(error, "P2025")) throw new SegmentError("not_found");
    throw error;
  }
}

/** Ids from `ids` with no segment row; empty when all exist. */
export async function missingSegmentIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.segment.findMany({
    select: { id: true },
    where: { id: { in: ids } },
  });
  const found = new Set(rows.map((row) => row.id));
  return ids.filter((id) => !found.has(id));
}
