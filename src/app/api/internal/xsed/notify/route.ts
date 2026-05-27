import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
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

// ─── Email templates ──────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com";

function buildEmail(locale: string | null): { subject: string; html: string } {
  const isEs = locale !== "en";

  const subject = isEs
    ? "¡Tu XSED abre en 30 minutos!"
    : "Your XSED opens in 30 minutes!";

  const html = isEs
    ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#D97E4A;margin:0 0 12px">XSED · Drop semanal</p>
        <h1 style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 16px">
          La ventana abre<br/>en 30 minutos.
        </h1>
        <p style="font-size:16px;color:#555;margin:0 0 28px;line-height:1.6">
          Los lugares se agotan rápido. Este domingo de 16 a 20hs podés reservar tu XSED — 1 noche, destino sorpresa, experiencia local.
        </p>
        <a href="${SITE_URL}/es/xsed" style="display:inline-block;background:#D97E4A;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">
          Ir al drop →
        </a>
        <p style="font-size:12px;color:#999;margin-top:40px">
          Te enviamos este email porque te anotaste para recibir novedades de XSED.<br/>
          <a href="${SITE_URL}/es/xsed" style="color:#999">Desuscribirse</a>
        </p>
      </div>
    `
    : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#D97E4A;margin:0 0 12px">TGIS · Weekly Drop</p>
        <h1 style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 16px">
          The window opens<br/>in 30 minutes.
        </h1>
        <p style="font-size:16px;color:#555;margin:0 0 28px;line-height:1.6">
          Spots go fast. This Sunday from 4pm to 8pm you can book your XSED — 1 night, surprise destination, local experience.
        </p>
        <a href="${SITE_URL}/en/xsed" style="display:inline-block;background:#D97E4A;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">
          Go to the drop →
        </a>
        <p style="font-size:12px;color:#999;margin-top:40px">
          You received this email because you signed up for XSED notifications.<br/>
          <a href="${SITE_URL}/en/xsed" style="color:#999">Unsubscribe</a>
        </p>
      </div>
    `;

  return { subject, html };
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
      OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: todayUtcMidnight } }],
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
      const { subject, html } = buildEmail(user.locale);
      await sendMail({ subject, to: user.email, content: { html } });
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

  console.log(`[xsed/notify] offset=${target} sent=${sent}/${targets.length}`);

  return NextResponse.json({ sent, total: targets.length, targetOffset: target });
  } catch (err) {
    console.error("[xsed/notify] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
