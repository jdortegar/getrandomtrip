// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/db/createTripDocumentDraft", () => ({
  createTripDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/tripDocumentLocks", () => ({
  withTripDocumentLocks: vi.fn(),
}));
vi.mock("@/lib/db/loadTripDocumentSource", () => ({
  loadTripDocumentSource: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { GET, POST } from "../route";
const context = { params: Promise.resolve({ id: "trip" }) };
const findMany = vi.fn();
function request(body = '{"template":"hotel-voucher"}') {
  return new Request("http://localhost", {
    method: "POST",
    body,
  }) as NextRequest;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin" },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    id: "trip",
    userId: "buyer",
  } as never);
  vi.mocked(createTripDocumentDraft).mockResolvedValue({
    ok: true,
    value: { id: "new" },
  } as never);
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({ tripDocumentDraft: { findMany } } as never),
  );
  vi.mocked(loadTripDocumentSource).mockResolvedValue({
    trip: {},
    provider: {
      kind: "experience",
      hotels: [{ name: "Hotel", location: "Street" }],
    },
  });
  findMany.mockResolvedValue([]);
});
it.each([GET, POST])(
  "authenticates before reading trip or body",
  async (handler) => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const req = request();
    const read = vi.spyOn(req.body!, "getReader");
    const response = await handler(req, context);
    expect(response.status).toBe(401);
    expect(read).not.toHaveBeenCalled();
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  },
);
it("rejects stale roles and missing trips", async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    roles: ["TRAVELER"],
  } as never);
  expect((await POST(request(), context)).status).toBe(403);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
  expect((await GET(request(), context)).status).toBe(404);
});
it("creates with DB owner, never admin identity or client snapshots", async () => {
  const response = await POST(request(), context);
  expect(response.status).toBe(201);
  expect(createTripDocumentDraft).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripRequestId: "trip" },
    { template: "hotel-voucher" },
    loadTripDocumentSource,
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("lists only scoped DTOs and candidate facts without private keys", async () => {
  findMany.mockResolvedValue([
    {
      ...createTripDocumentSnapshot("hotel-voucher", {}),
      id: "draft",
      tripRequestId: "trip",
      revision: 1,
      documentId: null,
      publishedRevision: null,
      previewId: null,
      previewRevision: null,
      previewKey: "secret-key",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const response = await GET(request(), context);
  const body = await response.json();
  expect(body.drafts[0].id).toBe("draft");
  expect(JSON.stringify(body)).not.toContain("secret-key");
  expect(body.candidates.hotel[0].title).toBe("Hotel");
  expect(findMany).toHaveBeenCalledWith({
    where: { tripRequestId: "trip" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  expect(withTripDocumentLocks).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripIds: ["trip"] },
    expect.any(Function),
  );
});
it.each(["", "{", "x".repeat(128 * 1024 + 1)])(
  "rejects malformed or oversized input",
  async (body) => {
    expect((await POST(request(body), context)).status).toBe(
      body.length > 128 * 1024 ? 413 : 400,
    );
    expect(createTripDocumentDraft).not.toHaveBeenCalled();
  },
);
it("bounds actual streamed bytes despite false content length", async () => {
  const cancel = vi.fn();
  let i = 0;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(++i === 1 ? 128 * 1024 : 1));
    },
    cancel,
  });
  const req = new Request("http://localhost", {
    method: "POST",
    body,
    duplex: "half",
    headers: { "content-length": "1" },
  } as RequestInit & { duplex: string });
  expect((await POST(req as NextRequest, context)).status).toBe(413);
  expect(cancel).toHaveBeenCalled();
});
it("returns field validation errors without mutation success", async () => {
  vi.mocked(createTripDocumentDraft).mockResolvedValue({
    ok: false,
    errors: [{ path: "locale", code: "invalid_locale" }],
  });
  expect((await POST(request(), context)).status).toBe(422);
});
it.each(["auth", "trip", "create", "list"])(
  "contains %s failures",
  async (source) => {
    const error = new Error("secret.internal");
    if (source === "auth") vi.mocked(getServerSession).mockRejectedValue(error);
    if (source === "trip")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(error);
    if (source === "create")
      vi.mocked(createTripDocumentDraft).mockRejectedValue(error);
    if (source === "list") findMany.mockRejectedValue(error);
    const response = await (source === "list" ? GET : POST)(request(), context);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  },
);
