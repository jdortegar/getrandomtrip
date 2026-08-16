import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  issueAccessInvite: vi.fn().mockResolvedValue("plaintext-token"),
}));

vi.mock("@/lib/email", () => ({
  sendAccessInviteEmail: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { issueAccessInvite } from "@/lib/auth/accessInviteTokens";
import { sendAccessInviteEmail } from "@/lib/email";

function makeRequest() {
  return new Request(
    "http://localhost/api/admin/users/target-1/invite-tripper",
    { method: "POST" },
  ) as unknown as import("next/server").NextRequest;
}

function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/users/[id]/invite-tripper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-admin caller with 403", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "caller-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: "caller-1", roles: ["TRAVELER"] },
    );

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("target-1"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBeDefined();
    expect(issueAccessInvite).not.toHaveBeenCalled();
  });

  it("rejects with 400 when the target already has TRIPPER or ADMIN", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "admin-1", roles: ["ADMIN"] })
      .mockResolvedValueOnce({
        id: "target-1",
        email: "bob@example.com",
        locale: "en",
        roles: ["TRAVELER", "TRIPPER"],
      });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("target-1"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(issueAccessInvite).not.toHaveBeenCalled();
  });

  it("issues + sends the invite using the target user's locale, unaltering their roles", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "admin-1", roles: ["ADMIN"] })
      .mockResolvedValueOnce({
        id: "target-1",
        email: "bob@example.com",
        locale: "en",
        roles: ["TRAVELER"],
      });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("target-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueAccessInvite).toHaveBeenCalledWith(
      "bob@example.com",
      "TRIPPER",
    );
    expect(sendAccessInviteEmail).toHaveBeenCalledWith(
      "bob@example.com",
      "plaintext-token",
      "en",
      "TRIPPER",
    );
    // Only two findUnique calls (caller + target) — no update call on the target.
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it("falls back to es when the target user has no locale set", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "admin-1", roles: ["ADMIN"] })
      .mockResolvedValueOnce({
        id: "target-2",
        email: "carol@example.com",
        locale: null,
        roles: ["TRAVELER"],
      });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("target-2"));
    expect(res.status).toBe(200);
    expect(sendAccessInviteEmail).toHaveBeenCalledWith(
      "carol@example.com",
      "plaintext-token",
      "es",
      "TRIPPER",
    );
  });
});
