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
vi.mock("@/lib/trip-documents/attachDocumentDraft", () => ({
  attachDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/createTripDocumentDraft", () => ({
  readTripDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/loadTripDocumentSource", () => ({
  loadTripDocumentSource: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { attachDocumentDraft } from "@/lib/trip-documents/attachDocumentDraft";
import { readTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { POST } from "../route";
const payload = {
  revision: 1,
  previewId: "00000000-0000-4000-8000-000000000001",
  requestId: "00000000-0000-4000-8000-000000000002",
};
const context = { params: Promise.resolve({ id: "trip", draftId: "draft" }) };

function request(body = JSON.stringify(payload)) {
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
  vi.mocked(prisma.tripDocumentDraft.findFirst).mockResolvedValue({
    id: "draft",
  } as never);
  vi.mocked(attachDocumentDraft).mockResolvedValue({
    ok: true,
    documentId: "document",
    status: "adopted",
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
it.each([POST])(
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
  expect((await POST(request(), context)).status).toBe(404);
});
it("updates with DB owner and forwards the revision envelope", async () => {
  const response = await POST(request(), context);
  expect(response.status).toBe(200);
  expect(attachDocumentDraft).toHaveBeenCalledWith(prisma, {
    ownerId: "buyer",
    tripRequestId: "trip",
    draftId: "draft",
    adminId: "admin",
    ...payload,
  });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it.each(["", "{", "x".repeat(128 * 1024 + 1)])(
  "rejects malformed or oversized input",
  async (body) => {
    expect((await POST(request(body), context)).status).toBe(
      body.length > 128 * 1024 ? 413 : 400,
    );
    expect(attachDocumentDraft).not.toHaveBeenCalled();
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
it.each(["auth", "trip", "create", "render"])(
  "contains %s failures",
  async (source) => {
    const error = new Error("secret.internal");
    if (source === "auth") vi.mocked(getServerSession).mockRejectedValue(error);
    if (source === "trip")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(error);
    if (source === "create")
      vi.mocked(attachDocumentDraft).mockRejectedValue(error);
    if (source === "render")
      vi.mocked(attachDocumentDraft).mockRejectedValue(error);
    const response = await (source === "render" ? POST : POST)(
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
  expect((await POST(request(), context)).status).toBe(404);
  expect(prisma.tripDocumentDraft.findFirst).toHaveBeenCalledWith({
    where: { id: "draft", tripRequestId: "trip" },
    select: { id: true },
  });
  expect(attachDocumentDraft).not.toHaveBeenCalled();
});
it.each([
  ["DOCUMENT_PUBLICATION_CONFLICT", 409],
  ["DOCUMENT_PDF_TOO_LARGE", 413],
  ["DOCUMENT_ATTACH_RETRY_UNAVAILABLE", 409],
  ["DOCUMENT_ATTACH_REQUEST_EXPIRED", 409],
])("maps %s safely", async (message, status) => {
  vi.mocked(attachDocumentDraft).mockRejectedValue(new Error(String(message)));
  expect((await POST(request(), context)).status).toBe(status);
});
it.each([
  {},
  { ...payload, revision: 0 },
  { ...payload, previewId: "bad" },
  { ...payload, requestId: "bad" },
  { ...payload, replaceDocumentId: "" },
  { ...payload, ownerId: "attacker" },
])("rejects invalid attach envelope", async (input) => {
  expect((await POST(request(JSON.stringify(input)), context)).status).toBe(
    422,
  );
  expect(attachDocumentDraft).not.toHaveBeenCalled();
});
it.each([
  ["DOCUMENT_ATTACH_RETRY_UNAVAILABLE", "attach_in_progress"],
  ["DOCUMENT_ATTACH_REQUEST_EXPIRED", "attach_request_expired"],
  ["DOCUMENT_ATTACH_REQUEST_MISMATCH", "attach_request_mismatch"],
])("distinguishes %s recovery", async (message, code) => {
  vi.mocked(attachDocumentDraft).mockRejectedValue(new Error(message));
  const response = await POST(request(), context);
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: code });
});
it("forwards explicit replacement and safelists response", async () => {
  vi.mocked(attachDocumentDraft).mockResolvedValue({
    documentId: "document",
    status: "retained",
    storageKey: "secret",
  } as never);
  const response = await POST(
    request(JSON.stringify({ ...payload, replaceDocumentId: "document" })),
    context,
  );
  expect(await response.json()).toEqual({
    documentId: "document",
    revision: 1,
    status: "retained",
  });
  expect(attachDocumentDraft).toHaveBeenCalledWith(
    prisma,
    expect.objectContaining({ replaceDocumentId: "document" }),
  );
});
function binaryRequest(
  body: BodyInit = "%PDF-exact",
  extra: Record<string, string> = {},
) {
  return new Request("http://localhost", {
    method: "POST",
    body,
    duplex: "half",
    headers: {
      "content-type": "application/pdf",
      "x-document-preview-id": payload.previewId,
      "x-document-request-id": payload.requestId,
      "x-document-revision": "1",
      ...extra,
    },
  } as RequestInit & { duplex: string }) as NextRequest;
}
it("accepts bounded raw PDF with identity headers only after live authorization", async () => {
  const response = await POST(binaryRequest(), context);
  expect(response.status).toBe(200);
  expect(attachDocumentDraft).toHaveBeenCalledWith(
    prisma,
    expect.objectContaining({
      ...payload,
      ownerId: "buyer",
      adminId: "admin",
      previewBytes: Buffer.from("%PDF-exact"),
    }),
  );
  vi.mocked(getServerSession).mockResolvedValue(null);
  const req = binaryRequest();
  const read = vi.spyOn(req.body!, "getReader");
  expect((await POST(req, context)).status).toBe(401);
  expect(read).not.toHaveBeenCalled();
});
it("bounds actual binary stream bytes even when content length lies", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1));
    },
    cancel,
  });
  expect(
    (await POST(binaryRequest(body, { "content-length": "1" }), context))
      .status,
  ).toBe(413);
  expect(cancel).toHaveBeenCalled();
  expect(attachDocumentDraft).not.toHaveBeenCalled();
});
it("rejects malformed binary identities and reports expired previews as conflicts", async () => {
  expect(
    (
      await POST(
        binaryRequest("%PDF", { "x-document-preview-id": "arbitrary" }),
        context,
      )
    ).status,
  ).toBe(422);
  expect(attachDocumentDraft).not.toHaveBeenCalled();
  vi.mocked(attachDocumentDraft).mockRejectedValue(
    new Error("DOCUMENT_MEMORY_PREVIEW_EXPIRED"),
  );
  expect(await (await POST(binaryRequest(), context)).json()).toEqual({
    error: "preview_conflict",
  });
});
