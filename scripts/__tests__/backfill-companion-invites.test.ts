// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  formatCandidateTable,
  runBackfill,
  runCli,
  selectBackfillCandidates,
  type BackfillRow,
} from "../backfill-companion-invites";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-30T12:00:00.000Z");

function row(overrides: Partial<BackfillRow> & { trip?: Partial<BackfillRow["tripRequest"]> } = {}): BackfillRow {
  const { trip, ...rest } = overrides;
  return {
    id: "trav-1",
    kind: "ADULT",
    status: "COMPLETE",
    email: "jane.doe@gmail.com",
    invitedAt: null,
    userId: null,
    tripRequest: {
      id: "trip-1",
      type: "xsed",
      status: "CONFIRMED",
      startDate: new Date("2026-10-03T00:00:00.000Z"),
      endDate: new Date("2026-10-04T00:00:00.000Z"),
      user: { name: "Ana Ortega" },
      payment: { status: "APPROVED" },
      ...trip,
    },
    ...rest,
  };
}

describe("selectBackfillCandidates", () => {
  it("keeps an uninvited, unlinked adult with an email on a paid trip that has not ended", () => {
    const [candidate] = selectBackfillCandidates([row()], NOW);

    expect(candidate).toMatchObject({
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      buyerName: "Ana Ortega",
      maskedEmail: "j***@gmail.com",
      tripType: "xsed",
    });
  });

  it.each([
    ["a minor", row({ kind: "MINOR" })],
    ["no email", row({ email: null })],
    ["a blank email", row({ email: "   " })],
    ["an already-invited row", row({ invitedAt: new Date(NOW - DAY_MS) })],
    ["an already-linked row", row({ userId: "user-1" })],
    ["an unpaid trip", row({ trip: { payment: null } })],
    ["a pending payment", row({ trip: { payment: { status: "PENDING" } } })],
    ["a cancelled trip", row({ trip: { status: "CANCELLED" } })],
    ["an ended trip", row({ trip: { endDate: new Date(NOW - 2 * DAY_MS) } })],
  ])("excludes %s", (_, excluded) => {
    expect(selectBackfillCandidates([excluded], NOW)).toEqual([]);
  });

  it("falls back to startDate for the end check when endDate is missing", () => {
    const ended = row({ trip: { endDate: null, startDate: new Date(NOW - 3 * DAY_MS) } });
    const running = row({ trip: { endDate: null, startDate: new Date(NOW) } });

    expect(selectBackfillCandidates([ended, running], NOW)).toHaveLength(1);
  });
});

describe("formatCandidateTable", () => {
  it("lists ids, buyer, masked email, dates and type, never the raw email", () => {
    const table = formatCandidateTable(selectBackfillCandidates([row()], NOW));

    expect(table).toContain("trav-1");
    expect(table).toContain("trip-1");
    expect(table).toContain("Ana Ortega");
    expect(table).toContain("j***@gmail.com");
    expect(table).toContain("2026-10-03");
    expect(table).toContain("2026-10-04");
    expect(table).toContain("xsed");
    expect(table).not.toContain("jane.doe@gmail.com");
  });

  it("says so when there is nothing to send", () => {
    expect(formatCandidateTable([])).toMatch(/no candidates/i);
  });
});

function makeDeps() {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      issueInvite: vi.fn(async (id: string) => {
        calls.push(`issue:${id}`);
        return `token-${id}`;
      }),
      deliver: vi.fn(async (id: string) => {
        calls.push(`deliver:${id}`);
      }),
      log: vi.fn(),
    },
  };
}

function makeClient(rows: BackfillRow[]) {
  return { tripTraveler: { findMany: vi.fn().mockResolvedValue(rows) } };
}

