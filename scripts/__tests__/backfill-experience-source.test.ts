import { describe, it, expect, vi } from "vitest";
import { backfillExperienceSource } from "../backfill-experience-source";

function makeMockClient(countResults: number[] = [0, 3]) {
  let callIndex = 0;
  return {
    experience: {
      count: vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(countResults[callIndex++] ?? 0),
        ),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  };
}

describe("backfillExperienceSource", () => {
  it("updates only exact XSED array-element matches to RANDOMTRIP (Scenario: existing XSED drops backfilled)", async () => {
    const client = makeMockClient();
    await backfillExperienceSource(client as never);

    expect(client.experience.updateMany).toHaveBeenCalledWith({
      where: { type: { has: "XSED" } },
      data: { source: "RANDOMTRIP" },
    });
    // must NOT use a substring/contains matcher that would false-positive on
    // e.g. type: ["XSEDONFRIDAY"] — the query shape above is Prisma's exact
    // array-element match ('XSED' = ANY(type)), not `contains`/`startsWith`.
    expect(client.experience.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: expect.objectContaining({ contains: expect.anything() }),
        }),
      }),
    );
  });

  it("returns the matched count from updateMany so re-runs can be verified as no-op (idempotency)", async () => {
    const client = makeMockClient([3, 3]);
    client.experience.updateMany.mockResolvedValue({ count: 0 });

    const result = await backfillExperienceSource(client as never);

    expect(result.count).toBe(0);
  });
});
