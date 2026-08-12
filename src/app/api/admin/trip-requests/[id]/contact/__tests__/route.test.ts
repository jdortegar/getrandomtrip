import { describe, it, expect, vi, beforeEach } from "vitest";

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
    tripRequest: { findUnique: vi.fn() },
    tripContactMessage: { create: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  sendAdminTripContactMessage: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendAdminTripContactMessage } from "@/lib/email";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTravelerUser = (id: string) => ({ id, roles: ["TRAVELER"] });
const mockSession = (userId: string) => ({ user: { id: userId } });

function makeRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/admin/trip-requests/${id}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function callPost(mod: RouteModule, id: string, body: unknown) {
  return mod.POST(makeRequest(id, body), { params: Promise.resolve({ id }) });
}

const validBody = { subject: "Hello traveler", body: "Just checking in." };

describe("POST /api/admin/trip-requests/[id]/contact", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 with no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-1", validBody);
    expect(res.status).toBe(401);
    expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
    expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("u1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTravelerUser("u1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-1", validBody);
    expect(res.status).toBe(403);
    expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
    expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
  });

  describe("validation (400)", () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAdminUser("admin-1"),
      );
    });

    it("rejects an empty subject", async () => {
      const mod = (await import("../route")) as RouteModule;
      const res = await callPost(mod, "trip-1", { subject: "  ", body: "Body" });
      expect(res.status).toBe(400);
      expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
      expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
    });

    it("rejects an empty body", async () => {
      const mod = (await import("../route")) as RouteModule;
      const res = await callPost(mod, "trip-1", { subject: "Subject", body: "   " });
      expect(res.status).toBe(400);
      expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
      expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
    });

    it("rejects a subject over 200 chars", async () => {
      const mod = (await import("../route")) as RouteModule;
      const res = await callPost(mod, "trip-1", {
        subject: "a".repeat(201),
        body: "Body",
      });
      expect(res.status).toBe(400);
      expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
      expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
    });

    it("rejects a body over 4000 chars", async () => {
      const mod = (await import("../route")) as RouteModule;
      const res = await callPost(mod, "trip-1", {
        subject: "Subject",
        body: "a".repeat(4001),
      });
      expect(res.status).toBe(400);
      expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
      expect(prisma.tripContactMessage.create).not.toHaveBeenCalled();
    });
  });

  it("returns 404 when the trip does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-missing", validBody);
    expect(res.status).toBe(404);
    expect(sendAdminTripContactMessage).not.toHaveBeenCalled();
  });

  it("sends, writes a SENT audit row, and returns 200 on success", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-1")) // requireAdmin's caller lookup
      .mockResolvedValueOnce({ email: "admin@example.com" }); // admin's own email lookup
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      user: { email: "traveler@example.com", locale: "es", name: "Juana" },
    });
    (sendAdminTripContactMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (prisma.tripContactMessage.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "msg-1",
      status: "SENT",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-1", validBody);

    expect(res.status).toBe(200);
    expect(sendAdminTripContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        adminEmail: "admin@example.com",
        body: validBody.body,
        subject: validBody.subject,
        traveler: { email: "traveler@example.com", locale: "es", name: "Juana" },
      }),
    );
    expect(prisma.tripContactMessage.create).toHaveBeenCalledTimes(1);
    const createArgs = (prisma.tripContactMessage.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(createArgs.data).toMatchObject({
      tripRequestId: "trip-1",
      subject: validBody.subject,
      body: validBody.body,
      adminId: "admin-1",
      adminEmail: "admin@example.com",
      status: "SENT",
      error: null,
    });
  });

  it("writes a FAILED audit row and returns 502 when the send throws", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-1"))
      .mockResolvedValueOnce({ email: "admin@example.com" });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      user: { email: "traveler@example.com", locale: "es", name: "Juana" },
    });
    (sendAdminTripContactMessage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Resend down"),
    );
    (prisma.tripContactMessage.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "msg-1",
      status: "FAILED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-1", validBody);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json).toEqual({ error: "send_failed" });
    expect(prisma.tripContactMessage.create).toHaveBeenCalledTimes(1);
    const createArgs = (prisma.tripContactMessage.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(createArgs.data.status).toBe("FAILED");
    expect(createArgs.data.error).toBe("Resend down");
  });

  it("sends on a CANCELLED trip with no status-based gating", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-1"))
      .mockResolvedValueOnce({ email: "admin@example.com" });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      status: "CANCELLED",
      user: { email: "traveler@example.com", locale: "es", name: "Juana" },
    });
    (sendAdminTripContactMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (prisma.tripContactMessage.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "msg-1",
      status: "SENT",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await callPost(mod, "trip-1", validBody);

    expect(res.status).toBe(200);
    expect(sendAdminTripContactMessage).toHaveBeenCalledTimes(1);
  });
});
