/**
 * One-time seed: creates (or verifies) the "Randomtrip" pseudo-user — the
 * account that owns all RANDOMTRIP-sourced Experience and BlogPost rows,
 * instead of whichever admin happened to click "create". This decouples
 * brand-owned content from any individual admin's account lifecycle (both
 * Experience.owner and BlogPost.author cascade-delete their content today).
 *
 * `password: null` mirrors how Google-created accounts already work in this
 * app — no credential means no credentials-based login is possible.
 *
 * Idempotent: safe to re-run — upserts by email.
 *
 * Run: npx tsx scripts/seed-randomtrip-user.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const RANDOMTRIP_USER_EMAIL = "randomtrip@getrandomtrip.com";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

export async function seedRandomtripUser(client: PrismaClient = prisma) {
  const user = await client.user.upsert({
    where: { email: RANDOMTRIP_USER_EMAIL },
    update: {},
    create: {
      email: RANDOMTRIP_USER_EMAIL,
      name: "Randomtrip",
      password: null,
      roles: ["ADMIN"],
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, roles: true },
  });

  console.log(`[seed-randomtrip-user] id=${user.id} email=${user.email}`);
  return user;
}

const isMainModule =
  process.argv[1]?.endsWith("seed-randomtrip-user.ts") ?? false;

if (isMainModule) {
  seedRandomtripUser()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
