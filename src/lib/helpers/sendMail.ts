import { Resend } from "resend";

interface SendMailParams {
  content: {
    html?: string;
    text?: string;
  };
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
  if (!params.content.html && !params.content.text)
    throw new Error("Email content is required");

  const resend = getResendClient();
  const from = params.from || process.env.EMAIL_FROM || "onboarding@resend.dev";

  const content = params.content.html
    ? { html: params.content.html, text: params.content.text }
    : { text: params.content.text as string };

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