describe("runBackfill", () => {
  it("dry run lists candidates and sends nothing", async () => {
    const client = makeClient([row()]);
    const { deps } = makeDeps();

    const result = await runBackfill(client as never, { send: false, now: NOW }, deps);

    expect(result.mode).toBe("dry-run");
    expect(result.candidates).toHaveLength(1);
    expect(deps.issueInvite).not.toHaveBeenCalled();
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(client.tripTraveler.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: "ADULT",
          invitedAt: null,
          userId: null,
          tripRequest: expect.objectContaining({ payment: { is: { status: "APPROVED" } } }),
        }),
      }),
    );
    expect(deps.log.mock.calls.flat().join("\n")).toContain("j***@gmail.com");
  });

  it.each([undefined, "nonproduction", "staging"])(
    "refuses --send when RT_DEPLOY_ENV is %s, before touching the database",
    async (env) => {
      const client = makeClient([row()]);
      const { deps } = makeDeps();

      await expect(
        runBackfill(client as never, { send: true, env, now: NOW }, deps),
      ).rejects.toThrow(/RT_DEPLOY_ENV=production/);

      expect(client.tripTraveler.findMany).not.toHaveBeenCalled();
      expect(deps.issueInvite).not.toHaveBeenCalled();
    },
  );

  it("sends sequentially (issue then deliver per row) and reports each outcome", async () => {
    const rows = [row({ id: "a" }), row({ id: "b" }), row({ id: "c" })];
    const { deps, calls } = makeDeps();
    deps.deliver.mockImplementation(async (id: string) => {
      calls.push(`deliver:${id}`);
      if (id === "b") throw new Error("provider down");
    });

    const result = await runBackfill(
      makeClient(rows) as never,
      { send: true, env: "production", now: NOW },
      deps,
    );

    expect(calls).toEqual(["issue:a", "deliver:a", "issue:b", "deliver:b", "issue:c", "deliver:c"]);
    expect(result.results).toEqual([
      { travelerId: "a", ok: true },
      { travelerId: "b", ok: false, error: "provider down" },
      { travelerId: "c", ok: true },
    ]);
    expect(deps.issueInvite).toHaveBeenCalledWith("a", "COMPLETE");
  });

  it("does nothing on --send when there are no candidates", async () => {
    const { deps } = makeDeps();

    const result = await runBackfill(
      makeClient([row({ userId: "u" })]) as never,
      { send: true, env: "production", now: NOW },
      deps,
    );

    expect(result.results).toEqual([]);
    expect(deps.issueInvite).not.toHaveBeenCalled();
  });
});

describe("runCli", () => {
  function makeCli(rows: BackfillRow[]) {
    const client = makeClient(rows);
    const sendDeps = {
      issueInvite: vi.fn(async (id: string) => `token-${id}`),
      deliver: vi.fn(async () => {}),
    };
    return {
      client,
      sendDeps,
      loadSendDeps: vi.fn(async () => sendDeps),
      withPrisma: vi.fn(async (run: (c: never) => Promise<unknown>) => run(client as never)),
      log: vi.fn(),
    };
  }

  it("dry run never loads the app modules (issuer, mailer) and needs no RT_DEPLOY_ENV", async () => {
    const cli = makeCli([row()]);

    const result = await runCli({ argv: [], env: undefined, now: NOW }, cli);

    expect(result).toMatchObject({ exitCode: 0 });
    expect(cli.loadSendDeps).not.toHaveBeenCalled();
    expect(cli.withPrisma).toHaveBeenCalledTimes(1);
    expect(cli.sendDeps.issueInvite).not.toHaveBeenCalled();
    expect(cli.log.mock.calls.flat().join("\n")).toContain("j***@gmail.com");
  });

  it("--send refuses outside production before touching the database or app modules", async () => {
    const cli = makeCli([row()]);

    const result = await runCli({ argv: ["--send"], env: "nonproduction", now: NOW }, cli);

    expect(result.exitCode).toBe(1);
    expect(cli.withPrisma).not.toHaveBeenCalled();
    expect(cli.loadSendDeps).not.toHaveBeenCalled();
  });

  it("--send in production loads the app modules and sends", async () => {
    const cli = makeCli([row()]);

    const result = await runCli({ argv: ["--send"], env: "production", now: NOW }, cli);

    expect(cli.loadSendDeps).toHaveBeenCalledTimes(1);
    expect(cli.sendDeps.issueInvite).toHaveBeenCalledWith("trav-1", "COMPLETE");
    expect(result.exitCode).toBe(0);
  });

  it("exits non-zero when any send fails", async () => {
    const cli = makeCli([row()]);
    cli.sendDeps.deliver.mockRejectedValue(new Error("provider down"));

    const result = await runCli({ argv: ["--send"], env: "production", now: NOW }, cli);

    expect(result.exitCode).toBe(1);
  });
});
