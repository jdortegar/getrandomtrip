import { NextResponse } from "next/server";
import type { TripRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { countryToTimezone } from "@/lib/xsed/country-tz";
import { computeDisplayedSold, countCountryTrips } from "@/lib/xsed/soldCount";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

// Preserve the existing booking-status semantics, including unpaid checkout.
const SOLD_STATUSES: TripRequestStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const country =
    new URL(req.url).searchParams.get("country")?.trim().toUpperCase() ?? "";
  if (!countryToTimezone(country)) {
    return NextResponse.json(
      { error: "Unsupported country" },
      { headers, status: 400 },
    );
  }
  const { slug } = await params;
  const now = new Date();

  const experience = await prisma.experience.findUnique({
    where: { slug },
    select: {
      maxSpots: true,
      tripRequests: {
        where: { status: { in: SOLD_STATUSES } },
        select: { originCountry: true },
      },
    },
  });

  if (!experience) {
    return NextResponse.json({ error: "Not found" }, { headers, status: 404 });
  }

  const totalSlots = experience.maxSpots ?? 10;
  const realCount = countCountryTrips(experience.tripRequests, country);

  const displayedSold = computeDisplayedSold(
    realCount,
    totalSlots,
    country,
    now,
  );

  return NextResponse.json(
    {
      country,
      displayedSold,
      isSoldOut: displayedSold >= totalSlots,
      totalSlots,
    },
    { headers },
  );
}
