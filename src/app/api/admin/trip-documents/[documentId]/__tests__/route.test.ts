import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripDocument: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/db/deletePublishedDocument", () => ({
  deletePublishedDocument: vi.fn(),
}));
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { deletePublishedDocument } from "@/lib/db/deletePublishedDocument";
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { DELETE } from "../route";
const invoke = () =>
  DELETE(
    new NextRequest("http://localhost/api/admin/trip-documents/doc-1", {
      method: "DELETE",
    }),
    { params: Promise.resolve({ documentId: "doc-1" }) },
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin-B" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin-B",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripDocument.findUnique).mockResolvedValue({
    id: "doc-1",
    tripRequestId: "trip-1",
    tripRequest: { userId: "traveler-1" },
    uploadedById: "admin-A",
  } as never);
  vi.mocked(deletePublishedDocument).mockResolvedValue({ deleted: true });
});
describe("durable attachment DELETE", () => {
  it.each([401, 403])(
    "rejects unauthorized callers (%s) before reading documents",
    async (status) => {
      if (status === 401) vi.mocked(getServerSession).mockResolvedValue(null);
      else
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "admin-B",
          roles: ["TRAVELER"],
        } as never);
      const response = await invoke();
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(prisma.tripDocument.findUnique).not.toHaveBeenCalled();
      expect(deletePublishedDocument).not.toHaveBeenCalled();
    },
  );
  it("returns private 404 for a missing attachment", async () => {
    vi.mocked(prisma.tripDocument.findUnique).mockResolvedValue(null);
    const response = await invoke();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(deletePublishedDocument).not.toHaveBeenCalled();
  });
  it("lets admin B remove admin A's upload through atomic owner-scoped deletion", async () => {
    const response = await invoke();
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("");
    expect(prisma.tripDocument.findUnique).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      select: {
        id: true,
        tripRequestId: true,
        tripRequest: { select: { userId: true } },
      },
    });
    expect(deletePublishedDocument).toHaveBeenCalledWith(prisma, {
      ownerId: "traveler-1",
      tripRequestId: "trip-1",
      documentId: "doc-1",
    });
    expect(prisma.tripDocument.delete).not.toHaveBeenCalled();
    expect(getTripDocumentStore).not.toHaveBeenCalled();
  });
  it.each(["session", "role", "lookup", "transaction"])(
    "sanitizes %s failures without direct deletion or success",
    async (stage) => {
      const error = new Error("postgres://private-host secret-storage-key");
      if (stage === "session")
        vi.mocked(getServerSession).mockRejectedValue(error);
      if (stage === "role")
        vi.mocked(prisma.user.findUnique).mockRejectedValue(error);
      if (stage === "lookup")
        vi.mocked(prisma.tripDocument.findUnique).mockRejectedValue(error);
      if (stage === "transaction")
        vi.mocked(deletePublishedDocument).mockRejectedValue(error);
      const response = await invoke();
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({ error: "delete_unavailable" });
      expect(prisma.tripDocument.delete).not.toHaveBeenCalled();
      expect(getTripDocumentStore).not.toHaveBeenCalled();
      if (stage !== "transaction")
        expect(deletePublishedDocument).not.toHaveBeenCalled();
    },
  );
  it("reports a concurrent owner/trip/document change as a conflict", async () => {
    vi.mocked(deletePublishedDocument).mockRejectedValue(
      new Error("DOCUMENT_LOCK_SCOPE_MISMATCH"),
    );
    const response = await invoke();
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "document_conflict" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
