import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AiServiceError, aiService } from "@/lib/ai/aiService";
import { parseTranslationRequest, TranslationRequestError } from "@/lib/ai/translationRequest";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  if (!caller || !hasRoleAccess(caller, "tripper")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let translation;
  try {
    translation = parseTranslationRequest(body);
  } catch (error) {
    if (error instanceof TranslationRequestError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    throw error;
  }

  try {
    const texts = await aiService.translate(translation.pieces, translation.target);
    return NextResponse.json({ texts });
  } catch (error) {
    const status = error instanceof AiServiceError ? error.status : 502;
    return NextResponse.json({ error: "Could not translate" }, { status });
  }
}
