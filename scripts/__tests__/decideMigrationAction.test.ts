// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  decideMigrationAction,
  isDropOnlyDiff,
  needsBaseline,
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

  it("baselines instead of deploying a database Prisma Migrate does not manage", () => {
    const decision = decideMigrationAction({
      exitCode: 1,
      stderr:
        "The current database is not managed by Prisma Migrate.\nRead more about how to baseline an existing production database:\n",
      stdout: "",
    });
    expect(decision.action).toBe("baseline");
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

describe("isDropOnlyDiff", () => {
  it("accepts an empty diff", () => {
    expect(isDropOnlyDiff("-- This is an empty migration.\n")).toBe(true);
  });

  it("accepts legacy objects the schema no longer models", () => {
    expect(isDropOnlyDiff(legacyColumnsDiff)).toBe(true);
  });

  it("rejects a diff that adds what the schema needs", () => {
    expect(
      isDropOnlyDiff(
        `${legacyColumnsDiff}\nALTER TABLE "payments" ADD COLUMN "promoCode" TEXT;\n`,
      ),
    ).toBe(false);
  });

  it("rejects an alter that mixes drops with changes", () => {
    expect(
      isDropOnlyDiff(
        'ALTER TABLE "users" DROP COLUMN "legacy",\nALTER COLUMN "name" SET NOT NULL;\n',
      ),
    ).toBe(false);
  });
});

describe("needsBaseline", () => {
  it("detects a deploy refused for missing migration history", () => {
    expect(
      needsBaseline(
        "Error: \u001b[1mP3005\u001b[0m\nThe database schema is not empty.",
      ),
    ).toBe(true);
  });

  it("ignores other deploy failures", () => {
    expect(needsBaseline("Error: P3009 migrate found failed migrations")).toBe(
      false,
    );
  });
});

const production = {
  CONTEXT: "production",
  DATABASE_URL: "postgresql://db.example/app",
  NETLIFY: "true",
};

const migrationNames = () => [
  "20260928120000_traveler_details_reminder",
  "20261011120000_traveler_nationalities_visas",
];

const unbaselinedDeploy = {
  status: 1,
  stderr:
    "Error: P3005\nThe database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline\n",
  stdout: "5 migrations found in prisma/migrations\n",
};

const diffArgs = [
  "migrate",
  "diff",
  "--from-config-datasource",
  "--to-schema",
  "prisma/schema.prisma",
  "--script",
];

const legacyColumnsDiff = `-- DropIndex
DROP INDEX "blog_posts_slug_key";

-- AlterTable
ALTER TABLE "blog_posts" DROP COLUMN "blocks",
DROP COLUMN "title";
`;

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
    expect(run).toHaveBeenNthCalledWith(2, ["migrate", "deploy"], false);
  });

  it("baselines a pushed database whose schema already matches", () => {
    const run = vi.fn<PrismaRunner>((args) => {
      if (args[1] === "status")
        return { status: 1, stderr: "", stdout: behind };
      if (args[1] === "deploy") return unbaselinedDeploy;
      return { status: 0, stderr: "", stdout: "" };
    });
    const code = migrateIfOutdated(production, run, migrationNames);
    expect(code).toBe(0);
    expect(run).toHaveBeenNthCalledWith(3, diffArgs, false);
    expect(run).toHaveBeenNthCalledWith(
      4,
      [
        "migrate",
        "resolve",
        "--applied",
        "20260928120000_traveler_details_reminder",
      ],
      true,
    );
    expect(run).toHaveBeenNthCalledWith(
      5,
      [
        "migrate",
        "resolve",
        "--applied",
        "20261011120000_traveler_nationalities_visas",
      ],
      true,
    );
    expect(run).toHaveBeenCalledTimes(5);
  });

  it("baselines when status reports an unmanaged database", () => {
    const run = vi.fn<PrismaRunner>((args) =>
      args[1] === "status"
        ? {
            status: 1,
            stderr: "The current database is not managed by Prisma Migrate.",
            stdout: "",
          }
        : { status: 0, stderr: "", stdout: "" },
    );
    const code = migrateIfOutdated(production, run, migrationNames);
    expect(code).toBe(0);
    expect(run).toHaveBeenNthCalledWith(2, diffArgs, false);
    expect(run).not.toHaveBeenCalledWith(["migrate", "deploy"], false);
  });

  it("does not record history when the schema differs", () => {
    const run = vi.fn<PrismaRunner>((args) => {
      if (args[1] === "status")
        return { status: 1, stderr: "", stdout: behind };
      if (args[1] === "deploy") return unbaselinedDeploy;
      return { status: 2, stderr: "", stdout: "[+] Added tables\n" };
    });
    const code = migrateIfOutdated(production, run, migrationNames);
    expect(code).toBe(1);
    expect(run).toHaveBeenCalledTimes(3);
    expect(run.mock.calls.some(([args]) => args[1] === "resolve")).toBe(false);
  });

  it("stops at the first migration it cannot record", () => {
    const run = vi.fn<PrismaRunner>((args) => {
      if (args[1] === "status")
        return { status: 1, stderr: "", stdout: behind };
      if (args[1] === "deploy") return unbaselinedDeploy;
      if (args[1] === "resolve") return { status: 1, stderr: "", stdout: "" };
      return { status: 0, stderr: "", stdout: "" };
    });
    const code = migrateIfOutdated(production, run, migrationNames);
    expect(code).toBe(1);
    expect(run).toHaveBeenCalledTimes(4);
  });

  it("does not baseline after an unrelated deploy failure", () => {
    const run = vi.fn<PrismaRunner>((args) =>
      args[1] === "status"
        ? { status: 1, stderr: "", stdout: behind }
        : { status: 1, stderr: "Error: P3018 migration failed", stdout: "" },
    );
    const code = migrateIfOutdated(production, run, migrationNames);
    expect(code).toBe(1);
    expect(run).toHaveBeenCalledTimes(2);
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
