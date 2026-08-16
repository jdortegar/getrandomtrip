/**
 * One-shot schema delivery script for the `TripperInvite` → `AccessInvite`
 * generalization (design ADR 1).
 *
 * This repository has no Prisma migration history (`prisma/migrations/`
 * contains only `.gitkeep`), so `prisma migrate dev` would detect drift and
 * offer a full database reset. `prisma db push` alone is also unsafe here:
 * renaming `@@map("tripper_invites")` → `@@map("access_invites")` diffs as
 * "drop one table, create another" and would destroy every pending invite.
 *
 * This script runs the physical rename by hand, via idempotent SQL, so that
 * by the time `db:push` runs afterward it only needs to converge (report
 * "already in sync") instead of proposing anything destructive.
 *
 * Every statement here is idempotent — re-running this script after a
 * successful run, or after a partial failure, is always safe.
 *
 * Run: npm run db:rename-access-invites
 *
 * MANDATORY ORDER (see design ADR 1 / Migration Rollout):
 *   1. npm run db:rename-access-invites   (this script)
 *   2. npm run db:push                    — NEVER with --accept-data-loss.
 *      Expect "already in sync". If it proposes any destructive operation,
 *      ABORT — do not force it. That means this script did not apply
 *      correctly against this database.
 *   3. npm run db:generate
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type RenameClient = {
  $executeRawUnsafe: (query: string) => Promise<number>;
};

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

const STATEMENTS = [
  // 1. The discriminator enum. Idempotent via the duplicate_object trap
  //    (CREATE TYPE has no IF NOT EXISTS in PostgreSQL).
  `DO $$ BEGIN
  CREATE TYPE "AccessInviteKind" AS ENUM ('TRIPPER', 'SITE_ACCESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

  // 2. Table rename. ALTER TABLE ... RENAME preserves every row, index and
  //    constraint — it only rewrites the catalog entry. Guarded so a re-run
  //    after a successful rename is a no-op.
  `DO $$ BEGIN
  IF to_regclass('"tripper_invites"') IS NOT NULL
     AND to_regclass('"access_invites"') IS NULL THEN
    ALTER TABLE "tripper_invites" RENAME TO "access_invites";
    -- PostgreSQL does NOT rename dependent indexes/constraints with the table.
    -- Rename them explicitly so \`db push\` sees a converged schema and emits
    -- no follow-up DDL.
    ALTER INDEX "tripper_invites_pkey"          RENAME TO "access_invites_pkey";
    ALTER INDEX "tripper_invites_tokenHash_key" RENAME TO "access_invites_tokenHash_key";
    ALTER INDEX "tripper_invites_email_idx"     RENAME TO "access_invites_email_idx";
  END IF;
END $$;`,

  // 3. Kind column. The DEFAULT backfills every pre-existing row to TRIPPER
  //    in place — PostgreSQL 11+ does this without a table rewrite.
  `ALTER TABLE "access_invites"
  ADD COLUMN IF NOT EXISTS "kind" "AccessInviteKind" NOT NULL DEFAULT 'TRIPPER';`,

  // 4. The gate signal. Nullable, no backfill: nobody is grandfathered in.
  `ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "siteAccessGrantedAt" TIMESTAMP(3);`,
];

export async function renameTripperInvitesToAccessInvites(
  client: RenameClient = prisma as unknown as RenameClient,
): Promise<void> {
  for (const statement of STATEMENTS) {
    await client.$executeRawUnsafe(statement);
  }

  console.log(
    "[rename-tripper-invites-to-access-invites] done — enum created (or already existed), " +
      "table+indexes renamed (or already renamed), kind + siteAccessGrantedAt columns present.",
  );
}

const isMainModule =
  process.argv[1]?.endsWith("rename-tripper-invites-to-access-invites.ts") ??
  false;

if (isMainModule) {
  renameTripperInvitesToAccessInvites()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
