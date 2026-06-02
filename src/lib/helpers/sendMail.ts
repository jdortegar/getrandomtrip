import React from "react";
import { Resend } from "resend";

interface SendMailParams {
  content:
    | { react: React.ReactElement; html?: never; text?: string }
    | { html: string; react?: never; text?: string }
    | { text: string; react?: never; html?: never };
  from?: string;
  replyTo?: string;
  subject: string;
  to: string | string[];
}

function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("Resend API key not configured");
  return new Resend(resendApiKey);
}

export async function sendMail(params: SendMailParams) {
  const resend = getResendClient();
  const from = params.from || process.env.EMAIL_FROM || "onboarding@resend.dev";

  let content: { react: React.ReactElement } | { html: string; text?: string } | { text: string };

  if ("react" in params.content && params.content.react) {
    content = { react: params.content.react };
  } else if ("html" in params.content && params.content.html) {
    content = { html: params.content.html, text: params.content.text };
  } else if ("text" in params.content && params.content.text) {
    content = { text: params.content.text };
  } else {
    throw new Error("Email content is required");
  }

  const { data, error } = await resend.emails.send({
    ...content,
    from,
    replyTo: params.replyTo,
    subject: params.subject,
    to: params.to,
  });

  if (error) throw new Error(error.message || "Failed to send email");
  return data;
}
