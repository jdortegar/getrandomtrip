import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: true }
          : false,
    })
  : undefined;
const adapter = pool ? new PrismaPg(pool) : undefined;

const clientOptions = {
  ...(adapter && { adapter }),
  log:
    process.env.NODE_ENV === "development" && false
      ? ["query", "error", "warn"]
      : ["error"],
} as unknown as ConstructorParameters<typeof PrismaClient>[0];
export const prisma = globalForPrisma.prisma ?? new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
