import { NextResponse } from "next/server";
import { sendContactFormSubmission } from "@/lib/email";
import type { MailAttachment } from "@/lib/helpers/sendMail";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

interface ContactPayload {
  email?: string;
  interest?: string;
  locale?: string;
  message?: string;
  name?: string;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let email: string | undefined;
    let interest: string | undefined;
    let locale: string | undefined;
    let message: string | undefined;
    let name: string | undefined;
    let attachmentFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      email = String(form.get("email") ?? "").trim();
      interest = String(form.get("interest") ?? "").trim();
      locale = String(form.get("locale") ?? "").trim();
      message = String(form.get("message") ?? "").trim();
      name = String(form.get("name") ?? "").trim();
      const rawAttachment = form.get("attachment");
      if (rawAttachment instanceof File && rawAttachment.size > 0) {
        attachmentFile = rawAttachment;
      }
    } else {
      const body = (await req.json()) as ContactPayload;
      email = body.email?.trim();
      interest = body.interest?.trim();
      locale = body.locale?.trim();
      message = body.message?.trim();
      name = body.name?.trim();
    }

    if (!email || !interest || !message || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (attachmentFile && attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: "Attachment too large" },
        { status: 400 },
      );
    }

    const attachments: MailAttachment[] | undefined = attachmentFile
      ? [
          {
            content: Buffer.from(await attachmentFile.arrayBuffer()),
            contentType: attachmentFile.type || undefined,
            filename: attachmentFile.name,
          },
        ]
      : undefined;

    await sendContactFormSubmission({
      attachments,
      email,
      interest,
      locale,
      message,
      name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
