import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseNotificationAudience } from "@/lib/notifications/list-query";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audience = parseNotificationAudience(
    request.nextUrl.searchParams.get("audience"),
  );

  // A missing/invalid audience must 400, not silently default to one role —
  // this is a write endpoint; a defaulted mutation could mark the wrong
  // role's notifications read (D6).
  if (!audience) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  // Scoped by userId + audience only — never by id — so it reaches every
  // unread row for that audience, including rows never loaded onto the
  // client's current page.
  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, audience, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ count });
}
