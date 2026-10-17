export interface MigrationStatusResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export type MigrationDecision =
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
 * Drift, failed migrations, and an unmanaged database fail closed.
 */
export function decideMigrationAction(
  result: MigrationStatusResult,
): MigrationDecision {
  const output = `${result.stdout}\n${result.stderr}`.replace(ANSI, "");

  if (/not managed by Prisma Migrate/.test(output)) {
    return {
      action: "fail",
      reason:
        "Database is not managed by Prisma Migrate. Baseline it before deploying.",
    };
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
