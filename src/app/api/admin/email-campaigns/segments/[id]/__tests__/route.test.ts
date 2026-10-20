import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/segments", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/email-campaigns/segments")>();
  return { ...original, deleteSegment: vi.fn(), updateSegment: vi.fn() };
});

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  SegmentError,
  deleteSegment,
  updateSegment,
} from "@/lib/email-campaigns/segments";
import { DELETE, PATCH } from "../route";

function request(method: string, id: string, body?: unknown) {
  return [
    new Request(`http://localhost/api/admin/email-campaigns/segments/${id}`, {
      method,
      ...(body !== undefined && {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      }),
    }),
    { params: Promise.resolve({ id }) },
  ] as const;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("PATCH /api/admin/email-campaigns/segments/[id]", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await PATCH(...request("PATCH", "s1", { name: "X" }));

    expect(res.status).toBe(401);
    expect(updateSegment).not.toHaveBeenCalled();
  });

  it("renames a segment", async () => {
    vi.mocked(updateSegment).mockResolvedValue({
      id: "seg_waitlist",
      name: "Espera",
      description: null,
      systemKey: "WAITLIST",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z",
    });

    const res = await PATCH(...request("PATCH", "seg_waitlist", { name: " Espera " }));

    expect(res.status).toBe(200);
    expect(updateSegment).toHaveBeenCalledWith("seg_waitlist", { name: "Espera" });
    expect((await res.json()).segment.name).toBe("Espera");
  });

  it("returns 400 for an empty body", async () => {
    const res = await PATCH(...request("PATCH", "s1", {}));

    expect(res.status).toBe(400);
  });

  it.each([
    ["not_found", 404],
    ["duplicate_segment", 409],
  ] as const)("maps %s to %i", async (code, status) => {
    vi.mocked(updateSegment).mockRejectedValue(new SegmentError(code));

    const res = await PATCH(...request("PATCH", "s1", { name: "X" }));

    expect(res.status).toBe(status);
  });
});

describe("DELETE /api/admin/email-campaigns/segments/[id]", () => {
  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const res = await DELETE(...request("DELETE", "s1"));

    expect(res.status).toBe(403);
    expect(deleteSegment).not.toHaveBeenCalled();
  });

  it("deletes a segment", async () => {
    const res = await DELETE(...request("DELETE", "s1"));

    expect(res.status).toBe(200);
    expect(deleteSegment).toHaveBeenCalledWith("s1");
  });

  it.each([
    ["system_segment", 409],
    ["segment_in_use", 409],
    ["not_found", 404],
  ] as const)("maps %s to %i", async (code, status) => {
    vi.mocked(deleteSegment).mockRejectedValue(new SegmentError(code));

    const res = await DELETE(...request("DELETE", "s1"));

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: code === "not_found" ? "Not found" : code });
  });
});
