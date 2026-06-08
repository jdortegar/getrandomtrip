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
  const audience = searchParams.get("audience");

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(audience === "CLIENT" || audience === "TRIPPER" ? { audience } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}
