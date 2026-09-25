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
vi.mock("@/lib/trip-documents/renderSavedDocumentDraft", () => ({
  renderSavedDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/createTripDocumentDraft", () => ({
  readTripDocumentDraft: vi.fn(),
}));
vi.mock("@/lib/db/loadTripDocumentSource", () => ({
  loadTripDocumentSource: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { renderSavedDocumentDraft } from "@/lib/trip-documents/renderSavedDocumentDraft";
import { readTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { POST } from "../route";
const context = { params: Promise.resolve({ id: "trip", draftId: "draft" }) };

function request(body = '{"revision":1}') {
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
  vi.mocked(renderSavedDocumentDraft).mockResolvedValue({
    ok: true,
    previewId: "preview",
    revision: 1,
    buffer: Buffer.from("%PDF-exact bytes"),
  } as never);
  vi.mocked(readTripDocumentDraft).mockResolvedValue({ id: "draft" } as never);
  vi.mocked(loadTripDocumentSource).mockResolvedValue({
    experienceItinerary: null,
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
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("x-document-preview-id")).toBe("preview");
  expect(response.headers.get("x-document-revision")).toBe("1");
  expect(await response.text()).toBe("%PDF-exact bytes");
  expect(renderSavedDocumentDraft).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" },
    1,
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it.each(["", "{", "x".repeat(128 * 1024 + 1)])(
  "rejects malformed or oversized input",
  async (body) => {
    expect((await POST(request(body), context)).status).toBe(
      body.length > 128 * 1024 ? 413 : 400,
    );
    expect(renderSavedDocumentDraft).not.toHaveBeenCalled();
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
  vi.mocked(renderSavedDocumentDraft).mockResolvedValue({
    ok: false,
    errors: [{ path: "locale", code: "invalid_locale" }],
  });
  expect((await POST(request(), context)).status).toBe(422);
});
it.each(["auth", "trip", "create", "render"])(
  "contains %s failures",
  async (source) => {
    const error = new Error("secret.internal");
    if (source === "auth") vi.mocked(getServerSession).mockRejectedValue(error);
    if (source === "trip")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(error);
    if (source === "create")
      vi.mocked(renderSavedDocumentDraft).mockRejectedValue(error);
    if (source === "render")
      vi.mocked(renderSavedDocumentDraft).mockRejectedValue(error);
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
  expect(renderSavedDocumentDraft).not.toHaveBeenCalled();
});
it.each([
  ["DOCUMENT_PREVIEW_REVISION_CONFLICT", 409],
  ["DOCUMENT_PDF_TOO_LARGE", 413],
  ["DOCUMENT_CANDIDATE_UNAVAILABLE", 409],
])("maps %s safely", async (message, status) => {
  vi.mocked(renderSavedDocumentDraft).mockRejectedValue(
    new Error(String(message)),
  );
  expect((await POST(request(), context)).status).toBe(status);
});
it.each([
  {},
  { revision: 0 },
  { revision: 1.5 },
  { revision: 1, previewKey: "private" },
])("rejects invalid render envelope", async (input) => {
  expect((await POST(request(JSON.stringify(input)), context)).status).toBe(
    422,
  );
  expect(renderSavedDocumentDraft).not.toHaveBeenCalled();
});
it.each([401, 403])(
  "returns actionable private storage configuration error for Blobs %s without secrets",
  async (status) => {
    const cause = Object.assign(
      new Error(
        `Netlify Blobs has generated an internal error (${status} status code, ID: private-token)`,
      ),
      { name: "BlobsInternalError" },
    );
    vi.mocked(renderSavedDocumentDraft).mockRejectedValue(cause);
    const response = await POST(request(), context);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "storage_authorization" });
  },
);
it.each([
  new Error("private host returned 401 status code"),
  Object.assign(
    new Error(
      "Netlify Blobs has generated an internal error (500 status code)",
    ),
    { name: "BlobsInternalError" },
  ),
])(
  "does not mislabel unrelated failures as storage authorization",
  async (cause) => {
    vi.mocked(renderSavedDocumentDraft).mockRejectedValue(cause);
    const response = await POST(request(), context);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "preview_unavailable" });
  },
);
