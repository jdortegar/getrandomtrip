import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { isGateEnabled } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

/**
 * Maintenance status for the proxy (`src/proxy.ts`), which cannot query the
 * database itself. `staff` is true only while maintenance is on and the
 * caller's session belongs to an admin. Reveals nothing beyond those two
 * booleans.
 */
export async function GET() {
  const maintenance = await isGateEnabled();
  let staff = false;
  if (maintenance) {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (id) {
      const user = await prisma.user.findUnique({
        select: { id: true, roles: true },
        where: { id },
      });
      staff = !!user && hasRoleAccess(user, "admin");
    }
  }
  return NextResponse.json(
    { maintenance, staff },
    { headers: { "cache-control": "no-store" } },
  );
}
