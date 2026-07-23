import { describe, it, expect, vi } from "vitest";
import { backfillEmailVerified } from "../backfill-email-verified";

function makeMockClient(countResults: number[] = [0, 0, 0, 0]) {
  let callIndex = 0;
  return {
    user: {
      count: vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(countResults[callIndex++] ?? 0),
        ),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe("backfillEmailVerified", () => {
  it("marks OAuth-only accounts (password IS NULL) as verified (Scenario: OAuth-only accounts backfilled verified)", async () => {
    const client = makeMockClient();
    await backfillEmailVerified(client as never);

    expect(client.user.updateMany).toHaveBeenCalledWith({
      where: { password: null, emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("marks credential accounts (password IS NOT NULL) as unverified (Scenario: credential accounts backfilled unverified)", async () => {
    const client = makeMockClient();
    await backfillEmailVerified(client as never);

    expect(client.user.updateMany).toHaveBeenCalledWith({
      where: { password: { not: null } },
      data: { emailVerified: null },
    });
  });

  it("is idempotent — a second run with nothing left to change updates zero rows", async () => {
    const client = makeMockClient([0, 0, 0, 0, 0]);
    client.user.updateMany.mockResolvedValue({ count: 0 });

    const result = await backfillEmailVerified(client as never);

    expect(result.aborted).toBe(false);
    if (result.aborted) throw new Error("unreachable");
    expect(result.oauthUpdated.count).toBe(0);
    expect(result.credentialUpdated.count).toBe(0);
  });

  describe("re-run safety guard", () => {
    it("aborts without making any changes when credential users are already verified and --force is not passed", async () => {
      // First `count` call is the guard check: any credential user already verified?
      const client = makeMockClient([1]);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await backfillEmailVerified(client as never, false);

      expect(result).toEqual({ aborted: true });
      expect(client.user.updateMany).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/force/i);

      warnSpy.mockRestore();
    });

    it("proceeds and applies the backfill when --force is passed even though already-verified credential users exist", async () => {
      const client = makeMockClient([1, 0, 0, 0, 0]);

      const result = await backfillEmailVerified(client as never, true);

      expect(result.aborted).toBe(false);
      expect(client.user.updateMany).toHaveBeenCalledTimes(2);
    });

    it("proceeds normally (no guard trip) when no credential user is verified yet", async () => {
      const client = makeMockClient([0, 0, 0, 0, 0]);

      const result = await backfillEmailVerified(client as never, false);

      expect(result.aborted).toBe(false);
      expect(client.user.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
