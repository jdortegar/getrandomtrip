/**
 * One-time backfill for `User.tripperSince`:
 * sets it to now() for every existing tripper (roles has TRIPPER) whose
 * tripperSince is still null — their true grant date is unrecoverable, so
 * "now" is the honest starting point going forward. Every new TRIPPER grant
 * (invite acceptance, admin grant, self-service settings save) already sets
 * this field at grant time — this script only covers the ones that predate
 * that field existing.
 *
 * Fully idempotent: scoped to `tripperSince: null`, so re-running it is a
 * no-op once every existing tripper has been backfilled.
 *
 * Run: npm run db:backfill-tripper-since
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type BackfillClient = {
  user: {
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

export async function backfillTripperSince(
  client: BackfillClient = prisma as unknown as BackfillClient,
): Promise<{ count: number }> {
  const result = await client.user.updateMany({
    where: { roles: { has: "TRIPPER" }, tripperSince: null },
    data: { tripperSince: new Date() },
  });

  console.log(
    `[backfill-tripper-since] set tripperSince for ${result.count} existing tripper(s)`,
  );

  return result;
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-tripper-since.ts") ?? false;

if (isMainModule) {
  backfillTripperSince()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
