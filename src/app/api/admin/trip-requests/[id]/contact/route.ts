import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { sendAdminTripContactMessage } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUBJECT_MAX = 200;
const BODY_MAX = 4000;
const ERROR_MAX = 500;

/**
 * `POST /api/admin/trip-requests/[id]/contact` — admin composes and sends a
 * traveler-facing email. Never status-gated (design.md, Resolved Decision
 * #8) — identical to the `mailto:` link it replaces. Send strictly precedes
 * the audit write; a `TripContactMessage` row is written in BOTH the
 * success and failure branch (design.md "API route").
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_request", field: "subject" },
        { status: 400 },
      );
    }

    const rawSubject = (body as { subject?: unknown })?.subject;
    const rawBody = (body as { body?: unknown })?.body;

    const subject = typeof rawSubject === "string" ? rawSubject.trim() : "";
    if (subject.length < 1 || subject.length > SUBJECT_MAX) {
      return NextResponse.json(
        { error: "invalid_request", field: "subject" },
        { status: 400 },
      );
    }

    const messageBody = typeof rawBody === "string" ? rawBody.trim() : "";
    if (messageBody.length < 1 || messageBody.length > BODY_MAX) {
      return NextResponse.json(
        { error: "invalid_request", field: "body" },
        { status: 400 },
      );
    }

    // No status filter — the contact action is available on every
    // TripRequest.status value (Resolved Decision #8).
    const trip = await prisma.tripRequest.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        user: { select: { email: true, name: true, locale: true } },
      },
    });
    if (!trip) {
      return NextResponse.json({ error: "trip_not_found" }, { status: 404 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: auth.adminId },
      select: { email: true },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    let status: "SENT" | "FAILED" = "SENT";
    let error: string | null = null;

    try {
      await sendAdminTripContactMessage({
        adminEmail: admin.email,
        body: messageBody,
        subject,
        traveler: {
          email: trip.user.email,
          locale: trip.user.locale,
          name: trip.user.name,
        },
      });
    } catch (sendError) {
      status = "FAILED";
      error = String(
        sendError instanceof Error ? sendError.message : sendError,
      ).slice(0, ERROR_MAX);
      console.error("[admin/trip-contact] send failed", sendError);
    }

    let created: { createdAt: Date; id: string; status: string } | null = null;
    try {
      created = await prisma.tripContactMessage.create({
        data: {
          tripRequestId: trip.id,
          subject,
          body: messageBody,
          adminId: auth.adminId,
          adminEmail: admin.email,
          status,
          error,
        },
      });
    } catch (auditError) {
      // The email really did go out (or really did fail) independently of
      // this write — the row is support metadata, never authorization or
      // delivery-confirmation input (design.md, Open Question resolution).
      console.error("[admin/trip-contact] audit write failed", auditError);
    }

    if (status === "FAILED") {
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({
      message: created
        ? { id: created.id, status: created.status, createdAt: created.createdAt }
        : { id: null, status, createdAt: new Date().toISOString() },
    });
  } catch (unexpectedError) {
    console.error("[admin/trip-contact] POST", unexpectedError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
