import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseNotificationAudience } from "@/lib/notifications/list-query";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  const rawBody = await request.text();
  let isRead = true;

  if (rawBody) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "isRead" in parsed
    ) {
      const value = (parsed as { isRead: unknown }).isRead;
      if (typeof value !== "boolean") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      isRead = value;
    }
  }

  const audience = parseNotificationAudience(
    request.nextUrl.searchParams.get("audience"),
  );

  const { count } = await prisma.notification.updateMany({
    where: { id, userId: session.user.id, ...(audience && { audience }) },
    data: { isRead },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, isRead });
}
