/**
 * One-time backfill: repoints every existing RANDOMTRIP-sourced Experience
 * and BlogPost row to the "RandomTrip" pseudo-user (see
 * seed-randomtrip-user.ts) instead of whichever admin account created it.
 *
 * Two steps per model, in order:
 *   1. Where createdById is still null, set it to the row's current
 *      owner/author — preserves "who really created this" before that field
 *      gets overwritten.
 *   2. Set owner/author to the RandomTrip user id for every RANDOMTRIP row.
 *
 * Idempotent: safe to re-run — step 1 only touches null createdById rows,
 * step 2 sets the same value again on rows already pointing at RandomTrip.
 *
 * Run: npx tsx scripts/backfill-randomtrip-ownership.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedRandomtripUser } from "./seed-randomtrip-user";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

export async function backfillRandomtripOwnership(client: PrismaClient = prisma) {
  const randomtripUser = await seedRandomtripUser(client);
  const rtId = randomtripUser.id;

  // --- Experience ---
  const experiencesMissingCreatedBy = await client.experience.findMany({
    where: { source: "RANDOMTRIP", createdById: null },
    select: { id: true, ownerId: true },
  });
  for (const exp of experiencesMissingCreatedBy) {
    await client.experience.update({
      where: { id: exp.id },
      data: { createdById: exp.ownerId },
    });
  }
  console.log(
    `[backfill-randomtrip-ownership] experience.createdById backfilled=${experiencesMissingCreatedBy.length}`,
  );

  const experienceRepoint = await client.experience.updateMany({
    where: { source: "RANDOMTRIP", ownerId: { not: rtId } },
    data: { ownerId: rtId },
  });
  console.log(
    `[backfill-randomtrip-ownership] experience.ownerId repointed=${experienceRepoint.count}`,
  );

  // --- BlogPost ---
  const blogsMissingCreatedBy = await client.blogPost.findMany({
    where: { source: "RANDOMTRIP", createdById: null },
    select: { id: true, authorId: true },
  });
  for (const blog of blogsMissingCreatedBy) {
    await client.blogPost.update({
      where: { id: blog.id },
      data: { createdById: blog.authorId },
    });
  }
  console.log(
    `[backfill-randomtrip-ownership] blogPost.createdById backfilled=${blogsMissingCreatedBy.length}`,
  );

  const blogRepoint = await client.blogPost.updateMany({
    where: { source: "RANDOMTRIP", authorId: { not: rtId } },
    data: { authorId: rtId },
  });
  console.log(
    `[backfill-randomtrip-ownership] blogPost.authorId repointed=${blogRepoint.count}`,
  );

  return { randomtripUserId: rtId };
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-randomtrip-ownership.ts") ?? false;

if (isMainModule) {
  backfillRandomtripOwnership()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
