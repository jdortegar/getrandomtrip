/**
 * Server-only marketing contacts repository (odd/tasks/email-campaigns.md,
 * decisions 2 and 4). Contacts are keyed by lowercase email and optionally
 * linked to the `User` with the same email (case-insensitive). Segment
 * memberships follow odd/tasks/email-campaign-segments.md (decisions 2–3):
 * waitlist signups and friends & family additions join their system segment.
 */
import type { Contact as ContactRow, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONTACT_LOCALE,
  normalizeContactEmail,
  normalizeContactName,
  normalizeContactTags,
  toContactLocale,
} from "@/lib/email-campaigns/contactRules";
import { normalizeSegmentIds } from "@/lib/email-campaigns/segmentRules";
import {
  SEGMENT_REFS_INCLUDE,
  missingSegmentIds,
  systemSegmentId,
  toSegmentRefs,
} from "@/lib/email-campaigns/segments";
import type {
  Contact,
  ContactErrorCode,
  ContactListQuery,
  ContactListResult,
  ContactUpdateInput,
  FriendsFamilyContactInput,
  SegmentRef,
  UnsubscribeResult,
  WaitlistContactInput,
} from "@/types/emailCampaign";

/** Every query returning a `Contact` loads its segments with this include. */
const CONTACT_INCLUDE = { segments: SEGMENT_REFS_INCLUDE } as const;

type ContactRowWithSegments = ContactRow & {
  segments?: { segment: SegmentRef }[];
};

export class ContactError extends Error {
  constructor(readonly code: ContactErrorCode) {
    super(code);
    this.name = "ContactError";
  }
}

export function toContact(row: ContactRowWithSegments): Contact {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    source: row.source,
    status: row.status,
    locale: toContactLocale(row.locale),
    tags: row.tags,
    segments: toSegmentRefs(row.segments),
    userId: row.userId,
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: { email: { equals: email, mode: "insensitive" } },
  });
  return user?.id ?? null;
}

async function assertSegmentsExist(ids: string[]): Promise<void> {
  if ((await missingSegmentIds(ids)).length > 0) {
    throw new ContactError("invalid_segment");
  }
}

/**
 * Creates a WAITLIST contact, or fills only the missing name / userId of an
 * existing one. Never changes source, status or locale: a contact who
 * unsubscribed or bounced is not resubscribed by signing up again. Either way
 * the contact ends up in the waitlist segment; other memberships are kept.
 */
export async function upsertWaitlistContact(
  input: WaitlistContactInput,
): Promise<Contact> {
  const email = normalizeContactEmail(input.email);
  const name = normalizeContactName(input.name);
  const existing = await prisma.contact.findUnique({ where: { email } });

  if (!existing) {
    const created = await prisma.contact.create({
      data: {
        email,
        locale: DEFAULT_CONTACT_LOCALE,
        name,
        source: "WAITLIST",
        userId: await findUserIdByEmail(email),
        segments: { create: [{ segmentId: systemSegmentId("WAITLIST") }] },
      },
      include: CONTACT_INCLUDE,
    });
    return toContact(created);
  }

  await prisma.contactSegment.createMany({
    data: [{ contactId: existing.id, segmentId: systemSegmentId("WAITLIST") }],
    skipDuplicates: true,
  });

  const data: Prisma.ContactUncheckedUpdateInput = {};
  if (!existing.name && name) data.name = name;
  if (!existing.userId) {
    const userId = await findUserIdByEmail(email);
    if (userId) data.userId = userId;
  }
  const updated =
    Object.keys(data).length === 0
      ? await prisma.contact.findUnique({
          where: { id: existing.id },
          include: CONTACT_INCLUDE,
        })
      : await prisma.contact.update({
          where: { id: existing.id },
          data,
          include: CONTACT_INCLUDE,
        });
  return toContact(updated ?? existing);
}

