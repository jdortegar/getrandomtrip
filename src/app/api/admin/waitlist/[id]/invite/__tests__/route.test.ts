import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    waitlistEntry: { findUnique: vi.fn() },
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
    "http://localhost/api/admin/waitlist/entry-1/invite",
    { method: "POST" },
  ) as unknown as import("next/server").NextRequest;
}

function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/waitlist/[id]/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-admin caller with 403 and creates no invite", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "caller-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "caller-1",
      roles: ["TRAVELER"],
    });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("entry-1"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBeDefined();
    expect(issueAccessInvite).not.toHaveBeenCalled();
    expect(sendAccessInviteEmail).not.toHaveBeenCalled();
  });

  it("issues + sends a SITE_ACCESS invite in es for a valid waitlist id, without altering the entry", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      roles: ["ADMIN"],
    });
    (
      prisma.waitlistEntry.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "entry-1",
      email: "alice@example.com",
    });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("entry-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueAccessInvite).toHaveBeenCalledWith(
      "alice@example.com",
      "SITE_ACCESS",
    );
    expect(sendAccessInviteEmail).toHaveBeenCalledWith(
      "alice@example.com",
      "plaintext-token",
      "es",
      "SITE_ACCESS",
    );
  });

  it("succeeds (no 400) for an existing-User email — the existing-user guard is removed", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      roles: ["ADMIN"],
    });
    (
      prisma.waitlistEntry.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "entry-1",
      email: "dana@example.com",
    });

    const mod = await import("../route");
    const res = await mod.POST(makeRequest(), makeProps("entry-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueAccessInvite).toHaveBeenCalledWith(
      "dana@example.com",
      "SITE_ACCESS",
    );
    expect(sendAccessInviteEmail).toHaveBeenCalledWith(
      "dana@example.com",
      "plaintext-token",
      "es",
      "SITE_ACCESS",
    );
  });
});
