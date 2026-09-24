import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/admin/trip-requests", () => ({
  attachAdminTripRequestRelations: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  sendDestinationRevealed: vi.fn(),
  sendTripCancelled: vi.fn(),
  sendTripCompleted: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/db/withDocumentCascadeCleanup", () => ({
  withDocumentCascadeCleanup: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { withDocumentCascadeCleanup } from "@/lib/db/withDocumentCascadeCleanup";
import { DELETE } from "../route";
const remove = vi.fn();
const invoke = () =>
  DELETE(
    new NextRequest("http://localhost/api/admin/trip-requests/trip", {
      method: "DELETE",
    }),
    { params: Promise.resolve({ id: "trip" }) },
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    id: "trip",
    userId: "buyer",
  } as never);
  vi.mocked(withDocumentCascadeCleanup).mockImplementation(
    async (_db, _scope, work) =>
      work({ tripRequest: { delete: remove } } as never),
  );
});
it.each([401, 403])(
  "preserves live admin authorization (%s)",
  async (status) => {
    if (status === 401) vi.mocked(getServerSession).mockResolvedValue(null);
    else
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        roles: ["TRAVELER"],
      } as never);
    const response = await invoke();
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
  },
);
it("deletes through the cleanup transaction scoped to buyer, not admin", async () => {
  const response = await invoke();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(prisma.tripRequest.findUnique).toHaveBeenCalledWith({
    where: { id: "trip" },
    select: { id: true, userId: true },
  });
  expect(withDocumentCascadeCleanup).toHaveBeenCalledWith(
    prisma,
    { kind: "trip", ownerId: "buyer", tripRequestId: "trip" },
    expect.any(Function),
  );
  expect(remove).toHaveBeenCalledWith({ where: { id: "trip" } });
  expect(prisma.tripRequest.delete).not.toHaveBeenCalled();
});
it("returns 404 without cleanup for a missing trip", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
  expect((await invoke()).status).toBe(404);
  expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
});
it.each(["lookup", "cleanup", "cascade"])(
  "propagates %s failure safely without reporting success",
  async (stage) => {
    const error = new Error("postgres://private-secret");
    if (stage === "lookup")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(error);
    if (stage === "cleanup")
      vi.mocked(withDocumentCascadeCleanup).mockRejectedValue(error);
    if (stage === "cascade") remove.mockRejectedValue(error);
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "delete_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(prisma.tripRequest.delete).not.toHaveBeenCalled();
    if (stage !== "cascade") expect(remove).not.toHaveBeenCalled();
  },
);
it("fails closed when ownership changes before locking", async () => {
  vi.mocked(withDocumentCascadeCleanup).mockRejectedValue(
    new Error("DOCUMENT_LOCK_SCOPE_MISMATCH"),
  );
  const response = await invoke();
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: "trip_conflict" });
  expect(remove).not.toHaveBeenCalled();
});
