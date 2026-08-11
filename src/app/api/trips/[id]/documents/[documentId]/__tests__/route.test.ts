import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn(), count: vi.fn() },
    tripDocument: { findUnique: vi.fn() },
  },
}));

const storeGetMock = vi.fn();
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: () => ({ get: storeGetMock }),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockTraveler = (id: string) => ({ id, roles: ["TRAVELER"] });
const mockAdmin = (id: string) => ({ id, roles: ["ADMIN"] });
const mockSession = (email: string) => ({ user: { email } });

function makeProps(id: string, documentId: string) {
  return { params: Promise.resolve({ id, documentId }) };
}

function makeRequest(query = ""): Request {
  return new Request(`http://localhost/api/trips/trip-1/documents/doc-1${query}`);
}

const mockDoc = {
  id: "doc-1",
  tripRequestId: "trip-1",
  label: "Hotel",
  country: "AR",
  mimeType: "application/pdf",
  originalFilename: "hotel.pdf",
  sizeBytes: 100,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("GET /api/trips/[id]/documents/[documentId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 with no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for a stranger (not buyer, not companion, not admin)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("stranger@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("stranger-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 for a companion linked to a DIFFERENT trip only", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("companion@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("companion-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 for a pre-REVEALED buyer (CONFIRMED)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("buyer@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("buyer-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "CONFIRMED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 200 for the buyer on a CANCELLED trip (refund-dispute case)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("buyer@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("buyer-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "CANCELLED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);
    storeGetMock.mockResolvedValue(new Blob(["file-bytes"]));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 200 for a companion on a REVEALED trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("companion@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("companion-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);
    storeGetMock.mockResolvedValue(new Blob(["file-bytes"]));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 200 for an admin on a pre-REVEALED (CONFIRMED) trip — exempt from the gate", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdmin("admin-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "CONFIRMED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);
    storeGetMock.mockResolvedValue(new Blob(["file-bytes"]));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 when the document does not belong to this trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("buyer@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("buyer-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockDoc,
      tripRequestId: "trip-OTHER",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.status).toBe(404);
  });

  it("sets Content-Disposition: attachment when ?download=1", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("buyer@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("buyer-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);
    storeGetMock.mockResolvedValue(new Blob(["file-bytes"]));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest("?download=1") as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("defaults to inline Content-Disposition without ?download", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("buyer@x.com"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTraveler("buyer-1"));
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      userId: "buyer-1",
      status: "REVEALED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);
    storeGetMock.mockResolvedValue(new Blob(["file-bytes"]));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      makeRequest() as unknown as import("next/server").NextRequest,
      makeProps("trip-1", "doc-1"),
    );
    expect(res.headers.get("Content-Disposition")).toContain("inline");
  });
});
