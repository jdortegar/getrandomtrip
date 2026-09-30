/**
 * One-time backfill: retags every existing `Experience` row where
 * `type` contains `"XSED"` to `source: "RANDOMTRIP"`.
 *
 * Uses Prisma's exact array-element match (`has: "XSED"`, equivalent to
 * `'XSED' = ANY(type)`), so it never matches on substrings.
 *
 * Idempotent: safe to re-run — rows already tagged `RANDOMTRIP` are simply
 * set to the same value again.
 *
 * Run: npm run db:backfill-source
 */
import { withPrisma } from "./lib/withPrisma";

type BackfillClient = {
  experience: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

/**
 * Runs the XSED → RANDOMTRIP backfill against the supplied Prisma client.
 * Exported so it can be unit-tested without touching a real database.
 */
export async function backfillExperienceSource(client: BackfillClient) {
  const beforeCount = await client.experience.count({
    where: { type: { has: "XSED" }, source: "RANDOMTRIP" },
  });

  const result = await client.experience.updateMany({
    where: { type: { has: "XSED" } },
    data: { source: "RANDOMTRIP" },
  });

  const afterCount = await client.experience.count({
    where: { type: { has: "XSED" }, source: "RANDOMTRIP" },
  });

  console.log(
    `[backfill-experience-source] matched=${result.count} source=RANDOMTRIP count before=${beforeCount} after=${afterCount}`,
  );

  return result;
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-experience-source.ts") ?? false;

if (isMainModule) {
  withPrisma((client) =>
    backfillExperienceSource(client as unknown as BackfillClient),
  ).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
