import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const audienceParam = searchParams.get("audience");
  const audience =
    audienceParam === "CLIENT" || audienceParam === "TRIPPER"
      ? audienceParam
      : "TRIPPER";

  try {
    const count = await prisma.notification.count({
      where: { audience, isRead: false, userId: session.user.id },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
