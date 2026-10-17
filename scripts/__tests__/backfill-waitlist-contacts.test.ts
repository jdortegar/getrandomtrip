// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  parseBackfillMode,
  planWaitlistContactBackfill,
  runWaitlistContactBackfill,
  type WaitlistEntryRow,
} from "../backfill-waitlist-contacts";

vi.mock("dotenv/config", () => {
  throw new Error("Importing a script must not load environment files");
});

function entry(overrides: Partial<WaitlistEntryRow> = {}): WaitlistEntryRow {
  return {
    email: "ana@example.com",
    name: "Ana",
    lastName: "Pérez",
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

describe("planWaitlistContactBackfill", () => {
  it("plans a contact per new entry and skips existing contacts", () => {
    const plan = planWaitlistContactBackfill(
      [
        entry(),
        entry({ email: "Bob@Example.com", name: null, lastName: null }),
        entry({ email: "old@example.com" }),
      ],
      { contactEmails: ["old@example.com"], users: [] },
    );

    expect(plan.report).toEqual({ entries: 3, created: 2, skipped: 1 });
    expect(plan.create).toEqual([
      {
        email: "ana@example.com",
        name: "Ana Pérez",
        userId: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
      },
      {
        email: "bob@example.com",
        name: null,
        userId: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
      },
    ]);
  });

  it("links users by case-insensitive email", () => {
    const plan = planWaitlistContactBackfill([entry()], {
      contactEmails: [],
      users: [{ id: "u1", email: "ANA@example.com" }],
    });

    expect(plan.create[0].userId).toBe("u1");
  });

  it("skips entries whose emails collide after normalization", () => {
    const plan = planWaitlistContactBackfill(
      [entry(), entry({ email: "ANA@example.com" })],
      { contactEmails: [], users: [] },
    );

    expect(plan.report).toEqual({ entries: 2, created: 1, skipped: 1 });
  });
});

describe("parseBackfillMode", () => {
  it("defaults to dry-run and only applies with --apply", () => {
    expect(parseBackfillMode([])).toBe("dry-run");
    expect(parseBackfillMode(["--dry-run"])).toBe("dry-run");
    expect(parseBackfillMode(["--apply"])).toBe("apply");
  });
});

describe("runWaitlistContactBackfill", () => {
  function client() {
    return {
      waitlistEntry: { findMany: vi.fn().mockResolvedValue([entry()]) },
      contact: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findMany: vi.fn().mockResolvedValue([]) },
    };
  }

  it("writes nothing in dry-run", async () => {
    const db = client();
    const logger = { log: vi.fn() };

    const result = await runWaitlistContactBackfill(db, "dry-run", logger);

    expect(db.contact.createMany).not.toHaveBeenCalled();
    expect(result.report).toEqual({ entries: 1, created: 1, skipped: 0 });
  });

  it("creates planned contacts idempotently in apply mode", async () => {
    const db = client();
    const logger = { log: vi.fn() };

    const result = await runWaitlistContactBackfill(db, "apply", logger);

    expect(db.contact.createMany).toHaveBeenCalledWith({
      data: [
        {
          email: "ana@example.com",
          name: "Ana Pérez",
          userId: null,
          createdAt: new Date("2026-09-01T00:00:00Z"),
          source: "WAITLIST",
          locale: "es",
        },
      ],
      skipDuplicates: true,
    });
    expect(result.report.created).toBe(1);
  });
});
