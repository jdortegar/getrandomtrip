/**
 * Backfill for the email campaigns rollout (odd/tasks/email-campaigns.md,
 * T3): creates one WAITLIST `Contact` per `WaitlistEntry` that has none yet.
 *
 * - Email is normalized (trim + lowercase); entries colliding after
 *   normalization produce one contact.
 * - Name is "name lastName"; `createdAt` is copied from the entry so the
 *   admin list keeps signup order.
 * - `userId` links the account whose email matches case-insensitively.
 * - Idempotent: an existing contact is never modified (its source, status and
 *   locale stay as they are) and `createMany` skips duplicates.
 *
 * Modes (dry-run is the default; forgetting a flag never writes):
 *   npm run db:backfill-waitlist-contacts             # plan summary only
 *   npm run db:backfill-waitlist-contacts -- --apply  # write
 */
import { withPrisma } from "./lib/withPrisma";
import {
  DEFAULT_CONTACT_LOCALE,
  normalizeContactEmail,
  waitlistDisplayName,
} from "../src/lib/email-campaigns/contactRules";

const LOG_PREFIX = "[backfill-waitlist-contacts]";

export type BackfillMode = "dry-run" | "apply";

export interface WaitlistEntryRow {
  email: string;
  name: string | null;
  lastName: string | null;
  createdAt: Date;
}

export interface UserEmailRow {
  id: string;
  email: string;
}

export interface PlannedContact {
  email: string;
  name: string | null;
  userId: string | null;
  createdAt: Date;
}

export interface WaitlistContactBackfillReport {
  entries: number;
  created: number;
  skipped: number;
}

export interface WaitlistContactBackfillPlan {
  create: PlannedContact[];
  report: WaitlistContactBackfillReport;
}

/** Pure planner: no I/O. */
export function planWaitlistContactBackfill(
  entries: WaitlistEntryRow[],
  existing: { contactEmails: string[]; users: UserEmailRow[] },
): WaitlistContactBackfillPlan {
  const taken = new Set(existing.contactEmails.map(normalizeContactEmail));
  const userIdByEmail = new Map<string, string>();
  for (const user of existing.users) {
    const key = normalizeContactEmail(user.email);
    if (!userIdByEmail.has(key)) userIdByEmail.set(key, user.id);
  }

  const create: PlannedContact[] = [];
  for (const entry of entries) {
    const email = normalizeContactEmail(entry.email);
    if (taken.has(email)) continue;
    taken.add(email);
    create.push({
      email,
      name: waitlistDisplayName(entry.name, entry.lastName),
      userId: userIdByEmail.get(email) ?? null,
      createdAt: entry.createdAt,
    });
  }

  return {
    create,
    report: {
      entries: entries.length,
      created: create.length,
      skipped: entries.length - create.length,
    },
  };
}

type Logger = Pick<Console, "log">;

/** Minimal client surface so the runner is testable without a database. */
export interface BackfillClient {
  waitlistEntry: {
    findMany(args: {
      select: { email: true; name: true; lastName: true; createdAt: true };
      orderBy: { createdAt: "asc" };
    }): Promise<WaitlistEntryRow[]>;
  };
  contact: {
    findMany(args: { select: { email: true } }): Promise<{ email: string }[]>;
    createMany(args: {
      data: (PlannedContact & { source: "WAITLIST"; locale: string })[];
      skipDuplicates: boolean;
    }): Promise<{ count: number }>;
  };
  user: {
    findMany(args: {
      select: { id: true; email: true };
      where: { email: { in: string[]; mode: "insensitive" } };
    }): Promise<UserEmailRow[]>;
  };
}

export async function runWaitlistContactBackfill(
  client: BackfillClient,
  mode: BackfillMode,
  logger: Logger = console,
): Promise<WaitlistContactBackfillPlan> {
  const [entries, contacts] = await Promise.all([
    client.waitlistEntry.findMany({
      select: { email: true, name: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    client.contact.findMany({ select: { email: true } }),
  ]);
  const users = await client.user.findMany({
    select: { id: true, email: true },
    where: {
      email: {
        in: entries.map((entry) => normalizeContactEmail(entry.email)),
        mode: "insensitive",
      },
    },
  });

  const plan = planWaitlistContactBackfill(entries, {
    contactEmails: contacts.map((contact) => contact.email),
    users,
  });

  logger.log(`${LOG_PREFIX} mode: ${mode}`);
  logger.log(`${LOG_PREFIX} waitlist entries: ${plan.report.entries}`);
  logger.log(`${LOG_PREFIX} contacts to create: ${plan.report.created}`);
  logger.log(`${LOG_PREFIX} skipped (contact exists): ${plan.report.skipped}`);

  if (mode === "dry-run") {
    logger.log(
      `${LOG_PREFIX} DRY RUN — nothing written. Re-run with --apply to write.`,
    );
    return plan;
  }

  const { count } =
    plan.create.length === 0
      ? { count: 0 }
      : await client.contact.createMany({
          data: plan.create.map((contact) => ({
            ...contact,
            source: "WAITLIST" as const,
            locale: DEFAULT_CONTACT_LOCALE,
          })),
          skipDuplicates: true,
        });
  logger.log(`${LOG_PREFIX} created: ${count}`);

  return {
    create: plan.create,
    report: {
      entries: plan.report.entries,
      created: count,
      skipped: plan.report.entries - count,
    },
  };
}

// ── CLI entrypoint ──────────────────────────────────────────────────────

export function parseBackfillMode(args: string[]): BackfillMode {
  return args.includes("--apply") ? "apply" : "dry-run";
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-waitlist-contacts.ts") ?? false;

if (isMainModule) {
  const mode = parseBackfillMode(process.argv.slice(2));
  withPrisma((client) =>
    runWaitlistContactBackfill(client as unknown as BackfillClient, mode),
  ).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
