// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    tripDocumentDraft: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/storage/readDocumentPreview", () => ({
  readDocumentPreview: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { readDocumentPreview } from "@/lib/storage/readDocumentPreview";
import { GET } from "../route";
const context = { params: Promise.resolve({ id: "trip", draftId: "draft" }) };
const previewId = "00000000-0000-4000-8000-000000000001";
const request = (query = `revision=2&previewId=${previewId}`) =>
  new NextRequest(`http://localhost/api/preview?${query}`);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin" },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    userId: "buyer",
  } as never);
  vi.mocked(prisma.tripDocumentDraft.findFirst).mockResolvedValue({
    id: "draft",
  } as never);
  vi.mocked(readDocumentPreview).mockResolvedValue(Buffer.from("%PDF-safe"));
});
it("serves verified bytes withprivatePDFheaders andDBowner", async () => {
  const result = await GET(request(), context);
  expect(result.status).toBe(200);
  expect(await result.text()).toBe("%PDF-safe");
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("content-type")).toBe("application/pdf");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  expect(readDocumentPreview).toHaveBeenCalledWith(
    prisma,
    { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" },
    2,
    previewId,
  );
});
it("requires session and liveadmin beforestorage", async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
  expect((await GET(request(), context)).status).toBe(401);
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin" },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    roles: ["TRAVELER"],
  } as never);
  expect((await GET(request(), context)).status).toBe(403);
  expect(readDocumentPreview).not.toHaveBeenCalled();
});
it("rejects missingtrip andcross-tripdraft", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValueOnce(null);
  expect((await GET(request(), context)).status).toBe(404);
  vi.mocked(prisma.tripDocumentDraft.findFirst).mockResolvedValue(null);
  expect((await GET(request(), context)).status).toBe(404);
  expect(prisma.tripDocumentDraft.findFirst).toHaveBeenCalledWith({
    where: { id: "draft", tripRequestId: "trip" },
    select: { id: true },
  });
  expect(readDocumentPreview).not.toHaveBeenCalled();
});
it.each([
  "",
  `revision=0&previewId=${previewId}`,
  `revision=1.5&previewId=${previewId}`,
  "revision=2&previewId=https://unsafe",
  `revision=2&revision=3&previewId=${previewId}`,
  `revision=2&previewId=${previewId}&key=secret`,
])("rejects invalididentityquery %s", async (query) => {
  expect((await GET(request(query), context)).status).toBe(422);
  expect(readDocumentPreview).not.toHaveBeenCalled();
});
it.each([
  ["DOCUMENT_PREVIEW_CONFLICT", 409],
  ["DOCUMENT_LOCK_SCOPE_MISMATCH", 409],
  ["DOCUMENT_PREVIEW_INTEGRITY", 503],
  ["DOCUMENT_PREVIEW_UNAVAILABLE", 503],
  ["secret.internal", 503],
])("sanitizes %s", async (message, status) => {
  vi.mocked(readDocumentPreview).mockRejectedValue(new Error(String(message)));
  const response = await GET(request(), context);
  expect(response.status).toBe(status);
  expect(await response.text()).not.toContain(message);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("contains authlookup errors and rejects oversizehelper output", async () => {
  vi.mocked(getServerSession).mockRejectedValueOnce(new Error("secret"));
  expect((await GET(request(), context)).status).toBe(503);
  vi.mocked(readDocumentPreview).mockResolvedValue(
    Buffer.alloc(4 * 1024 * 1024 + 1),
  );
  expect((await GET(request(), context)).status).toBe(413);
});
