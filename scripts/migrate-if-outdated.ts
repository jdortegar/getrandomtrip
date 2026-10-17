import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  decideMigrationAction,
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
  if (status.stdout) process.stdout.write(status.stdout);
  if (status.stderr) process.stderr.write(status.stderr);

  const decision = decideMigrationAction({
    exitCode: status.status ?? 1,
    stderr: status.stderr,
    stdout: status.stdout,
  });

  if (decision.action === "skip") {
    console.log("[migrate-if-outdated] Database schema is up to date.");
    return 0;
  }
  if (decision.action === "fail") {
    console.error(`[migrate-if-outdated] ${decision.reason}`);
    return 1;
  }

  console.log(
    "[migrate-if-outdated] Database is behind. Applying pending migrations.",
  );
  const deploy = run(["migrate", "deploy"], true);
  if (deploy.error) {
    console.error(`[migrate-if-outdated] ${deploy.error.message}`);
    return 1;
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
