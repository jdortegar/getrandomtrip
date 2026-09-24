import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST as submit } from "@/app/api/tripper/experiences/[id]/submit/route";
import { PUT as saveDrop } from "@/app/api/admin/xsed/[id]/route";
import { overwriteOriginalWithCopy } from "@/lib/experiences/changed-fields";
import { POST as approve } from "@/app/api/admin/experiences/[id]/approve/route";
import { POST as sendCopy } from "@/app/api/admin/experiences/[id]/send-to-tripper/route";
import { POST as approveCopy } from "@/app/api/tripper/experiences/[id]/approve-copy/route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendExperienceSubmitted: vi.fn(),
  sendExperiencePendingTripperReview: vi.fn(),
  sendExperienceCopyApproved: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
    experience: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
const params = { params: Promise.resolve({ id: "original" }) };
const basic = {
  id: "original",
  ownerId: "user",
  status: "DRAFT",
  source: "RANDOMTRIP",
  type: ["couple", "family"],
  level: "xsed",
  title: "Trip",
  teaser: "Teaser",
  description: "Body",
  heroImage: "/trip.jpg",
  destinationCity: "Mendoza",
  destinationCountry: "Argentina",
  activities: [{ name: "Hike" }],
  slug: null,
  tripDate: null,
  titleInternal: null,
  isReviewCopy: false,
};
const setup = {
  titleInternal: "Drop title",
  tripDate: "2030-10-10",
  destinationCity: "Mendoza",
  destinationCountry: "Argentina",
};
function request(body: object = {}) {
  return new Request("http://localhost/api/experiences/original", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "user",
    roles: ["ADMIN", "TRIPPER"],
  } as never);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue(basic as never);
  vi.mocked(prisma.experience.findFirst).mockResolvedValue(basic as never);
  vi.mocked(prisma.experience.findMany).mockResolvedValue([
    { slug: "3" },
    { slug: "8" },
  ] as never);
  (prisma.experience.update as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ data }) => ({ id: "original", ...data }),
  );
});

