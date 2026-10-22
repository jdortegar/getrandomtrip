import {
  isNonproductionDeployment,
  isProductionDeployment,
} from "@/lib/deployment";
import React from "react";
import { Resend } from "resend";

/** Mirrors Resend's `Attachment` shape — kept local so callers don't need to import from `resend` directly. */
export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendMailParams {
  attachments?: MailAttachment[];
  content:
    | { react: React.ReactElement; html?: never; text?: string }
    | { html: string; react?: never; text?: string }
    | { text: string; react?: never; html?: never };
  from?: string;
  /** Extra provider headers, e.g. `List-Unsubscribe` for campaign mail. */
  headers?: Record<string, string>;
  idempotencyKey?: string;
  replyTo?: string;
  subject: string;
  to: string | string[];
}

function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("Resend API key not configured");
  return new Resend(resendApiKey);
}

/** Marks emails sent from develop/preview so they can't pass for real ones. */
const NONPRODUCTION_SUBJECT_PREFIX = "[TEST] ";

/**
 * Fails closed: only an explicit production or nonproduction runtime sends.
 * Returns the subject transform for this deployment.
 */
function resolveDelivery(): { subject: (subject: string) => string } {
  const isProduction = isProductionDeployment();
  if (!isProduction && !isNonproductionDeployment()) {
    throw new Error("Email delivery is disabled for this deployment");
  }
  return {
    subject: (subject) =>
      isProduction ? subject : `${NONPRODUCTION_SUBJECT_PREFIX}${subject}`,
  };
}

function resolveFrom(from?: string): string {
  return from || process.env.EMAIL_FROM || "onboarding@resend.dev";
}

export async function sendMail(params: SendMailParams) {
  const delivery = resolveDelivery();
  const subject = delivery.subject(params.subject);
  const resend = getResendClient();
  const from = resolveFrom(params.from);

  let content:
    | { react: React.ReactElement }
    | { html: string; text?: string }
    | { text: string };

  if ("react" in params.content && params.content.react) {
    content = { react: params.content.react };
  } else if ("html" in params.content && params.content.html) {
    content = { html: params.content.html, text: params.content.text };
  } else if ("text" in params.content && params.content.text) {
    content = { text: params.content.text };
  } else {
    throw new Error("Email content is required");
  }

  const { data, error } = await resend.emails.send(
    {
      ...content,
      attachments: params.attachments,
      from,
      headers: params.headers,
      replyTo: params.replyTo,
      subject,
      to: params.to,
    },
    params.idempotencyKey
      ? { idempotencyKey: params.idempotencyKey }
      : undefined,
  );

  if (error) throw new Error(error.message || "Failed to send email");
  return data;
}

/** Resend's batch API limit per call. */
export const MAX_BATCH_SIZE = 100;

/** Resend tag; name and value allow only ASCII letters, digits, `_` and `-`. */
export interface MailTag {
  name: string;
  value: string;
}

/** One email of a batch. Batches support neither attachments nor scheduling. */
export interface BatchMailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
  replyTo?: string;
  tags?: MailTag[];
}

/** Per-message outcome, in the same order as the input messages. */
export type BatchMailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Sends up to {@link MAX_BATCH_SIZE} emails in one Resend call. Same gating,
 * sender and nonproduction subject prefix as `sendMail` (throws the same
 * error when delivery is disabled). Validation is strict, so a provider
 * error fails every message of the batch.
 */
export async function sendMailBatch(
  messages: BatchMailMessage[],
  options: { idempotencyKey?: string } = {},
): Promise<BatchMailResult[]> {
  const delivery = resolveDelivery();
  if (messages.length > MAX_BATCH_SIZE) {
    throw new Error(`A batch holds at most ${MAX_BATCH_SIZE} emails`);
  }
  if (messages.length === 0) return [];

  const resend = getResendClient();
  const { data, error } = await resend.batch.send(
    messages.map((message) => ({
      from: resolveFrom(message.from),
      to: message.to,
      subject: delivery.subject(message.subject),
      html: message.html,
      text: message.text,
      headers: message.headers,
      replyTo: message.replyTo,
      tags: message.tags,
    })),
    options.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined,
  );

  if (error) {
    const message = error.message || "Failed to send email";
    return messages.map(() => ({ ok: false, error: message }));
  }
  // Strict batches return one id per email, in request order.
  return messages.map((_, index) => {
    const id = data?.data[index]?.id;
    return id
      ? { ok: true, id }
      : { ok: false, error: "Provider returned no message id" };
  });
}
