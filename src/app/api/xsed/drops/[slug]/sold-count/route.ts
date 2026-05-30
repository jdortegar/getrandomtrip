import { NextResponse } from "next/server";
import type { TripRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DROP_DAY_OF_WEEK, LOCAL_WINDOW_START_HOUR } from "@/lib/xsed/window";

const SOLD_STATUSES: TripRequestStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
];

// Buenos Aires (UTC-3) is the anchor timezone — window open UTC = local start + 3
const WINDOW_OPEN_UTC_HOUR = (LOCAL_WINDOW_START_HOUR + 3) % 24;

function getWindowOpenAt(now: Date): Date {
  const d = new Date(now);
  const daysBack = (d.getUTCDay() - DROP_DAY_OF_WEEK + 7) % 7;
  d.setUTCDate(d.getUTCDate() - daysBack);
  d.setUTCHours(WINDOW_OPEN_UTC_HOUR, 0, 0, 0);
  // If the computed open time is still in the future, the window opened last week
  if (d > now) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

function computeDisplayedSold(
  realCount: number,
  totalSlots: number,
  windowOpenAt: Date,
): number {
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - windowOpenAt.getTime());
  const autoIncrements = Math.floor(elapsedMs / (20 * 60 * 1000));
  return Math.min(totalSlots, realCount + autoIncrements);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const now = new Date();

  const experience = await prisma.experience.findUnique({
    where: { slug },
    select: {
      maxSpots: true,
      _count: {
        select: {
          tripRequests: { where: { status: { in: SOLD_STATUSES } } },
        },
      },
    },
  });

  if (!experience) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalSlots = experience.maxSpots ?? 10;
  const realCount = experience._count.tripRequests;
  const windowOpenAt = getWindowOpenAt(now);

  const displayedSold = computeDisplayedSold(
    realCount,
    totalSlots,
    windowOpenAt,
  );

  return NextResponse.json({
    displayedSold,
    isSoldOut: displayedSold >= totalSlots,
    totalSlots,
  });
}
