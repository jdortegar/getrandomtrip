import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { findPublicXsedExperiences, getCurrentXsedDrop } from "../xsed";
import { PUBLIC_XSED_EXPERIENCE_WHERE } from "@/lib/xsed/publication";

vi.mock("@/lib/prisma", () => ({
  prisma: { experience: { findMany: vi.fn(), findFirst: vi.fn() } },
}));
const legacy = {
  id: "legacy",
  type: ["XSED"],
  level: null,
  status: "ACTIVE",
  isActive: true,
  isReviewCopy: false,
  titleInternal: "Drop",
  slug: "7",
  tripDate: new Date("2030-10-10"),
  destinationCity: "Mendoza",
  destinationCountry: "Argentina",
  maxSpots: 10,
  _count: { tripRequests: 2 },
};
const canonical = {
  ...legacy,
  id: "canonical",
  type: ["couple", "family"],
  level: "xsed",
  slug: "8",
};
const hidden = [
  { ...canonical, id: "draft", status: "DRAFT", tripDate: null, slug: null },
  { ...canonical, id: "review", isReviewCopy: true },
  { ...canonical, id: "pending", status: "PENDING_REVIEW" },
  { ...canonical, id: "inactive", isActive: false },
  { ...canonical, id: "missing-date", tripDate: null },
  { ...canonical, id: "blank-slug", slug: " " },
  { ...canonical, id: "no-title", titleInternal: null },
  { ...legacy, id: "legacy-draft", status: "DRAFT" },
];
beforeEach(() => vi.resetAllMocks());

describe("public XSED publication boundary", () => {
  it("never selects incomplete generic drafts or review copies over a real legacy drop", async () => {
    vi.mocked(prisma.experience.findMany).mockResolvedValue([
      ...hidden,
      legacy,
    ] as never);
    expect(await getCurrentXsedDrop()).toMatchObject({
      id: "legacy",
      number: 7,
      slug: "7",
    });
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([PUBLIC_XSED_EXPERIENCE_WHERE]),
        }),
      }),
    );
  });
  it("can select an eligible canonical drop", async () => {
    vi.mocked(prisma.experience.findMany).mockResolvedValue([
      ...hidden,
      canonical,
      legacy,
    ] as never);
    expect(await getCurrentXsedDrop()).toMatchObject({
      id: "canonical",
      number: 8,
      slug: "8",
    });
  });
  it("keeps eligible latest fallback when no upcoming drop exists", async () => {
    vi.mocked(prisma.experience.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([...hidden, legacy] as never);
    expect(await getCurrentXsedDrop()).toMatchObject({ id: "legacy" });
  });
  it("lists only eligible canonical and legacy drops", async () => {
    vi.mocked(prisma.experience.findMany).mockResolvedValue([
      ...hidden,
      legacy,
      canonical,
    ] as never);
    expect((await findPublicXsedExperiences()).map(({ id }) => id)).toEqual([
      "legacy",
      "canonical",
    ]);
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: PUBLIC_XSED_EXPERIENCE_WHERE }),
    );
  });
  it("returns no current drop when every record is unpublished/incomplete", async () => {
    vi.mocked(prisma.experience.findMany).mockResolvedValue(hidden as never);
    expect(await getCurrentXsedDrop()).toBeNull();
  });
});
