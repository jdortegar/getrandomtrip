/**
 * One-off backfill for `TripRequest.departureTimeZone`.
 *
 * Existing trips predate the column (NULL, which the app already reads as
 * America/Argentina/Buenos_Aires). This maps each row's stored `originCountry`
 * name (es or en, any case/accent) to an ISO country code and then to that
 * country's timezone. Rows whose country cannot be mapped fall back to
 * Argentina and are LISTED so the owner can review them; multi-timezone
 * countries (Brazil, Mexico, ...) get their primary zone and are listed as
 * ambiguous.
 *
 * DRY RUN BY DEFAULT: prints the plan (zone counts + unmapped/ambiguous rows)
 * and writes nothing. `--apply` writes, one guarded `updateMany` per zone
 * (`departureTimeZone: null` guard, so a zone set meanwhile is never
 * overwritten and re-running is a no-op). Review the dry run with the owner
 * before using `--apply`.
 *
 *   npx tsx scripts/backfill-departure-time-zone.ts            # dry run
 *   npx tsx scripts/backfill-departure-time-zone.ts --apply
 */
import { resolveCountryCode } from "../src/lib/geo/countryNameToCode";
import { DEFAULT_DEPARTURE_TIME_ZONE } from "../src/lib/helpers/tripTimeZone";
import { countryToTimezone, isMultiTimezoneCountry } from "../src/lib/xsed/country-tz";
import { withPrisma } from "./lib/withPrisma";

export interface TripRow {
  id: string;
  originCountry: string;
  originCity: string;
  startDate: Date | null;
  status: string;
}

export interface BackfillClient {
  tripRequest: {
    findMany: (args: Record<string, unknown>) => Promise<TripRow[]>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
}

export type OriginClassification = {
  kind: "mapped" | "ambiguous" | "unmapped";
  timeZone: string;
};

export function classifyOrigin(originCountry: string): OriginClassification {
  const code = resolveCountryCode(originCountry);
  const timeZone = code ? countryToTimezone(code) : null;
  if (!code || !timeZone) {
    return { kind: "unmapped", timeZone: DEFAULT_DEPARTURE_TIME_ZONE };
  }
  return { kind: isMultiTimezoneCountry(code) ? "ambiguous" : "mapped", timeZone };
}

export interface ReviewRow {
  id: string;
  kind: "ambiguous" | "unmapped";
  originCountry: string;
  originCity: string;
  timeZone: string;
}

export interface Plan {
  total: number;
  byTimeZone: Map<string, string[]>;
  review: ReviewRow[];
}

export function planBackfill(rows: TripRow[]): Plan {
  const byTimeZone = new Map<string, string[]>();
  const review: ReviewRow[] = [];
  for (const trip of rows) {
    const { kind, timeZone } = classifyOrigin(trip.originCountry);
    byTimeZone.set(timeZone, [...(byTimeZone.get(timeZone) ?? []), trip.id]);
    if (kind !== "mapped") {
      review.push({
        id: trip.id,
        kind,
        originCountry: trip.originCountry,
        originCity: trip.originCity,
        timeZone,
      });
    }
  }
  review.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  return { total: rows.length, byTimeZone, review };
}

export function formatPlan(plan: Plan): string {
  const lines = [`${plan.total} trip(s) without a departure timezone.`, "", "Proposed zones:"];
  for (const [zone, ids] of [...plan.byTimeZone].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`  ${String(ids.length).padStart(4)}  ${zone}`);
  }
  if (plan.review.length > 0) {
    lines.push("", "Needs review (kind, trip, origin, proposed zone):");
    for (const r of plan.review) {
      lines.push(`  ${r.kind.padEnd(9)} ${r.id}  ${r.originCountry} / ${r.originCity}  -> ${r.timeZone}`);
    }
  }
  return lines.join("\n");
}

export async function runBackfill(
  client: BackfillClient,
  options: { apply: boolean },
  log: (line: string) => void,
): Promise<{ mode: "dry-run" | "apply"; plan: Plan; updated: number }> {
  const rows = await client.tripRequest.findMany({
    where: { departureTimeZone: null },
    select: {
      id: true,
      originCountry: true,
      originCity: true,
      startDate: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const plan = planBackfill(rows);
  log(formatPlan(plan));

  if (!options.apply) {
    log("\nDry run: nothing written. Re-run with --apply to write these zones.");
    return { mode: "dry-run", plan, updated: 0 };
  }

  let updated = 0;
  for (const [timeZone, ids] of plan.byTimeZone) {
    const result = await client.tripRequest.updateMany({
      where: { id: { in: ids }, departureTimeZone: null },
      data: { departureTimeZone: timeZone },
    });
    updated += result.count;
    log(`updated ${result.count} trip(s) -> ${timeZone}`);
  }
  return { mode: "apply", plan, updated };
}

export interface CliDeps {
  withPrisma: (run: (client: BackfillClient) => Promise<unknown>) => Promise<unknown>;
  log: (line: string) => void;
}

/** CLI orchestration, injectable so tests never touch a database. */
export async function runCli(
  options: { argv: string[] },
  deps: CliDeps,
): Promise<{ exitCode: number }> {
  const apply = options.argv.includes("--apply");
  await deps.withPrisma((client) => runBackfill(client, { apply }, deps.log));
  return { exitCode: 0 };
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-departure-time-zone.ts") ?? false;

if (isMainModule) {
  runCli(
    { argv: process.argv.slice(2) },
    {
      withPrisma: (run) => withPrisma((client) => run(client as unknown as BackfillClient)),
      log: (line) => console.log(line),
    },
  )
    .then(({ exitCode }) => {
      if (exitCode) process.exitCode = exitCode;
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
}
