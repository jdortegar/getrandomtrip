// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    campaignSegment: { createMany: vi.fn(), deleteMany: vi.fn() },
    campaignSend: { create: vi.fn(), createMany: vi.fn() },
    contact: { create: vi.fn(), upsert: vi.fn() },
    segment: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
vi.mock("@/lib/deployment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/deployment")>()),
  isProductionDeployment: vi.fn(),
}));
vi.mock("../promo", async (importOriginal) => {
  const original = await importOriginal<typeof import("../promo")>();
  return { ...original, lookupPromotionCode: vi.fn() };
});

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
import { isProductionDeployment } from "@/lib/deployment";
import { SITE_URL } from "@/lib/seo/urls";
import { lookupPromotionCode } from "../promo";
import {
  CampaignError,
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  renderCampaignPreview,
  sendCampaignTest,
  updateCampaign,
} from "../campaigns";
import type { CampaignInput, PromotionCodeSummary } from "@/types/emailCampaign";

const createdAt = new Date("2026-10-17T10:00:00.000Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    name: "Founders",
    subject: "Tu escapada",
    preheader: null,
    title: "Llegó el momento",
    bodyMarkdown: "Hola **viajero**",
    ctaLabel: null,
    ctaUrl: null,
    locale: "es",
    segmentSources: ["WAITLIST"],
    segments: [
      { segment: { id: "seg_waitlist", name: "Lista de espera", systemKey: "WAITLIST" } },
    ],
    stripePromotionCodeId: null,
    promoCode: null,
    status: "DRAFT",
    sentAt: null,
    createdById: "a1",
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const input: CampaignInput = {
  name: "Founders",
  subject: "Tu escapada",
  preheader: null,
  title: "Llegó el momento",
  bodyMarkdown: "Hola **viajero**",
  ctaLabel: null,
  ctaUrl: null,
  locale: "es",
  segmentIds: ["seg_waitlist"],
  promoCode: null,
};

const include = {
  segments: {
    select: { segment: { select: { id: true, name: true, systemKey: true } } },
    orderBy: { segment: { name: "asc" } },
  },
};

const segmentRows = [
  { id: "seg_waitlist", systemKey: "WAITLIST" },
  { id: "seg_friends_family", systemKey: "FRIENDS_FAMILY" },
  { id: "s1", systemKey: null },
];

const summary: PromotionCodeSummary = {
  id: "promo_1",
  code: "FUNDADOR30",
  active: true,
  percentOff: 30,
  amountOffCents: null,
  currency: null,
  expiresAt: null,
  maxRedemptions: null,
  redemptionsUsed: 0,
  firstTimeOnly: false,
  minimumAmountCents: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.campaign.create).mockImplementation((async ({
    data,
  }: {
    data: Record<string, unknown>;
  }) => {
    const { segments: _nested, ...fields } = data;
    return row(fields);
  }) as never);
  vi.mocked(prisma.segment.findMany).mockImplementation((async ({
    where,
  }: {
    where: { id: { in: string[] } };
  }) => segmentRows.filter((segment) => where.id.in.includes(segment.id))) as never);
  vi.mocked(prisma.$transaction).mockImplementation((async (
    fn: (tx: typeof prisma) => unknown,
  ) => fn(prisma)) as never);
});

describe("listCampaigns / getCampaign", () => {
  it("lists newest first as domain objects", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      row({ sentAt: createdAt, status: "SENT" }),
    ] as never);

    const campaigns = await listCampaigns();

    expect(prisma.campaign.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include,
    });
    expect(campaigns[0]).toMatchObject({
      id: "c1",
      status: "SENT",
      sentAt: "2026-10-17T10:00:00.000Z",
      createdAt: "2026-10-17T10:00:00.000Z",
      segments: [{ id: "seg_waitlist", name: "Lista de espera", systemKey: "WAITLIST" }],
    });
    expect(campaigns[0]).not.toHaveProperty("createdById");
    expect(campaigns[0]).not.toHaveProperty("segmentSources");
  });

  it("returns null for a missing campaign", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);
    expect(await getCampaign("missing")).toBeNull();
  });
});

