import { NextResponse } from "next/server";
import { sendMail } from "@/lib/helpers/sendMail";

interface ContactPayload {
  email?: string;
  interest?: string;
  message?: string;
  name?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSiteUrl() {
  const url = "https://getrandomtrip.com";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildEmailHtml(payload: Required<ContactPayload>) {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/assets/logos/logo_white.svg`;
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeInterest = escapeHtml(payload.interest);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New contact form submission</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827; margin: 0 auto; max-width: 640px; padding: 24px 12px;">
          <div style="background: #0f172a; border-radius: 12px 12px 0 0; padding: 20px; text-align: center;">
            <img alt="GetRandomTrip" src="${logoUrl}" style="height: 42px; max-width: 220px; width: 100%;" />
          </div>
          <div style="background: #ffffff; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: 0; padding: 24px;">
            <h2 style="color: #111827; font-size: 24px; margin: 0 0 18px;">New contact form submission</h2>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 0;"><strong>Name:</strong> ${safeName}</p>
              <p style="margin: 0;"><strong>Email:</strong> ${safeEmail}</p>
              <p style="margin: 0;"><strong>Interest:</strong> ${safeInterest}</p>
              <p style="margin: 12px 0 0;"><strong>Message:</strong></p>
              <p style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; margin: 0; padding: 14px;">${safeMessage}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin: 24px 0 0;">
              Sent from getrandomtrip contact form
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildEmailText(payload: Required<ContactPayload>) {
  return `
New contact form submission

Name: ${payload.name}
Email: ${payload.email}
Interest: ${payload.interest}

Message:
${payload.message}
  `.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactPayload;
    const email = body.email?.trim();
    const interest = body.interest?.trim();
    const message = body.message?.trim();
    const name = body.name?.trim();

    if (!email || !interest || !message || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await sendMail({
      content: {
        html: buildEmailHtml({ email, interest, message, name }),
        text: buildEmailText({ email, interest, message, name }),
      },
      replyTo: email,
      subject: `Contact form - ${interest}`,
      to: "hola@getrandomtrip.com",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