describe("XSED shared draft → dedicated publication", () => {
  it("requires dedicated setup instead of generic publication", async () => {
    const response = await submit(request(), params);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "drop_setup_required",
    });
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
  it.each(["couple", "family", "group", "solo", "honeymoon", "paws"])(
    "publishes configured %s drop with numeric identity and flat pricing",
    async (type) => {
      vi.mocked(prisma.experience.findUnique).mockResolvedValue({
        ...basic,
        type: [type],
      } as never);
      const response = await saveDrop(
        request({ ...setup, status: "ACTIVE" }),
        params,
      );
      expect(response.status).toBe(200);
      expect(prisma.experience.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE",
            slug: "9",
            pricingByType: { [type]: type === "solo" ? 350 : 250 },
          }),
        }),
      );
      expect(
        vi.mocked(prisma.experience.update).mock.calls[0][0].data,
      ).not.toHaveProperty("type");
    },
  );
  it("rejects a status operation envelope instead of bypassing review-copy activation guards", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      ...basic,
      isReviewCopy: true,
    } as never);
    expect(
      (await saveDrop(request({ ...setup, status: { set: "ACTIVE" } }), params))
        .status,
    ).toBe(400);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
  it("cannot activate a review copy directly", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      ...basic,
      isReviewCopy: true,
      parentId: "original",
    } as never);
    expect(
      (await saveDrop(request({ ...setup, status: "ACTIVE" }), params)).status,
    ).toBe(422);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
  it("saves copy setup without touching original public identity or status", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      ...basic,
      id: "copy",
      isReviewCopy: true,
      parentId: "original",
    } as never);
    const response = await saveDrop(request({ ...setup, status: "DRAFT" }), {
      params: Promise.resolve({ id: "copy" }),
    });
    expect(response.status).toBe(200);
    expect(prisma.experience.update).toHaveBeenCalledTimes(1);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "copy" } }),
    );
    expect(
      vi.mocked(prisma.experience.update).mock.calls[0][0].data,
    ).not.toHaveProperty("slug");
    expect(prisma.experience.findMany).not.toHaveBeenCalled();
  });
  it("rejects incomplete setup through admin approval, send-to-tripper, and copy acceptance", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      ...basic,
      status: "PENDING_REVIEW",
    } as never);
    vi.mocked(prisma.experience.findFirst).mockResolvedValue({
      ...basic,
      id: "copy",
      isReviewCopy: true,
    } as never);
    expect(
      (
        await approve(
          request({ pricingByType: { couple: 250, family: 250 } }),
          params,
        )
      ).status,
    ).toBe(409);
    expect((await sendCopy(request(), params)).status).toBe(409);
    vi.mocked(prisma.experience.findFirst)
      .mockResolvedValueOnce({
        ...basic,
        status: "PENDING_TRIPPER_REVIEW",
      } as never)
      .mockResolvedValueOnce({
        ...basic,
        id: "copy",
        isReviewCopy: true,
      } as never);
    expect((await approveCopy(request(), params)).status).toBe(409);
    expect(prisma.experience.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it("round-trips copy setup through tripper review and approval without premature original mutation", async () => {
    const activities = ["Dinner", "Hike", "Kayak", "Museum"].map((name) => ({
      name,
    }));
    const sections = ["Stay", "Food", "Walk", "Extra"].map((title) => ({
      title,
      body: title,
      photos: [],
    }));
    const records: Record<string, Record<string, unknown>> = {
      original: {
        ...basic,
        status: "ACTIVE",
        source: "TRIPPER",
        type: ["solo"],
        level: "essenza",
        slug: null,
      },
      copy: {
        ...basic,
        id: "copy",
        source: "TRIPPER",
        isReviewCopy: true,
        parentId: "original",
      },
    };
    (
      prisma.experience.findUnique as ReturnType<typeof vi.fn>
    ).mockImplementation(async ({ where }) => records[where.id]);
    (
      prisma.experience.findFirst as ReturnType<typeof vi.fn>
    ).mockImplementation(
      async ({ where }) => records[where.parentId ? "copy" : where.id],
    );
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ where, data }) =>
        (records[where.id] = { ...records[where.id], ...data }),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback) => callback(prisma),
    );
    const response = await saveDrop(
      request({
        ...setup,
        status: "DRAFT",
        activities,
        sections,
        gallery: ["/extra.jpg"],
      }),
      { params: Promise.resolve({ id: "copy" }) },
    );
    expect(response.status).toBe(200);
    expect(records.original).toMatchObject({
      status: "ACTIVE",
      type: ["solo"],
      level: "essenza",
      slug: null,
    });
    expect((await sendCopy(request(), params)).status).toBe(200);
    expect(records.original).toMatchObject({
      status: "PENDING_TRIPPER_REVIEW",
      slug: null,
    });
    expect((await approveCopy(request(), params)).status).toBe(200);
    expect(records.original).toMatchObject({
      status: "ACTIVE",
      type: ["couple", "family"],
      level: "xsed",
      slug: "9",
      activities,
      sections,
      gallery: ["/extra.jpg"],
      pricingByType: { couple: 250, family: 250 },
    });
  });
  it.each([null, "7"])(
    "approved copy preserves content and keeps/allocates only original slug (%s)",
    async (slug) => {
      const activities = ["Dinner", "Hike", "Kayak"].map((name) => ({ name }));
      const sections = ["Stay", "Food", "Walk", "Extra"].map((title) => ({
        title,
        body: title,
        photos: [],
      }));
      const copy = {
        ...basic,
        ...setup,
        id: "copy",
        isReviewCopy: true,
        activities,
        sections,
        gallery: ["/extra.jpg"],
        slug: null,
      };
      const tx = {
        experience: {
          findUnique: vi
            .fn()
            .mockImplementation(({ where }) =>
              Promise.resolve(where.id === "copy" ? copy : { ...basic, slug }),
            ),
          findMany: vi.fn().mockResolvedValue([{ slug: "8" }]),
          update: vi.fn().mockResolvedValue({}),
        },
      };
      await overwriteOriginalWithCopy(tx, "original", "copy");
      expect(tx.experience.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "original" },
          data: expect.objectContaining({
            status: "ACTIVE",
            type: ["couple", "family"],
            level: "xsed",
            activities,
            sections,
            gallery: ["/extra.jpg"],
            slug: slug ?? "9",
          }),
        }),
      );
    },
  );
});
