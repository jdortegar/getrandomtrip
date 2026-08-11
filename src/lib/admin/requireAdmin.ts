import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export type AdminAuthResult =
  | { ok: false; errorResponse: NextResponse }
  | { ok: true; adminId: string };

/**
 * Extracted `hasRoleAccess(caller, "admin")` shape, used by the new
 * trip-fulfillment-documents routes only (existing admin routes keep their
 * own inline copies to avoid unrelated churn). Admin membership is
 * `User.roles[]` — never `role === "ADMIN"` (Resolved Decision #1).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  if (!caller || !hasRoleAccess(caller, "admin")) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, adminId: session.user.id };
}
