import { describe, it, expect, vi } from "vitest";
import { backfillTripperSince } from "../backfill-tripper-since";

function makeMockClient(count = 0) {
  return {
    user: {
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
  };
}

describe("backfillTripperSince", () => {
  it("sets tripperSince to now for trippers where it's still null", async () => {
    const client = makeMockClient(3);

    const result = await backfillTripperSince(client as never);

    expect(client.user.updateMany).toHaveBeenCalledWith({
      where: { roles: { has: "TRIPPER" }, tripperSince: null },
      data: { tripperSince: expect.any(Date) },
    });
    expect(result.count).toBe(3);
  });

  it("is idempotent — a second run with nothing left to backfill updates zero rows", async () => {
    const client = makeMockClient(0);

    const result = await backfillTripperSince(client as never);

    expect(result.count).toBe(0);
  });
});
