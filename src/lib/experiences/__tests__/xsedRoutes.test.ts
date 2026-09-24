import { PUBLIC_XSED_EXPERIENCE_WHERE } from "@/lib/xsed/publication";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST as create } from "@/app/api/tripper/experiences/route";
import { PATCH as patch } from "@/app/api/tripper/experiences/[id]/route";
import { POST as submit } from "@/app/api/tripper/experiences/[id]/submit/route";
import { PATCH as editCopy } from "@/app/api/admin/experiences/[id]/edit-copy/route";
import { GET as list } from "@/app/api/admin/experiences/route";
import {
  GET as listDrops,
  POST as createDrop,
} from "@/app/api/admin/xsed/route";
import {
  GET as getDrop,
  PUT as updateDrop,
  DELETE as deleteDrop,
} from "@/app/api/admin/xsed/[id]/route";
import {
  findUpcomingActiveXsedExperiences,
  findLatestActiveXsedExperience,
  findPublicXsedExperiences,
  findAllCompletedXsedTripRequestsForTestimonials,
} from "@/lib/data/xsed";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/randomtrip-user", () => ({
  getRandomtripUserId: async () => "randomtrip",
}));
vi.mock("@/lib/db/tripper-queries", () => ({ getTripperExperiences: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendExperienceSubmitted: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tripRequest: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const params = { params: Promise.resolve({ id: "exp" }) };
const xsedWhere = { OR: [{ level: "xsed" }, { type: { has: "XSED" } }] };
const draft = {
  id: "exp",
  ownerId: "randomtrip",
  source: "RANDOMTRIP",
  status: "DRAFT",
  type: ["couple", "family"],
  level: "xsed",
  title: "Trip",
  teaser: "Teaser",
  description: "Description",
  heroImage: "/trip.jpg",
  destinationCountry: "Argentina",
  destinationCity: "Mendoza",
  activities: [{ name: "Kayak" }],
  accommodations: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  tags: [],
  minNights: 1,
  maxNights: 1,
  minPax: 1,
  maxPax: 4,
  excuseKey: ["escapada-romantica"],
};
function request(method: string, body?: object, query = "") {
  return new NextRequest(`http://localhost/api/experiences${query}`, {
    method,
    ...(body && { body: JSON.stringify(body) }),
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.experience.findFirst).mockResolvedValue(draft as never);
  vi.mocked(prisma.experience.findUnique).mockResolvedValue({
    ...draft,
    isReviewCopy: true,
  } as never);
  (prisma.experience.create as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ data }: { data: object }) => ({ id: "exp", ...data }),
  );
  (prisma.experience.update as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ data }: { data: object }) => ({ ...draft, ...data }),
  );
  vi.mocked(prisma.experience.findMany).mockResolvedValue([]);
  vi.mocked(prisma.experience.count).mockResolvedValue(0);
  vi.mocked(prisma.tripRequest.count).mockResolvedValue(0);
  vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) =>
    (callback as (tx: unknown) => Promise<unknown>)(prisma),
  );
});

