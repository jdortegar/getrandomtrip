import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseNotificationAudience,
  toClientNotification,
} from "@/lib/notifications/list-query";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audience = parseNotificationAudience(
    request.nextUrl.searchParams.get("audience"),
  );

  if (!audience) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const { id } = await props.params;

  // No side effects — this must never alter read state. Scoped by both
  // userId and audience so a foreign or wrong-audience id reads as missing.
  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id, audience },
  });

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    notification: toClientNotification(notification),
  });
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  // Ownership scoping lives inside the `where` itself — not a post-fetch
  // comparison — so `count === 0` cleanly means "missing or not yours"
  // without confirming to the caller that someone else's id exists.
  const { count } = await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
