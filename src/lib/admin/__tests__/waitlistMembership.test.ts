import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { findExistingUserEmails } from "../waitlistMembership";

describe("findExistingUserEmails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns an empty Set and never queries prisma for an empty input array", async () => {
    const result = await findExistingUserEmails([]);

    expect(result).toEqual(new Set());
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("runs a single batched findMany and returns a Set of the matched emails", async () => {
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { email: "alice@example.com" },
      { email: "bob@example.com" },
    ]);

    const result = await findExistingUserEmails([
      "alice@example.com",
      "bob@example.com",
      "carol@example.com",
    ]);

    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        email: { in: ["alice@example.com", "bob@example.com", "carol@example.com"] },
      },
      select: { email: true },
    });
    expect(result).toEqual(new Set(["alice@example.com", "bob@example.com"]));
  });

  it("returns an empty Set when no emails match", async () => {
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await findExistingUserEmails(["nobody@example.com"]);

    expect(result).toEqual(new Set());
  });
});