describe("createCampaign", () => {
  it("creates a DRAFT owned by the admin without a promo", async () => {
    const campaign = await createCampaign(input, "a1");

    expect(lookupPromotionCode).not.toHaveBeenCalled();
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdById: "a1",
        status: "DRAFT",
        stripePromotionCodeId: null,
        promoCode: null,
        segmentSources: ["WAITLIST"],
        segments: { create: [{ segmentId: "seg_waitlist" }] },
      }),
      include,
    });
    expect(vi.mocked(prisma.campaign.create).mock.calls[0][0].data).not.toHaveProperty("segmentIds");
    expect(campaign.status).toBe("DRAFT");
  });

  it("targets custom segments and mirrors only system keys into segmentSources", async () => {
    await createCampaign({ ...input, segmentIds: ["s1", "seg_friends_family"] }, "a1");

    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        segmentSources: ["FRIENDS_FAMILY"],
        segments: { create: [{ segmentId: "s1" }, { segmentId: "seg_friends_family" }] },
      }),
      include,
    });
  });

  it("rejects unknown segment ids before writing", async () => {
    await expect(
      createCampaign({ ...input, segmentIds: ["seg_waitlist", "missing"] }, "a1"),
    ).rejects.toEqual(new CampaignError("invalid_segment"));
    expect(prisma.campaign.create).not.toHaveBeenCalled();
  });

  it("stores the Stripe id and canonical code of an active promo", async () => {
    vi.mocked(lookupPromotionCode).mockResolvedValue(summary);

    await createCampaign({ ...input, promoCode: "fundador30" }, "a1");

    expect(lookupPromotionCode).toHaveBeenCalledWith("fundador30");
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripePromotionCodeId: "promo_1",
        promoCode: "FUNDADOR30",
      }),
      include,
    });
  });

  it.each([
    ["unknown", null],
    ["inactive", { ...summary, active: false }],
  ])("rejects an %s promo code", async (_label, lookup) => {
    vi.mocked(lookupPromotionCode).mockResolvedValue(lookup);

    await expect(
      createCampaign({ ...input, promoCode: "NOPE" }, "a1"),
    ).rejects.toEqual(new CampaignError("invalid_promo_code"));
    expect(prisma.campaign.create).not.toHaveBeenCalled();
  });
});

describe("updateCampaign", () => {
  it("updates a DRAFT and clears the promo with null", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
      row({ title: "New" }) as never,
    );

    const campaign = await updateCampaign("c1", { title: "New", promoCode: null });

    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "DRAFT" },
      data: { title: "New", stripePromotionCodeId: null, promoCode: null },
    });
    expect(campaign.title).toBe("New");
  });

  it("leaves the promo untouched when not provided", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(row() as never);

    await updateCampaign("c1", { subject: "S" });

    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "DRAFT" },
      data: { subject: "S" },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("replaces the targeted segments of a DRAFT in one transaction", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(row() as never);

    await updateCampaign("c1", { segmentIds: ["s1", "seg_waitlist"] });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "DRAFT" },
      data: { segmentSources: ["WAITLIST"] },
    });
    expect(prisma.campaignSegment.deleteMany).toHaveBeenCalledWith({
      where: { campaignId: "c1", segmentId: { notIn: ["s1", "seg_waitlist"] } },
    });
    expect(prisma.campaignSegment.createMany).toHaveBeenCalledWith({
      data: [
        { campaignId: "c1", segmentId: "s1" },
        { campaignId: "c1", segmentId: "seg_waitlist" },
      ],
      skipDuplicates: true,
    });
    expect(prisma.campaign.findUnique).toHaveBeenLastCalledWith({
      where: { id: "c1" },
      include,
    });
  });

  it("does not touch segments of a campaign that is no longer DRAFT", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(row({ status: "SENT" }) as never);

    await expect(updateCampaign("c1", { segmentIds: ["s1"] })).rejects.toEqual(
      new CampaignError("campaign_not_editable"),
    );
    expect(prisma.campaignSegment.deleteMany).not.toHaveBeenCalled();
    expect(prisma.campaignSegment.createMany).not.toHaveBeenCalled();
  });

  it("rejects unknown segment ids without writing", async () => {
    await expect(updateCampaign("c1", { segmentIds: ["missing"] })).rejects.toEqual(
      new CampaignError("invalid_segment"),
    );
    expect(prisma.campaign.updateMany).not.toHaveBeenCalled();
  });

  it("refuses non-DRAFT campaigns and missing ones", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValueOnce(
      row({ status: "SENT" }) as never,
    );
    await expect(updateCampaign("c1", { title: "x" })).rejects.toEqual(
      new CampaignError("campaign_not_editable"),
    );

    vi.mocked(prisma.campaign.findUnique).mockResolvedValueOnce(null);
    await expect(updateCampaign("c1", { title: "x" })).rejects.toEqual(
      new CampaignError("not_found"),
    );
  });

  it("rejects an invalid promo before writing", async () => {
    vi.mocked(lookupPromotionCode).mockResolvedValue(null);

    await expect(updateCampaign("c1", { promoCode: "NOPE" })).rejects.toEqual(
      new CampaignError("invalid_promo_code"),
    );
    expect(prisma.campaign.updateMany).not.toHaveBeenCalled();
  });
});

