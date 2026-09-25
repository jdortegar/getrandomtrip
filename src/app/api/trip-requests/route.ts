import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePaxDetails, paxDetailsEquals } from "@/lib/helpers/pax-details";
import { getCheckoutLevel, getCheckoutPaxDetails } from "@/lib/helpers/checkout-party";
import { CHECKOUT_PRICE_SELECT, checkoutPriceInputsChanged } from "@/lib/helpers/checkout-price-inputs";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { invalidateCheckoutForEdit } from "@/lib/payments/invalidate-checkout";
import {
  normalizeJourneyFilterValue,
  normalizeMaxTravelTimeKey,
  normalizeTransportId,
} from "@/lib/helpers/transport";
import { tripAccessWhere, tripRoleFor } from "@/lib/travelers/travelerAccess";
import { findActiveTripRequest, tripFamilyOf } from "@/lib/db/tripRequest";
import { Prisma, TripRequestStatus } from "@prisma/client";

/**
 * For Xsed trips, startDate must be the Saturday that follows the next
 * Sunday booking window — regardless of what the client sent.
 * Uses UTC so server timezone is irrelevant.
 */
function xsedCanonicalDates(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilNextSunday = day === 0 ? 0 : 7 - day;
  const daysUntilSat = daysUntilNextSunday + 6;
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSat),
  );
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSat + 1),
  );
  return { startDate, endDate };
}

