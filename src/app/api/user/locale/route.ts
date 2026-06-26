import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const locale = (body as Record<string, unknown>)?.locale;

  if (locale !== "es" && locale !== "en") {
    return NextResponse.json({ error: "invalid_locale" }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  return NextResponse.json({ locale });
}
