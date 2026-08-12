import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripDocument: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

const storeDeleteMock = vi.fn();
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: () => ({ delete: storeDeleteMock }),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTravelerUser = (id: string) => ({ id, roles: ["TRAVELER"] });
const mockSession = (userId: string) => ({ user: { id: userId } });

function makeProps(documentId: string) {
  return { params: Promise.resolve({ documentId }) };
}

function makeRequest(): Request {
  return new Request("http://localhost/api/admin/trip-documents/doc-1", {
    method: "DELETE",
  });
}

describe("DELETE /api/admin/trip-documents/[documentId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 with no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("u1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTravelerUser("u1"));
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-1"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when the document does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-missing"),
    );
    expect(res.status).toBe(404);
  });

  it("admin B removes admin A's upload — 204 (regression proof: no uploader-ownership check)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-B"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-B"));
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "doc-1",
      storageKey: "trip-1/uuid",
      uploadedById: "admin-A",
    });
    (prisma.tripDocument.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "doc-1" });
    storeDeleteMock.mockResolvedValue(undefined);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-1"),
    );
    expect(res.status).toBe(204);
    expect(prisma.tripDocument.delete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
  });

  it("still returns 204 with the row deleted when the blob delete fails (best-effort)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "doc-1",
      storageKey: "trip-1/uuid",
      uploadedById: "admin-1",
    });
    (prisma.tripDocument.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "doc-1" });
    storeDeleteMock.mockRejectedValue(new Error("blob store down"));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-1"),
    );
    expect(res.status).toBe(204);
    expect(prisma.tripDocument.delete).toHaveBeenCalledTimes(1);
  });

  it("deletes the row BEFORE attempting the blob delete", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "doc-1",
      storageKey: "trip-1/uuid",
      uploadedById: "admin-1",
    });

    const callOrder: string[] = [];
    (prisma.tripDocument.delete as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push("row");
      return { id: "doc-1" };
    });
    storeDeleteMock.mockImplementation(async () => {
      callOrder.push("blob");
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.DELETE(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("doc-1"),
    );
    expect(callOrder).toEqual(["row", "blob"]);
  });
});
