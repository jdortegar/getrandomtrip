/**
 * Sets every user’s membership to all roles (CLIENT, TRIPPER, ADMIN).
 * Useful for local/dev when everyone should access all surfaces.
 * Run: npx tsx scripts/grant-all-roles-to-all-users.ts
 */
import 'dotenv/config';
import { PrismaClient, type UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ['error'] } : { log: ['error'] }) as object,
);

/** Same order as `uniqSortedRoles` in prismaUserRoles (localeCompare on enum names). */
const ALL_ROLES: UserRole[] = ['ADMIN', 'CLIENT', 'TRIPPER'];

async function main() {
  const result = await prisma.user.updateMany({
    data: { roles: ALL_ROLES },
  });
  console.log(`Updated ${result.count} user(s) with roles: ${ALL_ROLES.join(', ')}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
