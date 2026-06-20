import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type RouteModule = typeof import("../route");

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});

const mockAdminUser = (id: string) => ({
  id,
  roles: ["ADMIN"],
});

const mockClientUser = (id: string) => ({
  id,
  roles: ["CLIENT"],
});

const pendingExperience = (extra: Record<string, unknown> = {}) => ({
  id: "exp-1",
  status: "PENDING_REVIEW",
  reviewLockedBy: null,
  title: "Test Experience",
  ...extra,
});

function makePostRequest(id: string): Request {
  return new Request(
    `http://localhost/api/admin/experiences/${id}/start-edit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/admin/experiences/[id]/start-edit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("client-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockClientUser("client-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when experience does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      return cb({
        experience: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
          update: vi.fn(),
        },
      });
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 when another admin already holds the lock", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockImplementation(
      (args: { where: { id: string } }) => {
        if (args.where.id === "admin-1") return Promise.resolve(mockAdminUser("admin-1"));
        if (args.where.id === "admin-2") return Promise.resolve({ id: "admin-2", name: "Admin Two", email: "admin2@example.com" });
        return Promise.resolve(null);
      },
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      return cb({
        experience: {
          findUnique: vi.fn().mockResolvedValue(
            pendingExperience({ reviewLockedBy: "admin-2" }),
          ),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
          update: vi.fn(),
        },
      });
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.lockedBy).toBe("admin-2");
  });

  it("returns 201 with copy id on first start-edit (creates copy + sets lock)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      return cb({
        experience: {
          findUnique: vi.fn().mockResolvedValue(pendingExperience()),
          findFirst: vi.fn().mockResolvedValue(null), // no existing copy
          create: vi.fn().mockResolvedValue({ id: "copy-1" }),
          update: vi.fn().mockResolvedValue({ id: "exp-1", reviewLockedBy: "admin-1" }),
        },
      });
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.copyId).toBe("copy-1");
  });

  it("returns 200 (idempotent) when the same admin already holds the lock and copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      return cb({
        experience: {
          findUnique: vi.fn().mockResolvedValue(
            pendingExperience({ reviewLockedBy: "admin-1" }),
          ),
          findFirst: vi.fn().mockResolvedValue({ id: "existing-copy-1" }),
          create: vi.fn(),
          update: vi.fn(),
        },
      });
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.copyId).toBe("existing-copy-1");
  });
});
