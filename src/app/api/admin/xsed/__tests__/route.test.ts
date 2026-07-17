import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

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
    experience: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
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

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/xsed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/admin/xsed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Auto-slug numbering — count value is irrelevant to every test below.
    (prisma.experience.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ titleInternal: "A mystery trip" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user is not an admin (CLIENT role)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-client-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockClientUser("user-client-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ titleInternal: "A mystery trip" }));
    expect(res.status).toBe(403);
  });

  it("creates a minimal DRAFT with type=XSED and returns 201 { id }", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-xsed-id",
      type: "XSED",
      status: "DRAFT",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ titleInternal: "Escape the city" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id", "new-xsed-id");

    // Verify the prisma call sets type=[XSED] (array field) and ownerId
    const createCall = (prisma.experience.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.type).toEqual(["XSED"]);
    expect(createCall.data.ownerId).toBe("admin-1");
    expect(createCall.data.status).toBe("DRAFT");
  });

  it("auto-calculates revealAt as tripDate − 48h when revealAt is not supplied", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "drop-auto-reveal",
    });
    const mod = (await import("../route")) as RouteModule;
    const tripDate = "2025-06-07T12:00:00.000Z";
    const res = await mod.POST(makePostRequest({ titleInternal: "drop", tripDate }));
    expect(res.status).toBe(201);

    const createCall = (prisma.experience.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const expectedRevealAt = new Date(
      new Date(tripDate).getTime() - 48 * 60 * 60 * 1000,
    );
    expect(createCall.data.revealAt?.getTime()).toBe(expectedRevealAt.getTime());
  });

  it("uses the supplied revealAt and does NOT auto-calculate when revealAt is provided", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "drop-manual-reveal",
    });
    const mod = (await import("../route")) as RouteModule;
    const tripDate = "2025-06-07T12:00:00.000Z";
    const revealAt = "2025-06-05T08:00:00.000Z"; // custom, NOT tripDate-48h
    const res = await mod.POST(makePostRequest({ titleInternal: "drop", tripDate, revealAt }));
    expect(res.status).toBe(201);

    const createCall = (prisma.experience.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const expectedRevealAt = new Date(revealAt);
    expect(createCall.data.revealAt?.getTime()).toBe(expectedRevealAt.getTime());
  });

  it("returns 409 when Prisma throws a P2002 unique constraint error (slug conflict)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    const prismaError = Object.assign(new Error("Unique constraint"), {
      code: "P2002",
    });
    (prisma.experience.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      prismaError,
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ titleInternal: "drop", slug: "2025-01-05-madrid" }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty("error", "slug_conflict");
  });
});