function hasBodyKey(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function buildTripRequestPartialUpdate(
  body: Record<string, unknown>,
  paxDetailsPayload:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined,
): Prisma.TripRequestUpdateInput {
  const data: Prisma.TripRequestUpdateInput = {};

  if (hasBodyKey(body, "from")) {
    data.from = typeof body.from === "string" ? body.from || "admin" : "admin";
  }
  if (hasBodyKey(body, "type")) {
    data.type = String(body.type);
  }
  if (hasBodyKey(body, "level")) {
    data.level = String(body.level);
  }
  if (hasBodyKey(body, "originCountry")) {
    data.originCountry = String(body.originCountry);
  }
  if (hasBodyKey(body, "originCity")) {
    data.originCity = String(body.originCity);
  }
  if (hasBodyKey(body, "startDate")) {
    data.startDate =
      body.startDate != null && body.startDate !== ""
        ? new Date(String(body.startDate))
        : null;
  }
  if (hasBodyKey(body, "endDate")) {
    data.endDate =
      body.endDate != null && body.endDate !== ""
        ? new Date(String(body.endDate))
        : null;
  }
  if (hasBodyKey(body, "nights")) {
    const n = Number(body.nights);
    data.nights = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }
  if (hasBodyKey(body, "pax")) {
    const n = Number(body.pax);
    data.pax = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }
  if (hasBodyKey(body, "transport")) {
    data.transport =
      normalizeTransportId(String(body.transport ?? "")) || "plane";
  }
  if (hasBodyKey(body, "accommodationType")) {
    data.accommodationType =
      normalizeJourneyFilterValue(String(body.accommodationType ?? "")) ||
      "any";
  }
  if (hasBodyKey(body, "climate")) {
    data.climate =
      normalizeJourneyFilterValue(String(body.climate ?? "")) || "any";
  }
  if (hasBodyKey(body, "maxTravelTime")) {
    data.maxTravelTime =
      normalizeMaxTravelTimeKey(String(body.maxTravelTime ?? "")) || "no-limit";
  }
  if (hasBodyKey(body, "departPref")) {
    data.departPref =
      normalizeJourneyFilterValue(String(body.departPref ?? "")) || "any";
  }
  if (hasBodyKey(body, "arrivePref")) {
    data.arrivePref =
      normalizeJourneyFilterValue(String(body.arrivePref ?? "")) || "any";
  }
  if (hasBodyKey(body, "avoidDestinations")) {
    data.avoidDestinations = Array.isArray(body.avoidDestinations)
      ? (body.avoidDestinations as string[])
      : [];
  }
  if (hasBodyKey(body, "addons")) {
    data.addons = body.addons as Prisma.InputJsonValue;
  }
  if (hasBodyKey(body, "status")) {
    data.status = (body.status as TripRequestStatus) ?? TripRequestStatus.DRAFT;
  }
  if (paxDetailsPayload !== undefined) {
    data.paxDetails = paxDetailsPayload;
  }

  return data;
}

/** Fields produced for a fresh row — shared by both `create` and the
 * family-scoped `update` fallback so a reused xsed row still gets
 * canonical dates / `experienceId` resolution instead of stale values. */
type TripRequestCreateFields = {
  from: string;
  type: string;
  level: string;
  originCountry: string;
  originCity: string;
  startDate: Date | null;
  endDate: Date | null;
  nights: number;
  pax: number;
  transport: string;
  accommodationType: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  avoidDestinations: string[];
  addons: Prisma.InputJsonValue;
  status: TripRequestStatus;
  paxDetails?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  experienceId?: string;
};

async function buildTripRequestCreateFields(
  body: Record<string, unknown>,
  paxDetailsValue:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined,
): Promise<TripRequestCreateFields> {
  const {
    from,
    type,
    level,
    originCountry,
    originCity,
    startDate,
    endDate,
    nights,
    pax,
    transport,
    accommodationType,
    climate,
    maxTravelTime,
    departPref,
    arrivePref,
    avoidDestinations,
    addons,
    status,
    experienceId,
  } = body;

  // For Xsed trips, dates are always the canonical next-Saturday→Sunday
  // pair, computed fresh here — never trusted from the client, and never
  // overridden by a linked Experience's tripDate (that field is informational
  // only; letting it override the booking date let a stale/mismatched value
  // silently corrupt a real trip's dates).
  let resolvedStartDate: Date | null = startDate
    ? new Date(String(startDate))
    : null;
  let resolvedEndDate: Date | null = endDate
    ? new Date(String(endDate))
    : null;

  if ((type as string) === "xsed") {
    const canonical = xsedCanonicalDates();
    resolvedStartDate = canonical.startDate;
    resolvedEndDate = canonical.endDate;
  }

  const xsedParty = type === "xsed"
    ? getCheckoutPaxDetails({ type, level: String(level), pax: Number(pax) || 1, paxDetails: paxDetailsValue })
    : null;

  return {
    from: (from as string) || "admin",
    type: type as string,
    level: xsedParty ? getCheckoutLevel({ type: "xsed", level: String(level), pax: xsedParty.adults + xsedParty.minors }) : level as string,
    originCountry: originCountry as string,
    originCity: originCity as string,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    nights: (typeof nights === "number" ? nights : Number(nights)) || 1,
    pax: xsedParty ? xsedParty.adults + xsedParty.minors : Number(pax) || 1,
    transport: normalizeTransportId(String(transport ?? "")) || "plane",
    accommodationType:
      normalizeJourneyFilterValue(String(accommodationType ?? "")) || "any",
    climate: normalizeJourneyFilterValue(String(climate ?? "")) || "any",
    maxTravelTime:
      normalizeMaxTravelTimeKey(String(maxTravelTime ?? "")) || "no-limit",
    departPref:
      normalizeJourneyFilterValue(String(departPref ?? "")) || "any",
    arrivePref:
      normalizeJourneyFilterValue(String(arrivePref ?? "")) || "any",
    avoidDestinations: Array.isArray(avoidDestinations)
      ? (avoidDestinations as string[])
      : [],
    addons: (addons ?? []) as Prisma.InputJsonValue,
    status: (status as TripRequestStatus) || TripRequestStatus.DRAFT,
    ...(xsedParty ? { paxDetails: xsedParty as unknown as Prisma.InputJsonValue }
      : paxDetailsValue !== undefined ? { paxDetails: paxDetailsValue } : {}),
    ...(experienceId ? { experienceId: String(experienceId) } : {}),
  };
}

// GET /api/trip-requests - Get all trip requests for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/trip-requests called");
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    console.log("Finding user by email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log("User found:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all trip requests owned by OR companion-linked to this user.
    console.log("Fetching trip requests for userId:", user.id);
    const tripRequests = await prisma.tripRequest.findMany({
      where: tripAccessWhere(user.id),
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        experience: true,
      },
    });
    console.log("Trip requests found:", tripRequests.length);

    const taggedTripRequests = tripRequests.map((trip) => ({
      ...trip,
      role: tripRoleFor(trip, user.id),
    }));

    return NextResponse.json(
      { tripRequests: taggedTripRequests },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching trip requests:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// POST /api/trip-requests - Create or update a trip request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    console.log("Finding user by email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error("User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", user.id);
    const body = (await request.json()) as Record<string, unknown>;
    console.log("Trip request data received:", body);
    const {
      id, // If provided, update existing trip request
      type,
      level,
      originCountry,
      originCity,
      paxDetails: paxDetailsRaw,
      tripper: tripperSlug,
    } = body;

    let paxDetailsValue:
      | Prisma.InputJsonValue
      | Prisma.NullableJsonNullValueInput
      | undefined;
    if (hasBodyKey(body, "paxDetails")) {
      if (paxDetailsRaw == null) {
        paxDetailsValue = Prisma.DbNull;
      } else {
        const parsed = parsePaxDetails(paxDetailsRaw);
        if (!parsed) {
          return NextResponse.json(
            { error: "Invalid paxDetails: expected { adults, minors, rooms }" },
            { status: 400 },
          );
        }
        paxDetailsValue = parsed as unknown as Prisma.InputJsonValue;
      }
    }

    // Step 1-2: a client-supplied id that resolves to a row this user owns
    // is always updated directly (partial update), regardless of whether a
    // family-scoped active row also exists.
    const clientId = id ? String(id) : undefined;
    if (clientId) {
      const owned = await prisma.tripRequest.findFirst({
        where: { id: clientId, userId: user.id },
        select: { ...CHECKOUT_PRICE_SELECT, id: true, paxDetails: true, status: true, updatedAt: true,
          payment: { select: { status: true, stripePaymentIntentId: true } } },
      });

      if (owned) {
        const updateData = buildTripRequestPartialUpdate(body, paxDetailsValue);
        const updatesParty = hasBodyKey(body, "pax") || hasBodyKey(body, "paxDetails");
        if (updatesParty || hasBodyKey(body, "type") || hasBodyKey(body, "level")) {
          const provided = parsePaxDetails(paxDetailsValue);
          const requestedPax = hasBodyKey(body, "pax") ? Number(body.pax) : provided ? provided.adults + provided.minors : owned.pax;
          if (!Number.isInteger(requestedPax) || requestedPax < 1 ||
            (provided && provided.adults + provided.minors !== requestedPax)) {
            return NextResponse.json({ error: "Traveler count and party details must agree" }, { status: 400 });
          }
          const party = getCheckoutPaxDetails({ type: String(body.type ?? owned.type), level: String(body.level ?? owned.level),
            pax: requestedPax, paxDetails: paxDetailsValue === undefined ? owned.paxDetails : paxDetailsValue });
          updateData.pax = party.adults + party.minors;
          updateData.paxDetails = { ...party };
        }
        if (updatesParty || hasBodyKey(body, "type") || hasBodyKey(body, "level")) {
          updateData.level = getCheckoutLevel({ type: String(updateData.type ?? owned.type), level: String(updateData.level ?? owned.level),
            pax: Number(updateData.pax ?? owned.pax), paxDetails: updateData.paxDetails ?? owned.paxDetails });
        }
        const priceChanged = checkoutPriceInputsChanged(owned, updateData);
        const nextParty = parsePaxDetails(updateData.paxDetails);
        const partyChanged = nextParty !== null && !paxDetailsEquals(nextParty, owned.paxDetails);
        const guardsCheckout = partyChanged || priceChanged;
        // Even an apparent no-op can overwrite a newer quote's inputs after our
        // read. Version every supplied pricing/party field without needlessly
        // restricting unchanged fields on legitimate nonpayable transitions.
        const guardsVersion = updatesParty || Object.keys(CHECKOUT_PRICE_SELECT).some((key) => hasBodyKey(body, key));
        if (guardsCheckout) {
          if (!["DRAFT", "SAVED", "PENDING_PAYMENT"].includes(owned.status)) {
            return NextResponse.json({ error: "Trip is no longer editable" }, { status: 409 });
          }
          await invalidateCheckoutForEdit(owned.payment, priceChanged);
        }
        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(
            { error: "No fields to update" },
            { status: 400 },
          );
        }
        console.log("Updating trip request:", owned.id);
        const tripRequest = await prisma.tripRequest.update({
          where: { id: owned.id, ...(guardsVersion ? { updatedAt: owned.updatedAt } : {}), ...(guardsCheckout ? {
            payment: { is: owned.payment ? { stripePaymentIntentId: owned.payment.stripePaymentIntentId,
              status: { in: [...RETRYABLE_PAYMENT_STATUSES] } } : null },
            status: { in: [TripRequestStatus.DRAFT, TripRequestStatus.SAVED, TripRequestStatus.PENDING_PAYMENT] } } : {}) },
          data: updateData,
        });
        console.log("Trip request updated:", tripRequest.id);
        return NextResponse.json({ tripRequest }, { status: 200 });
      }

      // Stale/unowned id. Only fall through to family resolution when the
      // body still carries a `type` to resolve a family from — otherwise a
      // partial body (e.g. `{ id, pax, paxDetails }`) could bind onto the
      // wrong family's row. 404 is a strict improvement over the previous
      // uncaught Prisma P2025 → 500.
      if (!type) {
        return NextResponse.json(
          { error: "Trip request not found" },
          { status: 404 },
        );
      }
    }

    // Step 3-4: family resolution + required-field validation.
    if (!type || !level || !originCountry || !originCity) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: type, level, originCountry, originCity",
        },
        { status: 400 },
      );
    }

    const family = tripFamilyOf(type as string);

    // Resolve tripper slug → tripperId. Used only when the active row (if
    // any) doesn't already carry attribution — updates never clobber it.
    let resolvedTripperId: string | null = null;
    if (typeof tripperSlug === "string" && tripperSlug.trim() !== "") {
      const tripperUser = await prisma.user.findFirst({
        where: {
          tripperSlug: tripperSlug.trim(),
          roles: { has: "TRIPPER" },
          isActive: true,
        },
        select: { id: true },
      });
      resolvedTripperId = tripperUser?.id ?? null;
    }

    const fields = await buildTripRequestCreateFields(body, paxDetailsValue);
    const active = await findActiveTripRequest(user.id, family);

    let tripRequest;
    let statusCode: 200 | 201;
    if (active) {
      const updateData = { ...fields, tripperId: active.tripperId ?? resolvedTripperId };
      await invalidateCheckoutForEdit(active.payment, checkoutPriceInputsChanged(active, updateData));
      console.log("Updating active trip request for family:", family, active.id);
      tripRequest = await prisma.tripRequest.update({
        where: { id: active.id, updatedAt: active.updatedAt,
          status: { in: [TripRequestStatus.DRAFT, TripRequestStatus.SAVED, TripRequestStatus.PENDING_PAYMENT] },
          payment: { is: active.payment ? { stripePaymentIntentId: active.payment.stripePaymentIntentId,
            status: { in: [...RETRYABLE_PAYMENT_STATUSES] } } : null } },
        data: updateData,
      });
      statusCode = 200;
    } else {
      console.log("Creating new trip request for user:", user.id);
      tripRequest = await prisma.tripRequest.create({
        data: { userId: user.id, ...fields, tripperId: resolvedTripperId },
      });
      statusCode = 201;
    }
    console.log("Trip request saved:", tripRequest.id);

    // Revalidate XSED pages so soldCount reflects the new/changed booking
    // immediately — fires on both create and a reused row whose
    // experienceId just changed.
    if (tripRequest.type === "xsed") {
      revalidatePath("/es/xsed");
      revalidatePath("/en/xsed");
      revalidatePath("/es/xsed/drops");
      revalidatePath("/en/xsed/drops");
    }

    return NextResponse.json({ tripRequest }, { status: statusCode });
  } catch (error) {
    console.error("Error saving trip request:", error);
    if (error && typeof error === "object" && "status" in error && error.status === 409) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout changed, please retry" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Trip changed, please retry" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
