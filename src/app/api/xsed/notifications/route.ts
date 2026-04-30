import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseXsedNotificationBody } from "@/lib/xsed/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseXsedNotificationBody(body);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await prisma.xsedNotificationSignup.upsert({
      create: parsed,
      update: { locale: parsed.locale },
      where: { email: parsed.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[xsed/notifications] POST", error);
    return NextResponse.json(
      { error: "Could not join XSED notifications" },
      { status: 500 },
    );
  }
}
