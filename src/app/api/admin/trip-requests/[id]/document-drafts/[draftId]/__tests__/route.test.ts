// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    tripDocumentDraft: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/db/updateTripDocumentDraft", () => ({
  updateTripDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/createTripDocumentDraft", () => ({
  readTripDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/loadTripDocumentSource", () => ({
  loadTripDocumentSource: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { updateTripDocumentDraft } from "@/lib/db/updateTripDocumentDraft";
import { readTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { GET, PATCH, DELETE } from "../route";
const context = { params: Promise.resolve({ id: "trip", draftId: "draft" }) };

function request(
  body = '{"revision":1,"document":{"template":"hotel-voucher"}}',
) {
  return new Request("http://localhost", {
    method: "PATCH",
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
  vi.mocked(prisma.tripDocumentDraft.findFirst).mockResolvedValue({
    id: "draft",
  } as never);
  vi.mocked(updateTripDocumentDraft).mockResolvedValue({
    ok: true,
    value: { id: "new" },
  } as never);
  vi.mocked(readTripDocumentDraft).mockResolvedValue({ id: "draft" } as never);
  vi.mocked(loadTripDocumentSource).mockResolvedValue({
    trip: {},
    provider: {
      kind: "experience",
      hotels: [{ name: "Hotel", location: "Street" }],
    },
  });
});
it.each([GET, PATCH])(
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
  expect((await PATCH(request(), context)).status).toBe(403);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
  expect((await GET(request(), context)).status).toBe(404);
});
it("updates with DB owner and forwards the revision envelope", async () => {
  const response = await PATCH(request(), context);
  expect(response.status).toBe(200);
  expect(updateTripDocumentDraft).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" },
    { revision: 1, document: { template: "hotel-voucher" } },
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it.each(["", "{", "x".repeat(128 * 1024 + 1)])(
  "rejects malformed or oversized input",
  async (body) => {
    expect((await PATCH(request(body), context)).status).toBe(
      body.length > 128 * 1024 ? 413 : 400,
    );
    expect(updateTripDocumentDraft).not.toHaveBeenCalled();
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
    method: "PATCH",
    body,
    duplex: "half",
    headers: { "content-length": "1" },
  } as RequestInit & { duplex: string });
  expect((await PATCH(req as NextRequest, context)).status).toBe(413);
  expect(cancel).toHaveBeenCalled();
});
it("returns field validation errors without mutation success", async () => {
  vi.mocked(updateTripDocumentDraft).mockResolvedValue({
    ok: false,
    errors: [{ path: "locale", code: "invalid_locale" }],
  });
  expect((await PATCH(request(), context)).status).toBe(422);
});
it.each(["auth", "trip", "create", "read"])(
  "contains %s failures",
  async (source) => {
    const error = new Error("secret.internal");
    if (source === "auth") vi.mocked(getServerSession).mockRejectedValue(error);
    if (source === "trip")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(error);
    if (source === "create")
      vi.mocked(updateTripDocumentDraft).mockRejectedValue(error);
    if (source === "read")
      vi.mocked(readTripDocumentDraft).mockRejectedValue(error);
    const response = await (source === "read" ? GET : PATCH)(
      request(),
      context,
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  },
);

it("scopes item lookup and returns404 for another trip draft", async () => {
  vi.mocked(prisma.tripDocumentDraft.findFirst).mockResolvedValue(null);
  expect((await GET(request(), context)).status).toBe(404);
  expect(prisma.tripDocumentDraft.findFirst).toHaveBeenCalledWith({
    where: { id: "draft", tripRequestId: "trip" },
    select: { id: true },
  });
  expect(readTripDocumentDraft).not.toHaveBeenCalled();
});
it.each(["revision_conflict", "immutable_template"] as const)(
  "maps %s without overwriting",
  async (error) => {
    vi.mocked(updateTripDocumentDraft).mockResolvedValue({ ok: false, error });
    expect((await PATCH(request(), context)).status).toBe(409);
  },
);

it("reopens without refreshing source facts", async () => {
  const response = await GET(request(), context);
  expect(response.status).toBe(200);
  expect(readTripDocumentDraft).toHaveBeenCalledWith(prisma, {
    ownerId: "buyer",
    tripRequestId: "trip",
    draftId: "draft",
  });
  expect(loadTripDocumentSource).not.toHaveBeenCalled();
});

vi.mock("@/lib/db/deleteTripDocumentDraft", () => ({
  deleteTripDocumentDraft: vi.fn(),
}));
import { deleteTripDocumentDraft } from "@/lib/db/deleteTripDocumentDraft";
it("deletes scoped revision without exposing storage metadata", async () => {
  vi.mocked(deleteTripDocumentDraft).mockResolvedValue({ deleted: true });
  const response = await DELETE(
    request(JSON.stringify({ revision: 2 })),
    context,
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ deleted: true });
  expect(deleteTripDocumentDraft).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" },
    2,
  );
});
it("contains deletionconflicts and denies invalidrevision", async () => {
  expect(
    (await DELETE(request(JSON.stringify({ revision: 0 })), context)).status,
  ).toBe(422);
  vi.mocked(deleteTripDocumentDraft).mockRejectedValue(
    new Error("DOCUMENT_DRAFT_REVISION_CONFLICT"),
  );
  expect(
    (await DELETE(request(JSON.stringify({ revision: 2 })), context)).status,
  ).toBe(409);
  vi.mocked(getServerSession).mockResolvedValue(null);
  expect((await DELETE(request(), context)).status).toBe(401);
});
