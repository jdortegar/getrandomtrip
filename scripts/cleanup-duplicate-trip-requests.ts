/**
 * One-off cleanup for historical duplicate non-terminal `TripRequest` rows —
 * pre-dates the single-active-trip-request invariant now enforced at
 * runtime by `POST /api/trip-requests` (see `src/lib/db/tripRequest.ts`).
 *
 * For every `userId` + product family (journey vs xsed) with more than one
 * non-terminal (`DRAFT`/`SAVED`/`PENDING_PAYMENT`) row, keeps the row with
 * the most recent `updatedAt` and sets every other row in the group to
 * `CANCELLED`. Reuses the exact same `tripFamilyOf` / `NON_TERMINAL_TRIP_STATUSES`
 * predicates the runtime enforces, so this script and the running app agree
 * on which row is "the active one" — no duplicated logic to drift.
 *
 * DRY-RUN IS THE DEFAULT. Pass `--apply` to actually write.
 *
 * Idempotent: a second run finds at most one non-terminal row per bucket and
 * cancels nothing. Gotcha: `updatedAt` is `@updatedAt`, so the cancellation
 * write re-stamps the cancelled rows — the survivor selection is computed
 * from the pre-write `findMany` snapshot (it always is, by construction).
 *
 * Run: npm run db:cleanup-duplicate-trips           (dry run)
 *      npm run db:cleanup-duplicate-trips -- --apply (writes)
 */
import "dotenv/config";
import { PrismaClient, TripRequestStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { NON_TERMINAL_TRIP_STATUSES, tripFamilyOf } from "@/lib/db/tripRequest";

type TripRow = {
  id: string;
  userId: string;
  type: string;
  status: TripRequestStatus;
  updatedAt: Date;
};

type CleanupClient = {
  tripRequest: {
    findMany: (args: {
      where: { status: { in: readonly TripRequestStatus[] } };
      select: {
        id: true;
        userId: true;
        type: true;
        status: true;
        updatedAt: true;
      };
      orderBy: { updatedAt: "desc" };
    }) => Promise<TripRow[]>;
    updateMany: (args: {
      where: {
        id: { in: string[] };
        status: { in: readonly TripRequestStatus[] };
      };
      data: { status: TripRequestStatus };
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

export async function cleanupDuplicateTripRequests(
  client: CleanupClient = prisma as unknown as CleanupClient,
  dryRun: boolean = !process.argv.includes("--apply"),
): Promise<{
  dryRun: boolean;
  groups: number;
  kept: string[];
  cancelled: string[];
}> {
  const rows = await client.tripRequest.findMany({
    where: { status: { in: NON_TERMINAL_TRIP_STATUSES } },
    select: { id: true, userId: true, type: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const buckets = new Map<string, TripRow[]>();
  for (const row of rows) {
    const key = `${row.userId}::${tripFamilyOf(row.type)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      buckets.set(key, [row]);
    }
  }

  const kept: string[] = [];
  const cancelled: string[] = [];
  let groups = 0;

  for (const [key, bucket] of buckets) {
    // `rows` came back `orderBy: { updatedAt: "desc" }`, so the head of each
    // bucket (in insertion order) is already the newest — the survivor.
    const [survivor, ...rest] = bucket;
    kept.push(survivor.id);

    if (rest.length === 0) continue;

    groups += 1;
    const cancelledIds = rest.map((row) => row.id);
    cancelled.push(...cancelledIds);

    console.log(
      `[cleanup-duplicate-trip-requests] ${key}: kept=${survivor.id} cancelled=[${cancelledIds.join(", ")}]`,
    );
  }

  if (cancelled.length > 0) {
    // This log line IS the backup the rollback plan requires — paste-able
    // into a manual restore (updateMany back to SAVED) if needed.
    console.log(
      `[cleanup-duplicate-trip-requests] full cancelled-id list: [${cancelled.join(", ")}]`,
    );
  }

  if (dryRun) {
    console.log(
      "[cleanup-duplicate-trip-requests] DRY RUN — no rows written. Re-run with --apply.",
    );
    return { dryRun, groups, kept, cancelled };
  }

  if (cancelled.length > 0) {
    // Status re-check guards against a row that reached CONFIRMED between
    // the read above and this write (e.g. a concurrent webhook).
    await client.tripRequest.updateMany({
      where: { id: { in: cancelled }, status: { in: NON_TERMINAL_TRIP_STATUSES } },
      data: { status: TripRequestStatus.CANCELLED },
    });
  }

  return { dryRun, groups, kept, cancelled };
}

const isMainModule =
  process.argv[1]?.endsWith("cleanup-duplicate-trip-requests.ts") ?? false;

if (isMainModule) {
  cleanupDuplicateTripRequests()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
