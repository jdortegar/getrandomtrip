/**
 * Local stand-in for the hourly split-payment job (`/api/internal/split-payment-deadline`
 * only runs in production), so the deadline, top-up and remainder steps can be
 * tested on a developer machine without waiting days.
 *
 * DRY RUN BY DEFAULT: lists INDIVIDUAL trips with their state and deadlines and
 * changes nothing. `--trip <id>` runs, for that one trip, every step that is due
 * at `--now` (default: the real time), using the job's own functions:
 *   - COLLECTING past `paymentDeadline` → confirm, drop non-payers, create top-ups
 *   - COLLECTING before it              → re-send invites that never went out
 *   - top-up grace in its last 24 h     → one reminder per unpaid top-up
 *   - top-up grace past `topUpDeadline` → fold unpaid top-ups into the organizer remainder
 * The local `.env` points at the SHARED develop database, so only one trip is
 * ever touched. Refused unless RT_DEPLOY_ENV=nonproduction with Stripe test keys.
 *
 *   npx tsx scripts/split-payments-tick.ts                                # dry run
 *   npx tsx scripts/split-payments-tick.ts --trip <id> --now 2026-11-02T12:00:00Z
 *
 * Tip: run it twice — once past the payment deadline, then again past the
 * printed `topUpDeadline` — to walk the whole flow.
 */

export interface TickArgs {
  tripId: string | null;
  now: Date;
}

/** Parses `--trip <id>` and `--now <ISO>`; throws on anything else. */
export function parseTickArgs(argv: string[], realNow = new Date()): TickArgs {
  let tripId: string | null = null;
  let now = realNow;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--trip" && value) {
      tripId = value;
      i++;
    } else if (flag === "--now" && value) {
      now = new Date(value);
      if (Number.isNaN(now.getTime())) throw new Error(`Invalid --now: ${value}`);
      i++;
    } else {
      throw new Error(`Unknown argument: ${flag}. Use --trip <id> [--now <ISO>].`);
    }
  }
  return { tripId, now };
}

/** Refuses anything but a nonproduction runtime with a Stripe test (secret or restricted) key. */
export function assertLocalTestEnvironment(env: Record<string, string | undefined>): void {
  if (env.RT_DEPLOY_ENV !== "nonproduction") {
    throw new Error("Refusing to run: set RT_DEPLOY_ENV=nonproduction (this tick is for local testing only).");
  }
  const key = env.STRIPE_SECRET_KEY ?? "";
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("Refusing to run: STRIPE_SECRET_KEY must be a Stripe test key (sk_test_... or rk_test_...).");
  }
}

async function main() {
  await import("dotenv/config");
  const args = parseTickArgs(process.argv.slice(2));
  assertLocalTestEnvironment(process.env);
  // App modules load only after the guard: they construct the Prisma client,
  // which itself refuses any host but RT_NONPRODUCTION_DATABASE_HOST.
  const { prisma } = await import("../src/lib/prisma");
  const passes = await import("../src/app/api/internal/split-payment-deadline/passes");
  const { inviteSplitCompanions } = await import("../src/lib/db/payment");
  try {
    await tick(args, prisma, passes, inviteSplitCompanions);
  } finally {
    await prisma.$disconnect();
  }
}

async function tick(
  args: TickArgs,
  prisma: typeof import("../src/lib/prisma").prisma,
  passes: typeof import("../src/app/api/internal/split-payment-deadline/passes"),
  inviteSplitCompanions: (tripId: string) => Promise<void>,
) {
  if (!args.tripId) {
    const trips = await prisma.tripRequest.findMany({
      where: { paymentMode: "INDIVIDUAL" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, status: true, pax: true, paymentDeadline: true, topUpDeadline: true },
    });
    console.log(`INDIVIDUAL trips (now = ${args.now.toISOString()}):`);
    console.table(trips.map((t) => ({
      id: t.id,
      status: t.status,
      pax: t.pax,
      paymentDeadline: t.paymentDeadline?.toISOString() ?? "—",
      topUpDeadline: t.topUpDeadline?.toISOString() ?? "—",
    })));
    console.log("Dry run. Re-run with --trip <id> [--now <ISO>] to process one trip.");
    return;
  }

  const trip = await prisma.tripRequest.findUnique({
    where: { id: args.tripId },
    select: { id: true, paymentMode: true, status: true, paymentDeadline: true, topUpDeadline: true },
  });
  if (!trip) throw new Error(`Trip ${args.tripId} not found`);
  if (trip.paymentMode !== "INDIVIDUAL") throw new Error(`Trip ${trip.id} is not paid individually`);
  const now = args.now;
  console.log(`Trip ${trip.id}: ${trip.status}, now = ${now.toISOString()}`);

  if (trip.status === "COLLECTING") {
    if (trip.paymentDeadline && trip.paymentDeadline <= now) {
      const confirmed = await passes.confirmCollectedTrip(trip.id, now);
      console.log(confirmed ? "→ deadline: trip confirmed, top-ups created where owed" : "→ deadline: nothing to do");
    } else {
      await inviteSplitCompanions(trip.id);
      console.log(`→ still collecting until ${trip.paymentDeadline?.toISOString()}; missed invites re-sent`);
    }
  }

  const reminders = await passes.runTopUpReminderPass(now, { tripId: trip.id });
  if (reminders.reminded || reminders.failed) console.log(`→ top-up reminders: ${JSON.stringify(reminders)}`);

  const after = await prisma.tripRequest.findUnique({
    where: { id: trip.id },
    select: { status: true, pax: true, topUpDeadline: true },
  });
  if (after?.topUpDeadline && after.topUpDeadline <= now) {
    const grace = await passes.closeTopUpGrace(trip.id);
    console.log(grace.remainderId ? `→ grace ended: organizer remainder ${grace.remainderId}` : "→ grace ended: nothing owed");
  }

  const final = await prisma.tripRequest.findUnique({
    where: { id: trip.id },
    select: {
      status: true,
      pax: true,
      topUpDeadline: true,
      payment: { select: { amount: true, shares: { select: { kind: true, status: true, amount: true, travelerId: true } } } },
    },
  });
  console.log(`Now: ${final?.status}, pax ${final?.pax}, bill ${final?.payment?.amount}, topUpDeadline ${final?.topUpDeadline?.toISOString() ?? "—"}`);
  console.table(final?.payment?.shares ?? []);
}

if (process.argv[1]?.endsWith("split-payments-tick.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
