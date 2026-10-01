import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isRosterLocked,
  serializeTraveler,
} from "@/lib/travelers/travelerRoster";
import { canAccessTrip, tripRoleFor } from "@/lib/travelers/travelerAccess";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { emailsMatch } from "@/lib/travelers/travelerEmail";
import { sendTravelerInviteEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validation/email";

import {
  hasMissingTravelerDetails,
  isTravelerFieldFilled,
  isTripEnded,
} from "@/lib/travelers/travelerPolicy";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/travelers/[id] — buyer edits a single traveler row (adult or
 * minor). Single-row update only: this endpoint never adds or removes rows,
 * the roster size is fixed at payment success.
 *
 * Minor rows require all three fields (`fullName`, `dateOfBirth`,
 * `idDocument`) to be present after merging saved values — an incomplete minor save
 * is rejected outright (400), nothing is persisted. Adult rows accept
 * partial saves; the row only flips to `COMPLETE` once `fullName`, `email`,
 * and `idDocument` are all present, otherwise the existing status is kept.
 * A row already `COMPLETE` is never downgraded.
 *
 * Auto-invite: saving a valid, new or changed email on an unlinked ADULT row
 * (trip not ended) rotates the invite token and emails the companion — no
 * button click needed. Re-saving the same address sends nothing. The row
 * becomes `INVITED`, and an `INVITED` row is never flipped to `COMPLETE` here:
 * `COMPLETE` means "the companion accepted" (it makes the token read as
 * `used`), while roster completeness is derived from the saved details.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: params.id },
      include: { tripRequest: true },
    });

    if (!traveler) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Buyer-OR-companion, matching the read path (GET /api/trips/[id]).
    if (!(await canAccessTrip(traveler.tripRequestId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // A companion may only edit their own (linked) row; every other row is the
    // buyer's to manage.
    const isCompanion =
      tripRoleFor(traveler.tripRequest, session.user.id) === "companion";
    if (isCompanion && traveler.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    // Once a companion joined, their row's email is the identity they linked
    // with: nobody (buyer included) can change it. A same-address re-save is
    // not an error.
    if (
      traveler.userId &&
      body.email !== undefined &&
      !emailsMatch(body.email, traveler.email)
    ) {
      return NextResponse.json({ error: "email_locked_joined" }, { status: 403 });
    }
    // The saved email is the identity the invite was bound to; a companion
    // cannot repoint it (re-sending the same address is harmless).
    if (
      isCompanion &&
      body.email !== undefined &&
      !emailsMatch(body.email, traveler.email)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    for (const field of [
      "fullName",
      "email",
      "idDocument",
      "dateOfBirth",
    ] as const) {
      if (body[field] !== undefined && typeof body[field] !== "string") {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      if (typeof body[field] === "string") body[field] = body[field].trim();
    }
    if (
      body.dateOfBirth !== undefined &&
      !Number.isFinite(new Date(body.dateOfBirth).getTime())
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (isRosterLocked(traveler.tripRequest)) {
      for (const field of [
        "fullName",
        "email",
        "idDocument",
        "dateOfBirth",
      ] as const) {
        const current = traveler[field];
        const incoming =
          field === "dateOfBirth"
            ? new Date(body[field]).getTime()
            : body[field];
        const previous =
          current instanceof Date ? current.getTime() : current?.trim();
        if (
          body[field] !== undefined &&
          isTravelerFieldFilled(current) &&
          incoming !== previous
        ) {
          return NextResponse.json({ error: "locked" }, { status: 403 });
        }
      }
    }

    const fullName =
      body.fullName !== undefined ? body.fullName : traveler.fullName;
    const email = body.email !== undefined ? body.email : traveler.email;
    const idDocument =
      body.idDocument !== undefined ? body.idDocument : traveler.idDocument;
    const dateOfBirth =
      body.dateOfBirth !== undefined
        ? new Date(body.dateOfBirth)
        : traveler.dateOfBirth;

    if (traveler.kind === "MINOR") {
      const complete = !hasMissingTravelerDetails({
        kind: traveler.kind,
        fullName,
        email,
        idDocument,
        dateOfBirth,
      });
      if (!complete) {
        return NextResponse.json(
          { error: "incomplete", message: "fill in all fields" },
          { status: 400 },
        );
      }
    }

    const isComplete = !hasMissingTravelerDetails({
      kind: traveler.kind,
      fullName,
      email,
      idDocument,
      dateOfBirth,
    });

    const shouldInvite =
      traveler.kind === "ADULT" &&
      !traveler.userId &&
      isValidEmail(email ?? "") &&
      !emailsMatch(traveler.email, email) &&
      !isTripEnded(traveler.tripRequest);

    // A row only becomes INVITED once its token is actually issued (below):
    // `issueTravelerInvite` sets the status itself, so a failed issuance never
    // leaves an INVITED row without a token.
    const nextStatus =
      traveler.status === "COMPLETE" || traveler.status === "INVITED"
        ? traveler.status
        : isComplete
          ? "COMPLETE"
          : traveler.status;

    const justCompleted =
      isComplete && traveler.status !== "COMPLETE" && !traveler.submittedAt;

    const updated = await prisma.tripTraveler.update({
      // Compare-and-swap: a concurrent fill must never be overwritten.
      where: {
        id: params.id,
        fullName: traveler.fullName,
        email: traveler.email,
        idDocument: traveler.idDocument,
        dateOfBirth: traveler.dateOfBirth,
        status: traveler.status,
      },
      data: {
        fullName,
        email,
        idDocument,
        dateOfBirth,
        status: nextStatus,
        ...(justCompleted && { submittedAt: new Date() }),
      },
    });

    if (shouldInvite) {
      try {
        const plaintext = await issueTravelerInvite(updated.id, updated.status);
        sendTravelerInviteEmail(updated.id, plaintext);
        // Token issued: mirror what `issueTravelerInvite` wrote on the row.
        return NextResponse.json({
          traveler: serializeTraveler({
            ...updated,
            status: "INVITED",
            invitedAt: new Date(),
          }),
          invited: true,
        });
      } catch (error) {
        // The save already succeeded and the row was not marked INVITED; tell
        // the client so it can offer "Resend invite" instead of claiming a send.
        console.error("[travelers/[id]] auto-invite failed:", error);
        return NextResponse.json({
          traveler: serializeTraveler(updated),
          inviteFailed: true,
        });
      }
    }

    return NextResponse.json({ traveler: serializeTraveler(updated) });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
    console.error("[travelers/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
