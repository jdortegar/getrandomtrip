/**
 * Server-only marketing contacts repository (odd/tasks/email-campaigns.md,
 * decisions 2 and 4). Contacts are keyed by lowercase email and optionally
 * linked to the `User` with the same email (case-insensitive).
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
import type {
  Contact,
  ContactErrorCode,
  ContactListQuery,
  ContactListResult,
  ContactUpdateInput,
  FriendsFamilyContactInput,
  UnsubscribeResult,
  WaitlistContactInput,
} from "@/types/emailCampaign";

export class ContactError extends Error {
  constructor(readonly code: ContactErrorCode) {
    super(code);
    this.name = "ContactError";
  }
}

export function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    source: row.source,
    status: row.status,
    locale: toContactLocale(row.locale),
    tags: row.tags,
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

/**
 * Creates a WAITLIST contact, or fills only the missing name / userId of an
 * existing one. Never changes source, status or locale: a contact who
 * unsubscribed or bounced is not resubscribed by signing up again.
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
      },
    });
    return toContact(created);
  }

  const data: Prisma.ContactUncheckedUpdateInput = {};
  if (!existing.name && name) data.name = name;
  if (!existing.userId) {
    const userId = await findUserIdByEmail(email);
    if (userId) data.userId = userId;
  }
  if (Object.keys(data).length === 0) return toContact(existing);

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data,
  });
  return toContact(updated);
}

export async function listContacts(
  query: ContactListQuery,
): Promise<ContactListResult> {
  const { page, limit, source, status, q } = query;
  const where: Prisma.ContactWhereInput = {
    ...(source && { source }),
    ...(status && { status }),
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
    }),
    prisma.contact.count({ where }),
  ]);

  return { items: rows.map(toContact), total, page, limit };
}

/** Manual admin add. Throws `ContactError("duplicate_email")` on conflict. */
export async function createFriendsFamilyContact(
  input: FriendsFamilyContactInput,
): Promise<Contact> {
  const email = normalizeContactEmail(input.email);
  const existing = await prisma.contact.findUnique({ where: { email } });
  if (existing) throw new ContactError("duplicate_email");

  try {
    const created = await prisma.contact.create({
      data: {
        email,
        locale: input.locale ?? DEFAULT_CONTACT_LOCALE,
        name: normalizeContactName(input.name),
        source: "FRIENDS_FAMILY",
        tags: normalizeContactTags(input.tags ?? []),
        userId: await findUserIdByEmail(email),
      },
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
 * come from the recipient or the email provider.
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

  const data: Prisma.ContactUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = normalizeContactName(input.name);
  if (input.locale !== undefined) data.locale = input.locale;
  if (input.tags !== undefined) data.tags = normalizeContactTags(input.tags);
  if (input.status === "SUBSCRIBED") {
    data.status = "SUBSCRIBED";
    data.unsubscribedAt = null;
  }

  const updated = await prisma.contact.update({ where: { id }, data });
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