export async function listContacts(
  query: ContactListQuery,
): Promise<ContactListResult> {
  const { page, limit, source, status, segmentId, q } = query;
  const where: Prisma.ContactWhereInput = {
    ...(source && { source }),
    ...(status && { status }),
    ...(segmentId && { segments: { some: { segmentId } } }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: CONTACT_INCLUDE,
    }),
    prisma.contact.count({ where }),
  ]);

  return { items: rows.map(toContact), total, page, limit };
}

/**
 * Manual admin add, always in the friends & family segment plus any
 * `segmentIds`. Throws `ContactError("duplicate_email")` on conflict and
 * `ContactError("invalid_segment")` for unknown segment ids.
 */
export async function createFriendsFamilyContact(
  input: FriendsFamilyContactInput,
): Promise<Contact> {
  const email = normalizeContactEmail(input.email);
  const existing = await prisma.contact.findUnique({ where: { email } });
  if (existing) throw new ContactError("duplicate_email");

  const segmentIds = normalizeSegmentIds([
    systemSegmentId("FRIENDS_FAMILY"),
    ...(input.segmentIds ?? []),
  ]);
  await assertSegmentsExist(segmentIds.slice(1));

  try {
    const created = await prisma.contact.create({
      data: {
        email,
        locale: input.locale ?? DEFAULT_CONTACT_LOCALE,
        name: normalizeContactName(input.name),
        source: "FRIENDS_FAMILY",
        tags: normalizeContactTags(input.tags ?? []),
        userId: await findUserIdByEmail(email),
        segments: { create: segmentIds.map((segmentId) => ({ segmentId })) },
      },
      include: CONTACT_INCLUDE,
    });
    return toContact(created);
  } catch (error) {
    if (isUniqueViolation(error)) throw new ContactError("duplicate_email");
    throw error;
  }
}

/**
 * Admin edit. The only allowed status change is a manual resubscribe to
 * `SUBSCRIBED`, which clears `unsubscribedAt`; unsubscribes and bounces only
 * come from the recipient or the email provider. `segmentIds` replaces every
 * membership (system segments included) in one transaction.
 */
export async function updateContact(
  id: string,
  input: ContactUpdateInput,
): Promise<Contact> {
  if (input.status !== undefined && input.status !== "SUBSCRIBED") {
    throw new ContactError("invalid_status_change");
  }

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) throw new ContactError("not_found");

  const segmentIds =
    input.segmentIds === undefined ? undefined : normalizeSegmentIds(input.segmentIds);
  if (segmentIds) await assertSegmentsExist(segmentIds);

  const data: Prisma.ContactUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = normalizeContactName(input.name);
  if (input.locale !== undefined) data.locale = input.locale;
  if (input.tags !== undefined) data.tags = normalizeContactTags(input.tags);
  if (input.status === "SUBSCRIBED") {
    data.status = "SUBSCRIBED";
    data.unsubscribedAt = null;
  }

  if (!segmentIds) {
    const updated = await prisma.contact.update({
      where: { id },
      data,
      include: CONTACT_INCLUDE,
    });
    return toContact(updated);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.contactSegment.deleteMany({
      where: { contactId: id, segmentId: { notIn: segmentIds } },
    });
    if (segmentIds.length > 0) {
      await tx.contactSegment.createMany({
        data: segmentIds.map((segmentId) => ({ contactId: id, segmentId })),
        skipDuplicates: true,
      });
    }
    return tx.contact.update({ where: { id }, data, include: CONTACT_INCLUDE });
  });
  return toContact(updated);
}

/**
 * Recipient unsubscribe (decision 6). Idempotent: only a SUBSCRIBED contact
 * changes; BOUNCED stays BOUNCED and an already UNSUBSCRIBED contact keeps
 * its original `unsubscribedAt`. The conditional update makes concurrent
 * clicks safe without a read-then-write race.
 */
export async function unsubscribeContact(
  id: string,
): Promise<UnsubscribeResult> {
  const { count } = await prisma.contact.updateMany({
    where: { id, status: "SUBSCRIBED" },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  if (count > 0) return "unsubscribed";

  const existing = await prisma.contact.findUnique({
    select: { id: true },
    where: { id },
  });
  return existing ? "unchanged" : "not_found";
}
