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
    experience: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockClientUser = (id: string) => ({ id, roles: ["CLIENT"] });

function adminSession(userId = "admin-1") {
  return { user: { id: userId, email: "admin@example.com" } };
}

function makeRequest(method: string, body?: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/xsed/drop-id", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const routeParams = { params: Promise.resolve({ id: "drop-id" }) };

// ── Tests ──────────────────────────────────────────────────────────────────
describe("GET /api/admin/xsed/[id]", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.resetModules());

  it("returns 401 when unauthenticated", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin user", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession("client-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockClientUser("client-1"));
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 200 with the drop when it exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const drop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      titleInternal: "Test drop",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(drop);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.drop.id).toBe("drop-id");
  });

  it("returns 404 when the drop does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/admin/xsed/[id]", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.resetModules());

  it("updates titleInternal only and leaves other fields unchanged (partial update)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      destinationCity: "Madrid",
      destinationCountry: "Spain",
      titleInternal: "Old title",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);
    const updatedDrop = { ...existingDrop, titleInternal: "New title" };
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedDrop);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PUT(makeRequest("PUT", { titleInternal: "New title" }), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.drop.titleInternal).toBe("New title");

    const updateCall = (prisma.experience.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.titleInternal).toBe("New title");
    expect(updateCall.data.title).toBe("New title");
  });

  it("does NOT overwrite type and ownerId even when supplied in the payload", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      destinationCity: "Madrid",
      destinationCountry: "Spain",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);

    const mod = (await import("../route")) as RouteModule;
    await mod.PUT(
      makeRequest("PUT", { type: "TRIPPER_EXPERIENCE", ownerId: "other-user" }),
      routeParams,
    );

    const updateCall = (prisma.experience.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("type");
    expect(updateCall.data).not.toHaveProperty("ownerId");
  });

  it("returns 422 when setting status=ACTIVE with empty destinationCity", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      destinationCity: "", // empty
      destinationCountry: "Spain",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PUT(makeRequest("PUT", { status: "ACTIVE" }), routeParams);
    expect(res.status).toBe(422);
    // Record must NOT have been updated
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });

  it("returns 200 when setting status=ACTIVE with destination populated", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      destinationCity: "Buenos Aires",
      destinationCountry: "Argentina",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);
    const updatedDrop = { ...existingDrop, status: "ACTIVE" };
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedDrop);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PUT(makeRequest("PUT", { status: "ACTIVE" }), routeParams);
    expect(res.status).toBe(200);
  });

  it("returns 200 when updating with the record's own current slug (no false collision)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      slug: "2025-01-05-madrid",
      destinationCity: "Madrid",
      destinationCountry: "Spain",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PUT(
      makeRequest("PUT", { slug: "2025-01-05-madrid" }),
      routeParams,
    );
    expect(res.status).toBe(200);
  });

  it("returns 409 on slug conflict (P2002)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    const existingDrop = {
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
      ownerId: "admin-1",
      destinationCity: "Paris",
      destinationCountry: "France",
    };
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingDrop);
    const prismaError = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockRejectedValue(prismaError);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PUT(
      makeRequest("PUT", { slug: "2025-01-05-madrid" }),
      routeParams,
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty("error", "slug_conflict");
  });
});

describe("DELETE /api/admin/xsed/[id]", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.resetModules());

  it("deletes a DRAFT drop and returns 204", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "drop-id",
      type: "XSED",
      status: "DRAFT",
    });
    (prisma.experience.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(204);
  });

  it("deletes an ARCHIVED drop and returns 204", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "drop-id",
      type: "XSED",
      status: "ARCHIVED",
    });
    (prisma.experience.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(204);
  });

  it("returns 422 when attempting to delete an ACTIVE drop", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(adminSession());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "drop-id",
      type: "XSED",
      status: "ACTIVE",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(422);
    // Record must NOT have been deleted
    expect(prisma.experience.delete).not.toHaveBeenCalled();
  });
});
