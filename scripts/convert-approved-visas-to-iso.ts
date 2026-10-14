/**
 * One-off conversion: rewrite `User.approvedVisas` from free-text country
 * names (the old English `VISA_COUNTRIES` list) to ISO 3166-1 alpha-2 codes.
 *
 * Each value is kept when it already is an ISO code, mapped to the `SCHENGEN`
 * visa zone for Schengen spellings (including the stored typo "Schengena"),
 * otherwise resolved with `resolveCountryCode` (es/en names and aliases).
 * Names that cannot be resolved are reported as UNRESOLVED and kept unchanged.
 *
 * DRY RUN BY DEFAULT: prints the proposed conversion per user and writes
 * nothing. `--apply` writes, one user at a time, and only when the row still
 * holds the value that was read (a concurrent edit is reported as SKIPPED).
 * Review the dry-run output with the owner before using `--apply`.
 *
 *   npm run db:convert-approved-visas             # dry run
 *   npm run db:convert-approved-visas -- --apply  # write
 */
import { resolveVisaCode } from "../src/lib/geo/visaCodes";
import { withPrisma } from "./lib/withPrisma";

export interface VisaUserRow {
  id: string;
  approvedVisas: string[];
}

export interface VisaConversion {
  userId: string;
  before: string[];
  after: string[];
  /** Original values that could not be mapped to a visa code (kept in `after`). */
  unresolved: string[];
  /** True when `after` differs from `before` and the row needs a write. */
  changed: boolean;
}

export interface VisaConversionClient {
  user: {
    findMany: (args: Record<string, unknown>) => Promise<VisaUserRow[]>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
}

/** Pure conversion of one user's values: visa codes, deduped, unresolved names kept as-is. */
export function convertApprovedVisas(values: readonly string[]): {
  codes: string[];
  unresolved: string[];
} {
  const codes: string[] = [];
  const unresolved: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const code = resolveVisaCode(value);
    if (code) {
      if (!codes.includes(code)) codes.push(code);
    } else {
      unresolved.push(value);
      if (!codes.includes(value)) codes.push(value);
    }
  }
  return { codes, unresolved };
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/** Pure selection: rows whose values change, or that hold names needing manual review. */
export function selectVisaConversions(rows: readonly VisaUserRow[]): VisaConversion[] {
  const conversions: VisaConversion[] = [];
  for (const row of rows) {
    const { codes, unresolved } = convertApprovedVisas(row.approvedVisas);
    const changed = !sameList(codes, row.approvedVisas);
    if (!changed && unresolved.length === 0) continue;
    conversions.push({
      userId: row.id,
      before: row.approvedVisas,
      after: codes,
      unresolved,
      changed,
    });
  }
  return conversions;
}

export function formatConversionReport(conversions: readonly VisaConversion[]): string {
  if (conversions.length === 0) return "No users need conversion.";
  return conversions
    .map((c) => {
      const line = `${c.userId}: ${c.before.join(", ")} -> ${c.after.join(", ")}`;
      return c.unresolved.length
        ? `${line}  UNRESOLVED: ${c.unresolved.join(", ")}`
        : line;
    })
    .join("\n");
}

export async function runConversion(
  client: VisaConversionClient,
  options: { apply: boolean },
  log: (line: string) => void,
): Promise<{
  mode: "dry-run" | "apply";
  conversions: VisaConversion[];
  updated: number;
}> {
  const rows = await client.user.findMany({
    where: { NOT: { approvedVisas: { isEmpty: true } } },
    select: { id: true, approvedVisas: true },
    orderBy: { createdAt: "asc" },
  });

  const conversions = selectVisaConversions(rows);
  const toWrite = conversions.filter((c) => c.changed);
  const unresolvedCount = conversions.filter((c) => c.unresolved.length).length;
  log(formatConversionReport(conversions));
  log(
    `${toWrite.length} user(s) to convert, ${unresolvedCount} with UNRESOLVED names (kept unchanged).`,
  );

  if (!options.apply) {
    log("Dry run: nothing written. Re-run with --apply to write these conversions.");
    return { mode: "dry-run", conversions, updated: 0 };
  }

  let updated = 0;
  for (const conversion of toWrite) {
    const { count } = await client.user.updateMany({
      where: { id: conversion.userId, approvedVisas: { equals: conversion.before } },
      data: { approvedVisas: conversion.after },
    });
    if (count === 1) {
      updated += 1;
      log(`updated  ${conversion.userId}`);
    } else {
      log(`SKIPPED  ${conversion.userId}: approvedVisas changed since it was read`);
    }
  }
  log(`${updated} user(s) updated.`);
  return { mode: "apply", conversions, updated };
}

const isMainModule =
  process.argv[1]?.endsWith("convert-approved-visas-to-iso.ts") ?? false;

if (isMainModule) {
  const apply = process.argv.slice(2).includes("--apply");
  withPrisma((client) =>
    runConversion(client as unknown as VisaConversionClient, { apply }, (line) =>
      console.log(line),
    ),
  ).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
