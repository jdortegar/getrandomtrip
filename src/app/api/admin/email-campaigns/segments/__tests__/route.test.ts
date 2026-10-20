import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/segments", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/email-campaigns/segments")>();
  return { ...original, createSegment: vi.fn(), listSegments: vi.fn() };
});

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  SegmentError,
  createSegment,
  listSegments,
} from "@/lib/email-campaigns/segments";
import type { Segment } from "@/types/emailCampaign";
import { GET, POST } from "../route";

const BASE = "http://localhost/api/admin/email-campaigns/segments";

const SEGMENT: Segment = {
  id: "s1",
  name: "VIP",
  description: null,
  systemKey: null,
  createdAt: "2026-10-19T12:00:00.000Z",
  updatedAt: "2026-10-19T12:00:00.000Z",
};

function postRequest(body: unknown): Request {
  return new Request(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("GET /api/admin/email-campaigns/segments", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(listSegments).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("lists segments with counts", async () => {
    vi.mocked(listSegments).mockResolvedValue([
      { ...SEGMENT, memberCount: 3, subscribedCount: 2 },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect((await res.json()).segments[0]).toMatchObject({ id: "s1", memberCount: 3 });
  });
});

describe("POST /api/admin/email-campaigns/segments", () => {
  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["TRIPPER"],
    } as never);

    const res = await POST(postRequest({ name: "VIP" }));

    expect(res.status).toBe(403);
    expect(createSegment).not.toHaveBeenCalled();
  });

  it("creates a segment with 201", async () => {
    vi.mocked(createSegment).mockResolvedValue(SEGMENT);

    const res = await POST(postRequest({ name: " VIP ", description: "" }));

    expect(res.status).toBe(201);
    expect(createSegment).toHaveBeenCalledWith({ name: "VIP", description: null });
    expect((await res.json()).segment.id).toBe("s1");
  });

  it.each([{}, { name: "" }, { name: "x".repeat(61) }, { name: "VIP", systemKey: "WAITLIST" }])(
    "returns 400 for invalid input %j",
    async (body) => {
      const res = await POST(postRequest(body));

      expect(res.status).toBe(400);
      expect(createSegment).not.toHaveBeenCalled();
    },
  );

  it("returns 409 for a duplicate name", async () => {
    vi.mocked(createSegment).mockRejectedValue(new SegmentError("duplicate_segment"));

    const res = await POST(postRequest({ name: "vip" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "duplicate_segment" });
  });
});