describe("canonical shared XSED writes", () => {
  it.each([
    { level: { set: "xsed" } },
    { type: { set: ["XSED"] } },
    { type: [1] },
  ])(
    "rejects operation envelopes and malformed classification: %j",
    async (classification) => {
      vi.mocked(prisma.experience.findFirst).mockResolvedValue({
        ...draft,
        level: "essenza",
      } as never);
      vi.mocked(prisma.experience.findUnique).mockResolvedValue({
        ...draft,
        level: "essenza",
        isReviewCopy: true,
      } as never);
      const payload = { ...draft, ...classification };
      expect((await create(request("POST", payload))).status).toBe(400);
      expect((await patch(request("PATCH", payload), params)).status).toBe(400);
      expect((await editCopy(request("PATCH", payload), params)).status).toBe(
        400,
      );
      expect(prisma.experience.create).not.toHaveBeenCalled();
      expect(prisma.experience.update).not.toHaveBeenCalled();
    },
  );

  it("creates ordinary types and level=xsed without losing excuses", async () => {
    expect((await create(request("POST", draft))).status).toBe(201);
    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: ["couple", "family"],
          level: "xsed",
          excuseKey: draft.excuseKey,
        }),
      }),
    );
  });
  it.each([{ type: [] }, { type: ["XSED"] }, { type: ["couple", "XSED"] }])(
    "rejects a noncanonical create with types $type",
    async ({ type }) => {
      expect((await create(request("POST", { ...draft, type }))).status).toBe(
        422,
      );
      expect(prisma.experience.create).not.toHaveBeenCalled();
    },
  );
  it("persists a canonical edit and refreshes live XSED prices without /submit", async () => {
    vi.mocked(prisma.experience.findFirst).mockResolvedValue({
      ...draft,
      level: "essenza",
      status: "ACTIVE",
      pricingByType: { couple: 350, family: 350 },
    } as never);
    expect((await patch(request("PATCH", draft), params)).status).toBe(200);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: draft.type,
          level: "xsed",
          pricingByType: { couple: 250, family: 250 },
        }),
      }),
    );
  });
  it("restores ordinary prices when a live XSED experience changes levels", async () => {
    vi.mocked(prisma.experience.findFirst).mockResolvedValue({
      ...draft,
      status: "ACTIVE",
      pricingByType: { couple: 250, family: 250 },
    } as never);
    expect(
      (await patch(request("PATCH", { ...draft, level: "essenza" }), params))
        .status,
    ).toBe(200);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pricingByType: { couple: 350, family: 350 },
        }),
      }),
    );
  });
  it("does not erase legacy classification in unrelated partial updates", async () => {
    vi.mocked(prisma.experience.findFirst).mockResolvedValue({
      ...draft,
      type: ["XSED"],
      level: null,
    } as never);
    expect(
      (await patch(request("PATCH", { title: "Updated" }), params)).status,
    ).toBe(200);
    const data = vi.mocked(prisma.experience.update).mock.calls[0][0].data;
    expect(data).not.toHaveProperty("type");
    expect(data).not.toHaveProperty("level");
  });
  it("rejects empty XSED traveler types on PATCH and review-copy PATCH", async () => {
    expect(
      (await patch(request("PATCH", { ...draft, type: [] }), params)).status,
    ).toBe(422);
    expect(
      (await editCopy(request("PATCH", { ...draft, type: [] }), params)).status,
    ).toBe(422);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
  it.each(["couple", "family", "group", "solo", "honeymoon", "paws"])(
    "requires dedicated setup before publishing %s",
    async (type) => {
      vi.mocked(prisma.experience.findFirst)
        .mockResolvedValueOnce({ ...draft, type: [type] } as never)
        .mockResolvedValueOnce(null);
      const res = await submit(request("POST"), params);
      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({ error: "drop_setup_required" });
    },
  );
  it("requires actual traveler types before publishing a legacy marker-only draft", async () => {
    vi.mocked(prisma.experience.findFirst).mockResolvedValue({
      ...draft,
      type: ["XSED"],
      level: null,
    } as never);
    expect((await submit(request("POST"), params)).status).toBe(422);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
});

describe("canonical and legacy XSED reads", () => {
  it("combines publication and upcoming dates without clobbering classification", async () => {
    const now = new Date("2026-09-23T00:00:00Z");
    await findUpcomingActiveXsedExperiences(now);
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [PUBLIC_XSED_EXPERIENCE_WHERE, { tripDate: { gte: now } }],
        },
      }),
    );
  });
  it("uses both representations in latest, public, and testimonial queries", async () => {
    await findLatestActiveXsedExperience();
    await findPublicXsedExperiences();
    await findAllCompletedXsedTripRequestsForTestimonials();
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: PUBLIC_XSED_EXPERIENCE_WHERE }),
    );
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ experience: xsedWhere }),
      }),
    );
  });
  it.each(["?level=xsed&type=couple", "?type=xsed"])(
    "supports admin catalog filter %s",
    async (query) => {
      expect((await list(request("GET", undefined, query))).status).toBe(200);
      expect(prisma.experience.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [xsedWhere],
            ...(query.includes("couple") && { type: { has: "couple" } }),
          }),
        }),
      );
    },
  );
  it("lists canonical drops and allocates identity while preserving dedicated legacy creation", async () => {
    await listDrops();
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: xsedWhere }),
    );
    const res = await createDrop(request("POST", { titleInternal: "Drop" }));
    expect(res.status).toBe(201);
    expect(prisma.experience.findMany).toHaveBeenCalledWith({
      where: { slug: { not: null } },
      select: { slug: true },
    });
    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: ["XSED"] }),
      }),
    );
  });
  it("dedicated get/update/delete recognize canonical rows without overwriting classification", async () => {
    expect((await getDrop(request("GET"), params)).status).toBe(200);
    expect(
      (await updateDrop(request("PUT", { titleInternal: "Updated" }), params))
        .status,
    ).toBe(200);
    const saved = vi.mocked(prisma.experience.update).mock.calls[0][0].data;
    expect(saved).not.toHaveProperty("type");
    expect(saved).not.toHaveProperty("level");
    expect((await deleteDrop(request("DELETE"), params)).status).toBe(204);
    expect(prisma.experience.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "exp", ...xsedWhere } }),
    );
  });
});
