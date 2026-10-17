export interface MigrationStatusResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export type MigrationDecision =
  | { action: "baseline" }
  | { action: "deploy" }
  | { action: "fail"; reason: string }
  | { action: "skip" };

export interface MigrationEnv {
  CONTEXT?: string;
  DATABASE_URL?: string;
  NETLIFY?: string;
}

const ANSI = /\u001b\[[0-9;]*m/g;

/** Production Netlify builds are merges to main. Other Netlify contexts share a database and must not migrate. */
export function shouldRunOnThisDeploy(env: MigrationEnv): boolean {
  if (env.NETLIFY === "true") return env.CONTEXT === "production";
  return true;
}

/**
 * Apply migrations only when Prisma reports the database is behind.
 * An unmanaged database goes to the baseline check; drift and failed migrations fail closed.
 */
export function decideMigrationAction(
  result: MigrationStatusResult,
): MigrationDecision {
  const output = `${result.stdout}\n${result.stderr}`.replace(ANSI, "");

  if (/not managed by Prisma Migrate/.test(output)) {
    return { action: "baseline" };
  }
  if (/are different:/.test(output)) {
    return {
      action: "fail",
      reason:
        "Local migration history diverges from the database. Resolve it before deploying.",
    };
  }
  if (/have failed:/.test(output)) {
    return {
      action: "fail",
      reason:
        "A migration has failed on the database. Resolve it before deploying.",
    };
  }
  if (
    /Following migrations? have not yet been applied:/.test(output) &&
    /prisma migrate deploy/.test(output)
  ) {
    return { action: "deploy" };
  }
  if (result.exitCode === 0 && /Database schema is up to date!/.test(output)) {
    return { action: "skip" };
  }
  return {
    action: "fail",
    reason:
      "prisma migrate status did not report a current or pending database.",
  };
}

/** Prisma P3005: `migrate deploy` found tables but no migration history. */
export function needsBaseline(output: string): boolean {
  return /\bP3005\b/.test(output.replace(ANSI, ""));
}

const DROP_STATEMENT = /^DROP (INDEX|TABLE|TYPE) "[^"]+"$/;
const ALTER_DROP_STATEMENT =
  /^ALTER TABLE "[^"]+" DROP (COLUMN|CONSTRAINT) "[^"]+"(, DROP (COLUMN|CONSTRAINT) "[^"]+")*$/;

/**
 * True when a database-to-schema SQL diff only drops objects, so the database
 * already holds everything the schema needs. Legacy objects the schema no
 * longer models stay in place.
 */
export function isDropOnlyDiff(sql: string): boolean {
  return sql
    .replace(ANSI, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join(" ")
    .split(";")
    .map((statement) =>
      statement.replace(/\s+/g, " ").replace(/ ,/g, ",").trim(),
    )
    .filter(Boolean)
    .every(
      (statement) =>
        DROP_STATEMENT.test(statement) || ALTER_DROP_STATEMENT.test(statement),
    );
}
