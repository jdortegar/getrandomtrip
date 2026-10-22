// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    segment: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    contactSegment: { groupBy: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  SegmentError,
  createSegment,
  deleteSegment,
  listSegments,
  missingSegmentIds,
  systemSegmentId,
  updateSegment,
} from "../segments";

const mocked = prisma as unknown as {
  segment: Record<
    "count" | "create" | "delete" | "findFirst" | "findMany" | "findUnique" | "update",
    ReturnType<typeof vi.fn>
  >;
  contactSegment: { groupBy: ReturnType<typeof vi.fn> };
};

const at = new Date("2026-10-19T12:00:00.000Z");

function segmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    name: "VIP",
    description: null,
    systemKey: null,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocked.segment.create.mockImplementation(async ({ data }) => segmentRow(data));
  mocked.segment.update.mockImplementation(async ({ data }) => segmentRow(data));
});

describe("systemSegmentId", () => {
  it("returns the seeded ids of the system segments", () => {
    expect(systemSegmentId("WAITLIST")).toBe("seg_waitlist");
    expect(systemSegmentId("FRIENDS_FAMILY")).toBe("seg_friends_family");
  });
});

describe("listSegments", () => {
  it("lists system segments first, then by name, with member counts", async () => {
    mocked.segment.findMany.mockResolvedValue([
      { ...segmentRow({ id: "s2", name: "zeta" }), _count: { contacts: 0 } },
      {
        ...segmentRow({ id: "seg_waitlist", name: "Lista de espera", systemKey: "WAITLIST" }),
        _count: { contacts: 5 },
      },
      { ...segmentRow({ id: "s1", name: "Alfa" }), _count: { contacts: 3 } },
    ]);
    mocked.contactSegment.groupBy.mockResolvedValue([
      { segmentId: "seg_waitlist", _count: { _all: 4 } },
      { segmentId: "s1", _count: { _all: 1 } },
    ]);

    const segments = await listSegments();

    expect(mocked.contactSegment.groupBy).toHaveBeenCalledWith({
      by: ["segmentId"],
      where: { contact: { status: "SUBSCRIBED" } },
      _count: { _all: true },
    });
    expect(segments.map((s) => [s.id, s.memberCount, s.subscribedCount])).toEqual([
      ["seg_waitlist", 5, 4],
      ["s1", 3, 1],
      ["s2", 0, 0],
    ]);
    expect(segments[0]).toMatchObject({
      systemKey: "WAITLIST",
      createdAt: "2026-10-19T12:00:00.000Z",
    });
  });
});

describe("createSegment", () => {
  it("creates a custom segment", async () => {
    mocked.segment.findFirst.mockResolvedValue(null);

    const segment = await createSegment({ name: "VIP", description: "Top" });

    expect(mocked.segment.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { name: { equals: "VIP", mode: "insensitive" } },
    });
    expect(mocked.segment.create).toHaveBeenCalledWith({
      data: { name: "VIP", description: "Top" },
    });
    expect(segment).toMatchObject({ name: "VIP", systemKey: null });
  });

  it("rejects a name that exists ignoring case", async () => {
    mocked.segment.findFirst.mockResolvedValue({ id: "s9" });

    await expect(createSegment({ name: "vip", description: null })).rejects.toMatchObject({
      code: "duplicate_segment",
    });
    expect(mocked.segment.create).not.toHaveBeenCalled();
  });

  it("maps a unique-constraint race to duplicate_segment", async () => {
    mocked.segment.findFirst.mockResolvedValue(null);
    mocked.segment.create.mockRejectedValue(Object.assign(new Error("u"), { code: "P2002" }));

    await expect(createSegment({ name: "VIP", description: null })).rejects.toBeInstanceOf(
      SegmentError,
    );
  });
});

describe("updateSegment", () => {
  it("renames a system segment", async () => {
    mocked.segment.findUnique.mockResolvedValue(segmentRow({ id: "seg_waitlist", systemKey: "WAITLIST" }));
    mocked.segment.findFirst.mockResolvedValue(null);

    await updateSegment("seg_waitlist", { name: "Espera" });

    expect(mocked.segment.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { name: { equals: "Espera", mode: "insensitive" }, NOT: { id: "seg_waitlist" } },
    });
    expect(mocked.segment.update).toHaveBeenCalledWith({
      where: { id: "seg_waitlist" },
      data: { name: "Espera" },
    });
  });

  it("updates only the description without a duplicate check", async () => {
    mocked.segment.findUnique.mockResolvedValue(segmentRow());

    await updateSegment("s1", { description: null });

    expect(mocked.segment.findFirst).not.toHaveBeenCalled();
    expect(mocked.segment.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { description: null },
    });
  });

  it("rejects a rename onto another segment's name", async () => {
    mocked.segment.findUnique.mockResolvedValue(segmentRow());
    mocked.segment.findFirst.mockResolvedValue({ id: "s2" });

    await expect(updateSegment("s1", { name: "Otro" })).rejects.toMatchObject({
      code: "duplicate_segment",
    });
  });

  it("throws not_found for an unknown id", async () => {
    mocked.segment.findUnique.mockResolvedValue(null);

    await expect(updateSegment("nope", { name: "X" })).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("deleteSegment", () => {
  it("deletes an unused custom segment", async () => {
    mocked.segment.findUnique.mockResolvedValue({ systemKey: null, _count: { campaigns: 0 } });

    await deleteSegment("s1");

    expect(mocked.segment.delete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });

  it("refuses to delete a system segment", async () => {
    mocked.segment.findUnique.mockResolvedValue({ systemKey: "WAITLIST", _count: { campaigns: 0 } });

    await expect(deleteSegment("seg_waitlist")).rejects.toMatchObject({ code: "system_segment" });
    expect(mocked.segment.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete a segment targeted by a campaign", async () => {
    mocked.segment.findUnique.mockResolvedValue({ systemKey: null, _count: { campaigns: 2 } });

    await expect(deleteSegment("s1")).rejects.toMatchObject({ code: "segment_in_use" });
    expect(mocked.segment.delete).not.toHaveBeenCalled();
  });

  it("maps the foreign-key restrict race to segment_in_use", async () => {
    mocked.segment.findUnique.mockResolvedValue({ systemKey: null, _count: { campaigns: 0 } });
    mocked.segment.delete.mockRejectedValue(Object.assign(new Error("fk"), { code: "P2003" }));

    await expect(deleteSegment("s1")).rejects.toMatchObject({ code: "segment_in_use" });
  });

  it("throws not_found for an unknown id", async () => {
    mocked.segment.findUnique.mockResolvedValue(null);

    await expect(deleteSegment("nope")).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("missingSegmentIds", () => {
  it("returns the ids that do not exist", async () => {
    mocked.segment.findMany.mockResolvedValue([{ id: "s1" }]);

    await expect(missingSegmentIds(["s1", "s2"])).resolves.toEqual(["s2"]);
    expect(mocked.segment.findMany).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: { in: ["s1", "s2"] } },
    });
  });

  it("skips the query for an empty list", async () => {
    await expect(missingSegmentIds([])).resolves.toEqual([]);
    expect(mocked.segment.findMany).not.toHaveBeenCalled();
  });
});
