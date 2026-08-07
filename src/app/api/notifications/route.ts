import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  NOTIFICATIONS_MAX_LIMIT,
  NOTIFICATIONS_PAGE_SIZE,
  notificationListWhere,
  parseNotificationAudience,
  parseNotificationStatus,
  toClientNotification,
} from "@/lib/notifications/list-query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = parseNotificationStatus(searchParams.get("status"));
  const audience = parseNotificationAudience(searchParams.get("audience"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    NOTIFICATIONS_MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit")) || NOTIFICATIONS_PAGE_SIZE),
  );

  const where = notificationListWhere({ userId: session.user.id, audience, status });

  const [rows, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: notificationListWhere({
        userId: session.user.id,
        audience,
        status: "unread",
      }),
    }),
  ]);

  return NextResponse.json({
    notifications: rows.map(toClientNotification),
    total,
    unreadTotal,
    page,
    limit,
  });
}
