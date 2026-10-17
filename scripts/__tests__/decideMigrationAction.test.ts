// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  decideMigrationAction,
  shouldRunOnThisDeploy,
} from "../lib/decideMigrationAction";
import { migrateIfOutdated, type PrismaRunner } from "../migrate-if-outdated";

const upToDate = `
5 migrations found in prisma/migrations

Database schema is up to date!
`;

const behind = `
5 migrations found in prisma/migrations
Following migration have not yet been applied:
20261011120000_traveler_nationalities_visas

To apply migrations in development run prisma migrate dev.
To apply migrations in production run prisma migrate deploy.
`;

describe("shouldRunOnThisDeploy", () => {
  it("runs for a production Netlify deploy", () => {
    expect(
      shouldRunOnThisDeploy({ CONTEXT: "production", NETLIFY: "true" }),
    ).toBe(true);
  });

  it("skips develop and preview Netlify builds", () => {
    expect(
      shouldRunOnThisDeploy({ CONTEXT: "branch-deploy", NETLIFY: "true" }),
    ).toBe(false);
    expect(
      shouldRunOnThisDeploy({ CONTEXT: "deploy-preview", NETLIFY: "true" }),
    ).toBe(false);
  });

  it("runs outside Netlify so an operator can apply a behind database", () => {
    expect(shouldRunOnThisDeploy({})).toBe(true);
  });
});

describe("decideMigrationAction", () => {
  it("skips a current database", () => {
    expect(
      decideMigrationAction({ exitCode: 0, stderr: "", stdout: upToDate }),
    ).toEqual({ action: "skip" });
  });

  it("deploys when Prisma reports pending migrations", () => {
    expect(
      decideMigrationAction({ exitCode: 1, stderr: "", stdout: behind }),
    ).toEqual({ action: "deploy" });
  });

  it("does not deploy a diverged history that also mentions unapplied names", () => {
    const decision = decideMigrationAction({
      exitCode: 1,
      stderr: `Your local migration history and the migrations table from your database are different:

The migration have not yet been applied:
20261011120000_traveler_nationalities_visas
`,
      stdout: "",
    });
    expect(decision.action).toBe("fail");
  });

  it("does not deploy when a migration has failed", () => {
    const decision = decideMigrationAction({
      exitCode: 1,
      stderr: "Following migration have failed:\n20261002_trip_reveal_timing\n",
      stdout: "",
    });
    expect(decision.action).toBe("fail");
  });

  it("does not deploy a database Prisma Migrate does not manage", () => {
    const decision = decideMigrationAction({
      exitCode: 1,
      stderr:
        "The current database is not managed by Prisma Migrate.\nRead more about how to baseline an existing production database:\n",
      stdout: "",
    });
    expect(decision.action).toBe("fail");
  });

  it("fails closed on an unrecognized status", () => {
    expect(
      decideMigrationAction({
        exitCode: 1,
        stderr: "P1001: Can't reach database server",
        stdout: "",
      }).action,
    ).toBe("fail");
  });
});

describe("migrateIfOutdated", () => {
  it("does not call Prisma outside production on Netlify", () => {
    const run = vi.fn<PrismaRunner>();
    const code = migrateIfOutdated(
      {
        CONTEXT: "branch-deploy",
        DATABASE_URL: "postgresql://db.example/app",
        NETLIFY: "true",
      },
      run,
    );
    expect(code).toBe(0);
    expect(run).not.toHaveBeenCalled();
  });

  it("leaves a current production database unchanged", () => {
    const run = vi.fn<PrismaRunner>(() => ({
      status: 0,
      stderr: "",
      stdout: upToDate,
    }));
    const code = migrateIfOutdated(
      {
        CONTEXT: "production",
        DATABASE_URL: "postgresql://user:secret@db.example/app",
        NETLIFY: "true",
      },
      run,
    );
    expect(code).toBe(0);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(["migrate", "status"], false);
  });

  it("applies migrations when the production database is behind", () => {
    const run = vi.fn<PrismaRunner>((args) =>
      args[1] === "status"
        ? { status: 1, stderr: "", stdout: behind }
        : { status: 0, stderr: "", stdout: "" },
    );
    const code = migrateIfOutdated(
      {
        CONTEXT: "production",
        DATABASE_URL: "postgresql://db.example/app",
        NETLIFY: "true",
      },
      run,
    );
    expect(code).toBe(0);
    expect(run).toHaveBeenNthCalledWith(1, ["migrate", "status"], false);
    expect(run).toHaveBeenNthCalledWith(2, ["migrate", "deploy"], true);
  });

  it("stops before deploy when the database is not manageable", () => {
    const run = vi.fn<PrismaRunner>(() => ({
      status: 1,
      stderr: "The current database is not managed by Prisma Migrate.",
      stdout: "",
    }));
    const code = migrateIfOutdated(
      { DATABASE_URL: "postgresql://db.example/app" },
      run,
    );
    expect(code).toBe(1);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("production build hook", () => {
  it("runs the script before the production build", () => {
    const toml = readFileSync(path.join(process.cwd(), "netlify.toml"), "utf8");
    expect(toml).toContain(
      'command = "npx tsx scripts/migrate-if-outdated.ts && npm run build"',
    );
  });
});
