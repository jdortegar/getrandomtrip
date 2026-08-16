import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    waitlistEntry: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  getAccessInviteStatuses: vi.fn().mockResolvedValue(new Map()),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getAccessInviteStatuses } from "@/lib/auth/accessInviteTokens";

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/admin/waitlist${query}`);
}

const mockSession = (userId: string) => ({ user: { id: userId } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });

function waitlistRow(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: "entry-1",
    email: "x@example.com",
    createdAt: new Date("2026-01-01"),
    lastName: null,
    name: null,
    ...overrides,
  };
}

describe("GET /api/admin/waitlist — alreadyMember enrichment", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.waitlistEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
    (prisma.waitlistEntry.count as ReturnType<typeof vi.fn>).mockResolvedValue(
      0,
    );
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (
      getAccessInviteStatuses as ReturnType<typeof vi.fn>
    ).mockResolvedValue(new Map());
    const mod = (await import("../route")) as RouteModule;
    GET = mod.GET;
  });

  it("marks alreadyMember true when the email matches an existing user of any role", async () => {
    const row = waitlistRow({ id: "entry-1", email: "x@example.com" });
    (prisma.waitlistEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [row],
    );
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { email: "x@example.com" },
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.entries[0].alreadyMember).toBe(true);
  });

  it("marks alreadyMember false when no user matches", async () => {
    const row = waitlistRow({ id: "entry-2", email: "nomatch@example.com" });
    (prisma.waitlistEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [row],
    );
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.entries[0].alreadyMember).toBe(false);
  });

  it("calls user.findMany exactly once per page", async () => {
    const rows = [
      waitlistRow({ id: "entry-1", email: "a@example.com" }),
      waitlistRow({ id: "entry-2", email: "b@example.com" }),
    ];
    (prisma.waitlistEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      rows,
    );
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await GET(makeRequest());

    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });
});
