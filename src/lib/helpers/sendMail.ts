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

export async function sendMail(params: SendMailParams) {
  const isProduction = isProductionDeployment();
  // Fail closed: only an explicit production or nonproduction runtime sends.
  if (!isProduction && !isNonproductionDeployment()) {
    throw new Error("Email delivery is disabled for this deployment");
  }
  const subject = isProduction
    ? params.subject
    : `${NONPRODUCTION_SUBJECT_PREFIX}${params.subject}`;
  const resend = getResendClient();
  const from = params.from || process.env.EMAIL_FROM || "onboarding@resend.dev";

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