describe("deleteCampaign", () => {
  it("deletes only DRAFT campaigns", async () => {
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 1 });
    await deleteCampaign("c1");
    expect(prisma.campaign.deleteMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "DRAFT" },
    });
  });

  it("maps a refused delete to not editable or not found", async () => {
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValueOnce(
      row({ status: "SENDING" }) as never,
    );
    await expect(deleteCampaign("c1")).rejects.toEqual(
      new CampaignError("campaign_not_editable"),
    );

    vi.mocked(prisma.campaign.findUnique).mockResolvedValueOnce(null);
    await expect(deleteCampaign("c1")).rejects.toEqual(
      new CampaignError("not_found"),
    );
  });
});

describe("renderCampaignPreview", () => {
  it("renders with the token-less unsubscribe page and the live promo", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
      row({ stripePromotionCodeId: "promo_1", promoCode: "FUNDADOR30" }) as never,
    );
    vi.mocked(lookupPromotionCode).mockResolvedValue(summary);

    const html = await renderCampaignPreview("c1");

    expect(html).toContain(`href="${SITE_URL}/unsubscribe"`);
    expect(html).toContain("FUNDADOR30");
    expect(html).toContain("30% de descuento");
  });

  it("omits a promo whose Stripe id no longer matches", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
      row({ stripePromotionCodeId: "promo_old", promoCode: "FUNDADOR30" }) as never,
    );
    vi.mocked(lookupPromotionCode).mockResolvedValue(summary);

    expect(await renderCampaignPreview("c1")).not.toContain("FUNDADOR30");
  });

  it("throws not_found for a missing campaign", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);
    await expect(renderCampaignPreview("c1")).rejects.toEqual(
      new CampaignError("not_found"),
    );
  });
});

describe("sendCampaignTest", () => {
  beforeEach(() => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
      row({ locale: "en" }) as never,
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "admin@getrandomtrip.com",
    } as never);
  });

  it("sends to the admin without creating contacts or send rows", async () => {
    vi.mocked(isProductionDeployment).mockReturnValue(false);

    const result = await sendCampaignTest("c1", "a1");

    expect(result).toEqual({ to: "admin@getrandomtrip.com" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      select: { email: true },
      where: { id: "a1" },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const params = vi.mocked(sendMail).mock.calls[0][0];
    expect(params.to).toBe("admin@getrandomtrip.com");
    // sendMail already prefixes [TEST] outside production.
    expect(params.subject).toBe("Tu escapada");
    expect(params.content.html).toContain(`href="${SITE_URL}/en/unsubscribe"`);
    expect(params.content.text).toContain("Hola viajero");
    expect(prisma.campaignSend.create).not.toHaveBeenCalled();
    expect(prisma.campaignSend.createMany).not.toHaveBeenCalled();
    expect(prisma.contact.create).not.toHaveBeenCalled();
    expect(prisma.contact.upsert).not.toHaveBeenCalled();
  });

  it("prefixes [TEST] itself in production", async () => {
    vi.mocked(isProductionDeployment).mockReturnValue(true);

    await sendCampaignTest("c1", "a1");

    expect(vi.mocked(sendMail).mock.calls[0][0].subject).toBe("[TEST] Tu escapada");
  });

  it("fails when the admin has no email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: null } as never);

    await expect(sendCampaignTest("c1", "a1")).rejects.toEqual(
      new CampaignError("admin_email_missing"),
    );
    expect(sendMail).not.toHaveBeenCalled();
  });
});
