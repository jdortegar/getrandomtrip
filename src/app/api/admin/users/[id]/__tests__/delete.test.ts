import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() } },
}));
vi.mock("@/lib/db/tripper-queries", () => ({
  generateUniqueTripperSlug: vi.fn(),
}));
vi.mock("@/lib/db/withDocumentCascadeCleanup", () => ({
  withDocumentCascadeCleanup: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { withDocumentCascadeCleanup } from "@/lib/db/withDocumentCascadeCleanup";
import { DELETE } from "../route";
const remove = vi.fn();
const invoke = (id = "buyer") =>
  DELETE(
    new NextRequest(`http://localhost/api/admin/users/${id}`, {
      method: "DELETE",
    }),
    { params: Promise.resolve({ id }) },
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin" } });
  vi.mocked(prisma.user.findUnique)
    .mockResolvedValueOnce({ id: "admin", roles: ["ADMIN"] } as never)
    .mockResolvedValue({
      id: "buyer",
      roles: ["TRAVELER", "TRIPPER"],
    } as never);
  vi.mocked(prisma.user.count).mockResolvedValue(2);
  vi.mocked(withDocumentCascadeCleanup).mockImplementation(
    async (_db, _scope, work) => work({ user: { delete: remove } } as never),
  );
});
it("uses target buyer ownership for cleanup then deletes account in the same transaction", async () => {
  const response = await invoke();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(withDocumentCascadeCleanup).toHaveBeenCalledWith(
    prisma,
    { kind: "account", ownerId: "buyer" },
    expect.any(Function),
  );
  expect(remove).toHaveBeenCalledWith({ where: { id: "buyer" } });
  expect(prisma.user.delete).not.toHaveBeenCalled();
});
it.each([401, 403])(
  "preserves live caller authorization (%s)",
  async (status) => {
    if (status === 401) vi.mocked(getServerSession).mockResolvedValue(null);
    else
      vi.mocked(prisma.user.findUnique)
        .mockReset()
        .mockResolvedValue({ id: "admin", roles: ["TRAVELER"] } as never);
    const response = await invoke();
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
  },
);
it("still forbids self deletion", async () => {
  const response = await invoke("admin");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "Cannot delete your own account",
  });
  expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
});
it("returns 404 without cleanup for missing account", async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  expect((await invoke()).status).toBe(404);
  expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
});
it.each([1, 2])("preserves last-admin check with %s admins", async (count) => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "buyer",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.user.count).mockResolvedValue(count);
  expect((await invoke()).status).toBe(count === 1 ? 400 : 200);
  expect(prisma.user.count).toHaveBeenCalledWith({
    where: { roles: { has: "ADMIN" } },
  });
  expect(withDocumentCascadeCleanup).toHaveBeenCalledTimes(count === 1 ? 0 : 1);
});
it.each(["cleanup", "cascade", "scope"])(
  "propagates %s errors without raw deletion or information leaks",
  async (stage) => {
    const error = new Error(
      stage === "scope"
        ? "DOCUMENT_LOCK_SCOPE_MISMATCH"
        : "postgres://private-secret",
    );
    if (stage === "cascade") remove.mockRejectedValue(error);
    else vi.mocked(withDocumentCascadeCleanup).mockRejectedValue(error);
    const response = await invoke();
    expect(response.status).toBe(stage === "scope" ? 409 : 503);
    expect(await response.json()).toEqual({
      error: stage === "scope" ? "account_conflict" : "delete_unavailable",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(prisma.user.delete).not.toHaveBeenCalled();
    if (stage !== "cascade") expect(remove).not.toHaveBeenCalled();
  },
);
