import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { PaymentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isIsoCountryCode,
  isVisaCode,
  normalizeCountryCodes,
  normalizeVisaCodes,
} from "@/lib/geo/countryOptions";
import { NON_TERMINAL_TRIP_STATUSES } from "@/lib/db/tripRequestFamily";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";

export const dynamic = "force-dynamic";

class CheckoutLockedError extends Error {}

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

/** Returns the entries that are not strings passing `isValid` once trimmed and uppercased. */
function invalidCodes(values: unknown[], isValid: (code: string) => boolean): string[] {
  return values
    .filter((entry) => typeof entry !== "string" || !isValid(entry.trim().toUpperCase()))
    .map(String);
}

/**
 * PATCH /api/trips/[id]/buyer-documents — the buyer's checkout snapshot of
 * nationalities and visas. Written to the trip and back to the buyer's
 * profile in one transaction, only while checkout is still editable.
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

    let body: { nationalities?: unknown; visas?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const rawVisas = body?.visas ?? [];
    if (!Array.isArray(body?.nationalities) || !Array.isArray(rawVisas)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (body.nationalities.length === 0) {
      return NextResponse.json(
        { error: "At least one nationality is required", invalid: [] },
        { status: 400 },
      );
    }
    const invalidNationalities = invalidCodes(body.nationalities, isIsoCountryCode);
    if (invalidNationalities.length > 0) {
      return NextResponse.json(
        { error: "Invalid nationalities", invalid: invalidNationalities },
        { status: 400 },
      );
    }
    const invalidVisas = invalidCodes(rawVisas, isVisaCode);
    if (invalidVisas.length > 0) {
      return NextResponse.json(
        { error: "Invalid visas", invalid: invalidVisas },
        { status: 400 },
      );
    }
    const nationalities = normalizeCountryCodes(body.nationalities as string[]);
    const visas = normalizeVisaCodes(rawVisas as string[]);

    const { id } = await props.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, payment: { select: { status: true } } },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (trip.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isCheckoutEditable(trip)) {
      return NextResponse.json({ error: "Trip is no longer editable" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      // Re-check the lock in the write itself so a payment approved after the
      // read cannot be followed by a snapshot change.
      const updated = await tx.tripRequest.updateMany({
        where: {
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
        },
        data: { buyerNationalities: nationalities, buyerVisas: visas },
      });
      if (updated.count !== 1) throw new CheckoutLockedError();
      await tx.user.update({
        where: { id: userId },
        data: { nationalities, approvedVisas: visas },
      });
    });

    return NextResponse.json({ buyerNationalities: nationalities, buyerVisas: visas });
  } catch (error) {
    if (error instanceof CheckoutLockedError) {
      return NextResponse.json({ error: "Trip is no longer editable" }, { status: 409 });
    }
    console.error("Error saving buyer travel documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
