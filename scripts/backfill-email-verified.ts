/**
 * One-time backfill for `User.emailVerified`:
 * - OAuth-only accounts (`password IS NULL`) → `emailVerified = now` (Google
 *   already proved the email; these accounts predate this column).
 * - Credential accounts (`password IS NOT NULL`) → `emailVerified = null`
 *   (must go through the new verification flow).
 *
 * The OAuth branch is genuinely idempotent (only touches rows still unset).
 * The credential branch is NOT scoped by current `emailVerified` state — it
 * unconditionally resets every credential user to unverified. Re-running
 * this script after go-live (once real users have verified themselves
 * through the normal flow) would silently UN-verify them again.
 *
 * DANGER: do not re-run after users start verifying — a re-run safety guard
 * aborts automatically if any credential user is already verified, unless
 * `--force` is passed explicitly.
 *
 * Sends no email. Run: npm run db:backfill-email-verified
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type BackfillClient = {
  user: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
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

/**
 * Runs the emailVerified backfill against the given Prisma client (defaults
 * to a real connected client). Exported so it can be unit-tested with a mock
 * client without touching a real database.
 */
export async function backfillEmailVerified(
  client: BackfillClient = prisma as unknown as BackfillClient,
  force: boolean = process.argv.includes("--force"),
): Promise<
  | { aborted: true }
  | {
      aborted: false;
      oauthUpdated: { count: number };
      credentialUpdated: { count: number };
    }
> {
  const alreadyVerifiedCredentialCount = await client.user.count({
    where: { password: { not: null }, emailVerified: { not: null } },
  });

  if (alreadyVerifiedCredentialCount > 0 && !force) {
    console.warn(
      `[backfill-email-verified] ABORTED: ${alreadyVerifiedCredentialCount} credential user(s) already have emailVerified set — this looks like the app is already live and users have verified through the normal flow. Re-running this one-time backfill would silently UN-verify them. Pass --force to override if you are certain this must run again.`,
    );
    return { aborted: true };
  }

  const oauthBefore = await client.user.count({
    where: { password: null, emailVerified: { not: null } },
  });
  const oauthUpdated = await client.user.updateMany({
    where: { password: null, emailVerified: null },
    data: { emailVerified: new Date() },
  });
  const oauthAfter = await client.user.count({
    where: { password: null, emailVerified: { not: null } },
  });

  const credentialBefore = await client.user.count({
    where: { password: { not: null }, emailVerified: null },
  });
  const credentialUpdated = await client.user.updateMany({
    where: { password: { not: null } },
    data: { emailVerified: null },
  });
  const credentialAfter = await client.user.count({
    where: { password: { not: null }, emailVerified: null },
  });

  console.log(
    `[backfill-email-verified] oauth: matched=${oauthUpdated.count} verified before=${oauthBefore} after=${oauthAfter}`,
  );
  console.log(
    `[backfill-email-verified] credential: matched=${credentialUpdated.count} unverified before=${credentialBefore} after=${credentialAfter}`,
  );

  return { aborted: false, oauthUpdated, credentialUpdated };
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-email-verified.ts") ?? false;

if (isMainModule) {
  backfillEmailVerified()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
