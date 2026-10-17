import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  decideMigrationAction,
  isDropOnlyDiff,
  needsBaseline,
  shouldRunOnThisDeploy,
  type MigrationEnv,
} from "./lib/decideMigrationAction";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export interface PrismaCommandResult {
  error?: Error;
  status: number | null;
  stderr: string;
  stdout: string;
}

export type PrismaRunner = (
  args: string[],
  inherit: boolean,
) => PrismaCommandResult;

export type MigrationLister = () => string[];

function databaseHost(connectionString: string): string | null {
  try {
    return new URL(connectionString).hostname || null;
  } catch {
    return null;
  }
}

function runPrisma(args: string[], inherit: boolean): PrismaCommandResult {
  const cli = path.join(repoRoot, "node_modules/prisma/build/index.js");
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

function listMigrations(): string[] {
  const dir = path.join(repoRoot, "prisma/migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(path.join(dir, entry.name, "migration.sql")),
    )
    .map((entry) => entry.name)
    .sort();
}

function writeOutput(result: PrismaCommandResult): void {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

/**
 * A database built with `prisma db push` has tables but no migration history.
 * Record every migration as applied only when the live schema already holds
 * everything in prisma/schema.prisma. Extra legacy objects are allowed and kept;
 * anything missing needs a manual baseline.
 */
function baselineIfSchemaMatches(
  run: PrismaRunner,
  migrations: MigrationLister,
): number {
  console.log(
    "[migrate-if-outdated] Database has no migration history. Comparing it with prisma/schema.prisma.",
  );
  const diff = run(
    [
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--script",
    ],
    false,
  );
  if (diff.error) {
    console.error(`[migrate-if-outdated] ${diff.error.message}`);
    return 1;
  }
  if (diff.status !== 0) {
    writeOutput(diff);
    console.error("[migrate-if-outdated] prisma migrate diff failed.");
    return 1;
  }
  if (!isDropOnlyDiff(diff.stdout)) {
    process.stdout.write(diff.stdout);
    console.error(
      "[migrate-if-outdated] Database is missing parts of prisma/schema.prisma, so it cannot be baselined automatically. Baseline it manually: https://pris.ly/d/migrate-baseline",
    );
    return 1;
  }
  if (diff.stdout.trim()) {
    console.log(
      "[migrate-if-outdated] Keeping database objects that prisma/schema.prisma no longer models:",
    );
    process.stdout.write(diff.stdout);
  }

  const names = migrations();
  for (const name of names) {
    const resolve = run(["migrate", "resolve", "--applied", name], true);
    if (resolve.error) {
      console.error(`[migrate-if-outdated] ${resolve.error.message}`);
      return 1;
    }
    if (resolve.status !== 0) {
      console.error(
        `[migrate-if-outdated] Could not record ${name} as applied.`,
      );
      return resolve.status ?? 1;
    }
  }
  console.log(
    `[migrate-if-outdated] Baselined ${names.length} migrations. Database schema is up to date.`,
  );
  return 0;
}

function currentMigrationEnv(): MigrationEnv {
  return {
    CONTEXT: process.env.CONTEXT,
    DATABASE_URL: process.env.DATABASE_URL,
    NETLIFY: process.env.NETLIFY,
  };
}

export function migrateIfOutdated(
  env: MigrationEnv = currentMigrationEnv(),
  run: PrismaRunner = runPrisma,
  migrations: MigrationLister = listMigrations,
): number {
  if (!shouldRunOnThisDeploy(env)) {
    console.log(
      "[migrate-if-outdated] Skipping migrations outside the production deploy.",
    );
    return 0;
  }

  if (!env.DATABASE_URL) {
    console.error("[migrate-if-outdated] DATABASE_URL is required.");
    return 1;
  }

  const host = databaseHost(env.DATABASE_URL);
  console.log(
    host
      ? `[migrate-if-outdated] Checking migration status for ${host}.`
      : "[migrate-if-outdated] Checking migration status.",
  );

  const status = run(["migrate", "status"], false);
  if (status.error) {
    console.error(`[migrate-if-outdated] ${status.error.message}`);
    return 1;
  }
  writeOutput(status);

  const decision = decideMigrationAction({
    exitCode: status.status ?? 1,
    stderr: status.stderr,
    stdout: status.stdout,
  });

  if (decision.action === "skip") {
    console.log("[migrate-if-outdated] Database schema is up to date.");
    return 0;
  }
  if (decision.action === "baseline") {
    return baselineIfSchemaMatches(run, migrations);
  }
  if (decision.action === "fail") {
    console.error(`[migrate-if-outdated] ${decision.reason}`);
    return 1;
  }

  console.log(
    "[migrate-if-outdated] Database is behind. Applying pending migrations.",
  );
  const deploy = run(["migrate", "deploy"], false);
  if (deploy.error) {
    console.error(`[migrate-if-outdated] ${deploy.error.message}`);
    return 1;
  }
  writeOutput(deploy);
  if (
    deploy.status !== 0 &&
    needsBaseline(`${deploy.stdout}\n${deploy.stderr}`)
  ) {
    return baselineIfSchemaMatches(run, migrations);
  }
  if (deploy.status !== 0) {
    console.error("[migrate-if-outdated] prisma migrate deploy failed.");
    return deploy.status ?? 1;
  }
  console.log("[migrate-if-outdated] Migrations applied.");
  return 0;
}

function isCliEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === path.resolve(entry);
}

if (isCliEntry()) {
  if (!process.env.DATABASE_URL) {
    createRequire(import.meta.url)("dotenv/config");
  }
  process.exit(migrateIfOutdated());
}
