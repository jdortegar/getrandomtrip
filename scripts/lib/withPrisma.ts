import type { PrismaClient } from "@prisma/client";

/** CLI-only boundary: importing a backfill never loads env files or a client. */
export async function withPrisma<T>(
  run: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  await import("dotenv/config");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is required to run this script");

  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error"],
  });
  try {
    return await run(client);
  } finally {
    await client.$disconnect();
  }
}
