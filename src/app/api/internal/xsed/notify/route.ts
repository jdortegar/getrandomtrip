import { NextResponse } from "next/server";
import * as React from "react";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
import XsedDropNotification, {
  subjects as xsedDropNotificationSubjects,
} from "@/emails/XsedDropNotification";
import {
  DROP_DAY_OF_WEEK,
  LOCAL_WINDOW_START_HOUR,
  getUtcOffsetHours,
} from "@/lib/xsed/window";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Timezone matching ────────────────────────────────────────────────────────

function targetUtcOffset(now: Date): number {
  return LOCAL_WINDOW_START_HOUR - 1 - now.getUTCHours();
}

function timezoneMatchesOffset(tz: string, target: number, now: Date): boolean {
  try {
    return Math.round(getUtcOffsetHours(tz, now)) === target;
  } catch {
    return false;
  }
}

// ─── Email content ────────────────────────────────────────────────────────────

function buildEmail(locale: string | null): {
  subject: string;
  react: React.ReactElement;
} {
  const resolvedLocale: "es" | "en" = locale === "en" ? "en" : "es";
  return {
    subject: xsedDropNotificationSubjects[resolvedLocale],
    react: React.createElement(XsedDropNotification, {
      locale: resolvedLocale,
    }),
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const now = new Date();

    // Safety: only run on the correct drop day (bypass with ?force=true for testing)
    if (!force && now.getUTCDay() !== DROP_DAY_OF_WEEK) {
      return NextResponse.json({ skipped: "not drop day" });
    }

    const target = targetUtcOffset(now);

    // Use start-of-today (Sunday) UTC — not a rolling 7-day window — so manual/test
    // runs earlier in the week don't block the production Sunday send.
    const todayUtcMidnight = new Date(now);
    todayUtcMidnight.setUTCHours(0, 0, 0, 0);

    const candidates = await prisma.xsedNotificationSignup.findMany({
      where: {
        OR: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { lt: todayUtcMidnight } },
        ],
      },
      select: { id: true, email: true, locale: true, timezone: true },
    });

    // Match by timezone offset. Null timezone defaults to Argentina (UTC-3).
    const targets = force
      ? candidates
      : candidates.filter((u) => {
          const tz = u.timezone ?? "America/Argentina/Buenos_Aires";
          return timezoneMatchesOffset(tz, target, now);
        });

    if (targets.length === 0) {
      return NextResponse.json({ sent: 0, targetOffset: target });
    }

    // Send emails (sequential to avoid rate limits)
    let sent = 0;
    const notifiedIds: string[] = [];

    for (const user of targets) {
      try {
        const { subject, react } = buildEmail(user.locale);
        await sendMail({ subject, to: user.email, content: { react } });
        notifiedIds.push(user.id);
        sent++;
      } catch (err) {
        console.error(`[xsed/notify] Failed to send to ${user.email}:`, err);
      }
    }

    // Stamp lastNotifiedAt only for successfully sent emails
    if (notifiedIds.length > 0) {
      await prisma.xsedNotificationSignup.updateMany({
        where: { id: { in: notifiedIds } },
        data: { lastNotifiedAt: now },
      });
    }

    console.log(
      `[xsed/notify] offset=${target} sent=${sent}/${targets.length}`,
    );

    return NextResponse.json({
      sent,
      total: targets.length,
      targetOffset: target,
    });
  } catch (err) {
    console.error("[xsed/notify] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
