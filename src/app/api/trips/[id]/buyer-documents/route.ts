import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { PaymentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NON_TERMINAL_TRIP_STATUSES } from "@/lib/db/tripRequestFamily";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { isRosterLocked } from "@/lib/travelers/travelerRoster";
import {
  isTripEnded,
  parseTravelerDocumentCodes,
  travelerCodesEqual,
} from "@/lib/travelers/travelerPolicy";

export const dynamic = "force-dynamic";

class CheckoutLockedError extends Error {}

/** Paid trip statuses in which the buyer may still edit their documents. */
const PAID_EDITABLE_TRIP_STATUSES = ["CONFIRMED", "REVEALED"] as const;

/** Same "checkout still editable" rule as `/api/trip-requests` checkout edits. */
function isCheckoutEditable(trip: {
  status: string;
  payment: { status: string } | null;
}): boolean {
  return (
    (NON_TERMINAL_TRIP_STATUSES as readonly string[]).includes(trip.status) &&
    (!trip.payment ||
      (RETRYABLE_PAYMENT_STATUSES as readonly string[]).includes(trip.payment.status))
  );
}

type BuyerDocumentsTrip = {
  status: string;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
  departureTimeZone: string | null;
  travelersLockedAt: Date | null;
  payment: { status: string } | null;
};

/**
 * How the buyer may edit after payment, while the trip is active (approved
 * payment, confirmed or revealed, not ended): every list until the roster
 * locks, then only the lists that are still empty — the same rule as the
 * companions' rows in `PATCH /api/travelers/[id]`.
 */
function paidEditMode(trip: BuyerDocumentsTrip): "open" | "fill-empty" | null {
  if (
    trip.payment?.status !== "APPROVED" ||
    !(PAID_EDITABLE_TRIP_STATUSES as readonly string[]).includes(trip.status) ||
    isTripEnded(trip)
  ) {
    return null;
  }
  return isRosterLocked(trip) ? "fill-empty" : "open";
}

const LIST_FIELDS = [
  ["nationalities", "buyerNationalities"],
  ["visas", "buyerVisas"],
] as const;

const NOT_EDITABLE = { error: "Trip is no longer editable" };

/**
 * PATCH /api/trips/[id]/buyer-documents — the buyer's snapshot of
 * nationalities and visas. Written to the trip and back to the buyer's
 * profile in one transaction: freely while checkout is still editable or,
 * once paid, until the traveler roster locks; after the lock only lists that
 * are still empty can be filled (populated lists are frozen). In that
 * fill-empty window a list left out of the body stays unchanged.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsed = parseTravelerDocumentCodes(body as Record<string, unknown>);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error, invalid: parsed.invalid },
        { status: 400 },
      );
    }
    if (parsed.nationalities === undefined && parsed.visas === undefined) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (parsed.nationalities?.length === 0) {
      return NextResponse.json(
        { error: "At least one nationality is required", invalid: [] },
        { status: 400 },
      );
    }

    const { id } = await props.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        type: true,
        startDate: true,
        endDate: true,
        departureTimeZone: true,
        travelersLockedAt: true,
        buyerNationalities: true,
        buyerVisas: true,
        payment: { select: { status: true } },
      },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (trip.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkoutEditable = isCheckoutEditable(trip);
    const paidMode = checkoutEditable ? null : paidEditMode(trip);
    if (!checkoutEditable && !paidMode) {
      return NextResponse.json(NOT_EDITABLE, { status: 409 });
    }

    const current = {
      nationalities: trip.buyerNationalities ?? [],
      visas: trip.buyerVisas ?? [],
    };
    let lists: { nationalities?: string[]; visas?: string[] };
    if (paidMode === "fill-empty") {
      // Companion rule: a populated list is frozen; re-sending it unchanged is
      // harmless, any other value is rejected.
      for (const [field] of LIST_FIELDS) {
        const incoming = parsed[field];
        if (
          incoming !== undefined &&
          current[field].length > 0 &&
          !travelerCodesEqual(incoming, current[field])
        ) {
          return NextResponse.json(NOT_EDITABLE, { status: 409 });
        }
      }
      lists = { nationalities: parsed.nationalities, visas: parsed.visas };
    } else {
      if (parsed.nationalities === undefined) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
      lists = { nationalities: parsed.nationalities, visas: parsed.visas ?? [] };
    }

    // The rule is repeated in the write itself so a concurrent change cannot
    // slip a snapshot edit past it. Checkout: a payment approved after the
    // read fails the status filter. Paid: the roster cutoff is time-based
    // (departure in the trip's time zone), so it cannot be a `where` filter;
    // instead every input of `isRosterLocked`/`isTripEnded` is compared to
    // the values just checked, and any change (manual lock, new dates,
    // refund, cancellation) makes the write match nothing. After the lock,
    // each written list must also still hold what was checked (so a list
    // filled concurrently is never overwritten).
    const where = checkoutEditable
      ? {
          id: trip.id,
          userId,
          status: { in: [...NON_TERMINAL_TRIP_STATUSES] },
          OR: [
            { payment: { is: null } },
            {
              payment: {
                is: { status: { in: [...RETRYABLE_PAYMENT_STATUSES] as PaymentStatus[] } },
              },
            },
          ],
        }
      : {
          id: trip.id,
          userId,
          status: { in: [...PAID_EDITABLE_TRIP_STATUSES] },
          payment: { is: { status: "APPROVED" as const } },
          type: trip.type,
          startDate: trip.startDate,
          endDate: trip.endDate,
          departureTimeZone: trip.departureTimeZone,
          travelersLockedAt: trip.travelersLockedAt,
          ...(paidMode === "fill-empty" &&
            Object.fromEntries(
              LIST_FIELDS.filter(([field]) => lists[field] !== undefined).map(
                ([field, column]) => [column, { equals: current[field] }],
              ),
            )),
        };

    const tripData = {
      ...(lists.nationalities !== undefined && { buyerNationalities: lists.nationalities }),
      ...(lists.visas !== undefined && { buyerVisas: lists.visas }),
    };
    const userData = {
      ...(lists.nationalities !== undefined && { nationalities: lists.nationalities }),
      ...(lists.visas !== undefined && { approvedVisas: lists.visas }),
    };

    await prisma.$transaction(async (tx) => {
      const updated = await tx.tripRequest.updateMany({ where, data: tripData });
      if (updated.count !== 1) throw new CheckoutLockedError();
      await tx.user.update({ where: { id: userId }, data: userData });
    });

    return NextResponse.json({
      buyerNationalities: lists.nationalities ?? current.nationalities,
      buyerVisas: lists.visas ?? current.visas,
    });
  } catch (error) {
    if (error instanceof CheckoutLockedError) {
      return NextResponse.json(NOT_EDITABLE, { status: 409 });
    }
    console.error("Error saving buyer travel documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
