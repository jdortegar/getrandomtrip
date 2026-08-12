import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    tripDocument: { create: vi.fn() },
  },
}));

const storeSetMock = vi.fn();
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: () => ({ set: storeSetMock }),
  buildTripDocumentKey: vi.fn(() => "trip-1/uuid-fixed"),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTravelerUser = (id: string) => ({ id, roles: ["TRAVELER"] });
const mockSession = (userId: string) => ({ user: { id: userId } });

function makeFormRequest(fields: Record<string, string | File>): Request {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  return new Request("http://localhost/api/admin/trip-documents", {
    method: "POST",
    body: form,
  });
}

function makeFile(name: string, type: string, sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("POST /api/admin/trip-documents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "AR",
        file: makeFile("a.pdf", "application/pdf"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("u1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTravelerUser("u1"));
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "AR",
        file: makeFile("a.pdf", "application/pdf"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when the trip does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-missing",
        label: "Hotel",
        country: "AR",
        file: makeFile("a.pdf", "application/pdf"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(404);
  });

  it("returns 413 when the file exceeds 10MB", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "trip-1" });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "AR",
        file: makeFile("a.pdf", "application/pdf", 11 * 1024 * 1024),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(413);
  });

  it("returns 415 for an unsupported mime type (e.g. SVG)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "trip-1" });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "AR",
        file: makeFile("a.svg", "image/svg+xml"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(415);
  });

  it("returns 422 for an off-catalog country code", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "trip-1" });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "ZZ",
        file: makeFile("a.pdf", "application/pdf"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(422);
  });

  it("accepts country: 'CO' (Colombia) — the exact input a closed 5-market list would have wrongly rejected", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "trip-1" });
    storeSetMock.mockResolvedValue(undefined);
    (prisma.tripDocument.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "doc-1",
      tripRequestId: "trip-1",
      label: "Hotel",
      country: "CO",
      mimeType: "application/pdf",
      originalFilename: "a.pdf",
      sizeBytes: 100,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makeFormRequest({
        tripRequestId: "trip-1",
        label: "Hotel",
        country: "CO",
        file: makeFile("a.pdf", "application/pdf"),
      }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.document.country).toBe("CO");
    expect(JSON.stringify(body)).not.toContain("storageKey");
  });
});
