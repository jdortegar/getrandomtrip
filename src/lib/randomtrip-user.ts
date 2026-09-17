import { prisma } from "@/lib/prisma";

export const RANDOMTRIP_USER_EMAIL = "randomtrip@getrandomtrip.com";

let cachedId: string | null = null;

/**
 * Resolves the "RandomTrip" pseudo-user id — the owner/author of every
 * RANDOMTRIP-sourced Experience/BlogPost, regardless of which admin created
 * it (see scripts/seed-randomtrip-user.ts). Cached per server instance since
 * this row is effectively immutable.
 */
export async function getRandomtripUserId(): Promise<string> {
  if (cachedId) return cachedId;
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: RANDOMTRIP_USER_EMAIL },
    select: { id: true },
  });
  cachedId = user.id;
  return cachedId;
}
