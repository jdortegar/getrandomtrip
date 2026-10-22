/**
 * Covers the public waitlist signup route (`src/app/api/waitlist/route.ts`),
 * which has no `__tests__` folder of its own, for its Contact side effect.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { waitlistEntry: { upsert: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/contacts", () => ({
  upsertWaitlistContact: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { upsertWaitlistContact } from "@/lib/email-campaigns/contacts";
import { POST } from "@/app/api/waitlist/route";

function signup(body: unknown) {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.waitlistEntry.upsert).mockResolvedValue({} as never);
});

describe("POST /api/waitlist contact sync", () => {
  it("upserts a waitlist contact with the full name after storing the entry", async () => {
    const res = await signup({
      email: "Ana@Example.com",
      name: "Ana",
      lastName: "Pérez",
    });

    expect(res.status).toBe(200);
    expect(upsertWaitlistContact).toHaveBeenCalledWith({
      email: "ana@example.com",
      name: "Ana Pérez",
    });
    expect(
      vi.mocked(prisma.waitlistEntry.upsert).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(upsertWaitlistContact).mock.invocationCallOrder[0]);
  });

  it("still succeeds when the contact upsert throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(upsertWaitlistContact).mockRejectedValue(new Error("db down"));

    const res = await signup({ email: "ana@example.com" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not touch contacts when the entry cannot be stored", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(prisma.waitlistEntry.upsert).mockRejectedValue(new Error("x"));

    const res = await signup({ email: "ana@example.com" });

    expect(res.status).toBe(500);
    expect(upsertWaitlistContact).not.toHaveBeenCalled();
  });
});
