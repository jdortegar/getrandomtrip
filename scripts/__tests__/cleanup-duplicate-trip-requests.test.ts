import { describe, it, expect, vi } from "vitest";
import { cleanupDuplicateTripRequests } from "../cleanup-duplicate-trip-requests";

type Row = {
  id: string;
  userId: string;
  type: string;
  status: string;
  updatedAt: Date;
};

function makeMockClient(rows: Row[]) {
  return {
    tripRequest: {
      findMany: vi.fn().mockResolvedValue(rows),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

const T1 = new Date("2026-01-01T00:00:00.000Z");
const T2 = new Date("2026-02-01T00:00:00.000Z");
const T3 = new Date("2026-03-01T00:00:00.000Z");

describe("cleanupDuplicateTripRequests", () => {
  it("collapses three non-terminal journey rows to the newest, cancelling the other two (Scenario: Duplicate journey rows collapse to one)", async () => {
    const rows: Row[] = [
      { id: "j3", userId: "user-1", type: "couple", status: "SAVED", updatedAt: T3 },
      { id: "j2", userId: "user-1", type: "couple", status: "DRAFT", updatedAt: T2 },
      { id: "j1", userId: "user-1", type: "couple", status: "SAVED", updatedAt: T1 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, true);

    expect(result.kept).toEqual(["j3"]);
    expect(result.cancelled.sort()).toEqual(["j1", "j2"]);
    expect(client.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("cleans journey and xsed families independently for the same user (Scenario: Families are cleaned independently)", async () => {
    const rows: Row[] = [
      { id: "j2", userId: "user-1", type: "family", status: "SAVED", updatedAt: T2 },
      { id: "j1", userId: "user-1", type: "solo", status: "DRAFT", updatedAt: T1 },
      { id: "x2", userId: "user-1", type: "xsed", status: "PENDING_PAYMENT", updatedAt: T3 },
      { id: "x1", userId: "user-1", type: "xsed", status: "SAVED", updatedAt: T1 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, true);

    expect(result.kept.sort()).toEqual(["j2", "x2"]);
    expect(result.cancelled.sort()).toEqual(["j1", "x1"]);
    expect(result.groups).toBe(2);
  });

  it("leaves a single non-terminal row per family untouched (Scenario: Single non-terminal row is left untouched)", async () => {
    const rows: Row[] = [
      { id: "solo-1", userId: "user-2", type: "couple", status: "SAVED", updatedAt: T1 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, true);

    expect(result.kept).toEqual(["solo-1"]);
    expect(result.cancelled).toEqual([]);
    expect(result.groups).toBe(0);
  });

  it("queries only non-terminal statuses, so terminal rows are never fetched or touched", async () => {
    const client = makeMockClient([]);

    await cleanupDuplicateTripRequests(client as never, true);

    expect(client.tripRequest.findMany).toHaveBeenCalledWith({
      where: { status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] } },
      select: { id: true, userId: true, type: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("performs no writes in dry-run mode, only returning the plan", async () => {
    const rows: Row[] = [
      { id: "j2", userId: "user-1", type: "couple", status: "SAVED", updatedAt: T2 },
      { id: "j1", userId: "user-1", type: "couple", status: "DRAFT", updatedAt: T1 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, true);

    expect(result.dryRun).toBe(true);
    expect(client.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("applies the cancellation via updateMany with a status re-check guard when --apply (dryRun=false)", async () => {
    const rows: Row[] = [
      { id: "j2", userId: "user-1", type: "couple", status: "SAVED", updatedAt: T2 },
      { id: "j1", userId: "user-1", type: "couple", status: "DRAFT", updatedAt: T1 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, false);

    expect(result.dryRun).toBe(false);
    expect(client.tripRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["j1"] },
        status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] },
      },
      data: { status: "CANCELLED" },
    });
  });

  it("is idempotent — a second run finds at most one non-terminal row per bucket and cancels nothing", async () => {
    const rows: Row[] = [
      { id: "j2", userId: "user-1", type: "couple", status: "SAVED", updatedAt: T2 },
    ];
    const client = makeMockClient(rows);

    const result = await cleanupDuplicateTripRequests(client as never, false);

    expect(result.cancelled).toEqual([]);
    expect(client.tripRequest.updateMany).not.toHaveBeenCalled();
  });
});
