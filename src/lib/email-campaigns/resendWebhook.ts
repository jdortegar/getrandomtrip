/**
 * Resend webhook tracking (odd/tasks/email-campaigns.md, decision 7).
 *
 * Signature verification delegates to the Resend SDK (`resend.webhooks.verify`,
 * backed by Svix): HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${body}`,
 * any matching `v1,` signature accepted, timestamps outside ±5 minutes
 * rejected. Event handling records one `EmailEvent` per webhook delivery and
 * applies idempotent, conditional side effects.
 */
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/email-campaigns/contacts";
import type {
  BouncedEventMetadata,
  EmailEventType,
  ResendEventOutcome,
  ResendTrackingEvent,
} from "@/types/emailCampaign";

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export type ResendWebhookVerification =
  | { ok: true; payload: unknown }
  | { ok: false; reason: "invalid_signature" | "invalid_json" };

// `webhooks.verify` is a local computation; the constructor only requires a
// non-empty key, which is never sent anywhere from here.
const verifier = new Resend("re_webhook_verification_only").webhooks;

/** Verifies the raw body against the Svix headers and parses it as JSON. */
export function verifyResendWebhook(
  rawBody: string,
  headers: SvixHeaders,
  secret: string,
): ResendWebhookVerification {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, reason: "invalid_signature" };
  }
  try {
    const payload: unknown = verifier.verify({
      payload: rawBody,
      headers: {
        id: headers.id,
        timestamp: headers.timestamp,
        signature: headers.signature,
      },
      webhookSecret: secret,
    });
    return { ok: true, payload };
  } catch (error) {
    // The signature is checked before the body is parsed, so a SyntaxError
    // means an authentic but malformed body.
    return {
      ok: false,
      reason: error instanceof SyntaxError ? "invalid_json" : "invalid_signature",
    };
  }
}

const TRACKED_TYPES: Record<string, EmailEventType> = {
  "email.delivered": "DELIVERED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
  "email.opened": "OPENED",
  "email.clicked": "CLICKED",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/**
 * Narrows a verified payload to a tracked event. Untracked types and payloads
 * without `data.email_id` return `null`. Metadata is deliberately minimal: no
 * full payload, IP addresses or user agents are stored.
 */
export function parseResendEvent(payload: unknown): ResendTrackingEvent | null {
  const root = asRecord(payload);
  const type = root ? TRACKED_TYPES[String(root.type)] : undefined;
  const data = asRecord(root?.data);
  const emailId = asString(data?.email_id);
  if (!type || !data || !emailId) return null;

  const createdAt = new Date(String(root?.created_at));
  const occurredAt = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;

  let metadata: ResendTrackingEvent["metadata"] = null;
  if (type === "CLICKED") {
    const link = asString(asRecord(data.click)?.link);
    metadata = link ? { link } : null;
  } else if (type === "BOUNCED") {
    const bounce = asRecord(data.bounce);
    metadata = {
      bounceType: asString(bounce?.type),
      bounceSubType: asString(bounce?.subType),
    };
  }

  const sendId = readTag(data.tags, "send_id");
  return { type, emailId, ...(sendId ? { sendId } : {}), occurredAt, metadata };
}

/** Reads a tag from the object form (`{ name: value }`) or the array form. */
function readTag(tags: unknown, name: string): string | null {
  if (Array.isArray(tags)) {
    const tag = tags.map(asRecord).find((entry) => entry?.name === name);
    return asString(tag?.value);
  }
  return asString(asRecord(tags)?.[name]);
}

type MatchedSend = { id: string; contactId: string; backfill: boolean };

/**
 * Finds the send by provider id, falling back to the `send_id` tag for an
 * event that beat `sending.ts` to persisting `resendMessageId`. A tagged send
 * already bound to another message id is not this email.
 */
async function findSend(event: ResendTrackingEvent): Promise<MatchedSend | null> {
  const byMessageId = await prisma.campaignSend.findUnique({
    select: { id: true, contactId: true },
    where: { resendMessageId: event.emailId },
  });
  if (byMessageId) return { ...byMessageId, backfill: false };
  if (!event.sendId) return null;

  const byTag = await prisma.campaignSend.findUnique({
    select: { id: true, contactId: true, resendMessageId: true },
    where: { id: event.sendId },
  });
  if (!byTag) return null;
  if (byTag.resendMessageId !== null && byTag.resendMessageId !== event.emailId) {
    return null;
  }
  return {
    id: byTag.id,
    contactId: byTag.contactId,
    backfill: byTag.resendMessageId === null,
  };
}

function isPermanentBounce(metadata: ResendTrackingEvent["metadata"]): boolean {
  const bounceType = (metadata as BouncedEventMetadata | null)?.bounceType;
  return bounceType?.toLowerCase() === "permanent";
}

/**
 * Records one webhook delivery. The event insert and its side effects share a
 * transaction keyed by the Svix id (`providerEventId` is unique), so a
 * redelivery is a no-op and a failed side effect rolls the event back for the
 * provider retry. Unexpected database errors propagate.
 */
export async function handleResendEvent(
  event: ResendTrackingEvent,
  providerEventId: string,
): Promise<ResendEventOutcome> {
  // Transactional emails share the endpoint and have no CampaignSend.
  const send = await findSend(event);
  if (!send) return "unknown_email";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.emailEvent.create({
        data: {
          sendId: send.id,
          type: event.type,
          providerEventId,
          occurredAt: event.occurredAt,
          metadata: event.metadata ?? undefined,
        },
      });

      if (send.backfill) {
        // Guarded: a concurrent batch-result write may have set it first.
        await tx.campaignSend.updateMany({
          where: { id: send.id, resendMessageId: null },
          data: { resendMessageId: event.emailId },
        });
      }

      // QUEUED is accepted because an early event can precede the batch result.
      switch (event.type) {
        case "DELIVERED":
          await tx.campaignSend.updateMany({
            where: { id: send.id, status: { in: ["QUEUED", "SENT"] } },
            data: { status: "DELIVERED" },
          });
          break;
        case "BOUNCED":
          await tx.campaignSend.updateMany({
            where: { id: send.id, status: { in: ["QUEUED", "SENT", "DELIVERED"] } },
            data: { status: "BOUNCED" },
          });
          if (isPermanentBounce(event.metadata)) {
            await tx.contact.updateMany({
              where: { id: send.contactId, status: "SUBSCRIBED" },
              data: { status: "BOUNCED" },
            });
          }
          break;
        case "COMPLAINED":
          await tx.contact.updateMany({
            where: { id: send.contactId, status: "SUBSCRIBED" },
            data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
          });
          break;
        default:
          // OPENED / CLICKED are recorded only.
          break;
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) return "duplicate";
    throw error;
  }
  return "recorded";
}
