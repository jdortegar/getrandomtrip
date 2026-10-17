// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({
  promotionCodes: { list: vi.fn() },
  coupons: { retrieve: vi.fn() },
}));

vi.mock("@/lib/stripe", () => ({ getStripe: () => stripe }));
vi.mock("@/lib/prisma", () => ({
  prisma: { payment: { count: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { discountLabel, lookupPromotionCode, toEmailPromo } from "../promo";
import type { PromotionCodeSummary } from "@/types/emailCampaign";

const coupon = {
  id: "co_1",
  valid: true,
  percent_off: 30,
  amount_off: null,
  currency: null,
  redeem_by: null,
};

function promotion(overrides: Record<string, unknown> = {}) {
  return {
    id: "promo_1",
    code: "FUNDADOR30",
    active: true,
    expires_at: 1798718400, // 2026-12-31T12:00:00Z
    max_redemptions: 50,
    restrictions: {
      first_time_transaction: true,
      minimum_amount: 10000,
      minimum_amount_currency: "usd",
    },
    promotion: { type: "coupon", coupon: "co_1" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  stripe.coupons.retrieve.mockResolvedValue(coupon);
  vi.mocked(prisma.payment.count).mockResolvedValue(7);
});

describe("lookupPromotionCode", () => {
  it("normalizes the code and maps the Stripe rules", async () => {
    stripe.promotionCodes.list.mockResolvedValue({ data: [promotion()] });

    const summary = await lookupPromotionCode("  fundador30 ");

    expect(stripe.promotionCodes.list).toHaveBeenCalledWith({
      code: "FUNDADOR30",
      limit: 1,
    });
    expect(stripe.coupons.retrieve).toHaveBeenCalledWith("co_1");
    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: {
        stripePromotionCodeId: "promo_1",
        status: { in: ["APPROVED", "COMPLETED"] },
      },
    });
    expect(summary).toEqual({
      id: "promo_1",
      code: "FUNDADOR30",
      active: true,
      percentOff: 30,
      amountOffCents: null,
      currency: null,
      expiresAt: "2026-12-31T12:00:00.000Z",
      maxRedemptions: 50,
      redemptionsUsed: 7,
      firstTimeOnly: true,
      minimumAmountCents: 10000,
    });
  });

  it("uses an expanded coupon, the earlier coupon redeem_by, and amount off", async () => {
    stripe.promotionCodes.list.mockResolvedValue({
      data: [
        promotion({
          expires_at: null,
          max_redemptions: null,
          restrictions: {},
          promotion: {
            type: "coupon",
            coupon: {
              ...coupon,
              percent_off: null,
              amount_off: 2500,
              currency: "usd",
              redeem_by: 1767225600, // 2026-01-01T00:00:00Z
            },
          },
        }),
      ],
    });

    const summary = await lookupPromotionCode("FUNDADOR30");

    expect(stripe.coupons.retrieve).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      percentOff: null,
      amountOffCents: 2500,
      currency: "usd",
      expiresAt: "2026-01-01T00:00:00.000Z",
      maxRedemptions: null,
      firstTimeOnly: false,
      minimumAmountCents: null,
    });
  });

  it("reports inactive when the promotion or its coupon is no longer valid", async () => {
    stripe.promotionCodes.list.mockResolvedValue({
      data: [promotion({ active: false })],
    });
    expect((await lookupPromotionCode("FUNDADOR30"))?.active).toBe(false);

    stripe.promotionCodes.list.mockResolvedValue({ data: [promotion()] });
    stripe.coupons.retrieve.mockResolvedValue({ ...coupon, valid: false });
    expect((await lookupPromotionCode("FUNDADOR30"))?.active).toBe(false);
  });

  it("returns null for unknown or blank codes", async () => {
    stripe.promotionCodes.list.mockResolvedValue({ data: [] });
    expect(await lookupPromotionCode("NOPE")).toBeNull();

    expect(await lookupPromotionCode("   ")).toBeNull();
    expect(stripe.promotionCodes.list).toHaveBeenCalledTimes(1);
  });
});

describe("discountLabel", () => {
  const base: PromotionCodeSummary = {
    id: "promo_1",
    code: "X",
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

  it("formats percent discounts per locale", () => {
    expect(discountLabel(base, "en")).toBe("30% off");
    expect(discountLabel(base, "es")).toBe("30% de descuento");
    expect(discountLabel({ ...base, percentOff: 12.5 }, "en")).toBe("12.5% off");
  });

  it("formats amount discounts with the coupon currency", () => {
    const amount = { ...base, percentOff: null, amountOffCents: 2500, currency: "usd" };
    expect(discountLabel(amount, "en")).toBe("$25 off");
    expect(discountLabel(amount, "es")).toMatch(/^US\$\s?25 de descuento$/);
  });
});

describe("toEmailPromo", () => {
  it("builds the template promo props", () => {
    expect(
      toEmailPromo(
        {
          id: "promo_1",
          code: "FUNDADOR30",
          active: true,
          percentOff: 30,
          amountOffCents: null,
          currency: null,
          expiresAt: "2026-12-31T12:00:00.000Z",
          maxRedemptions: null,
          redemptionsUsed: 0,
          firstTimeOnly: false,
          minimumAmountCents: null,
        },
        "es",
      ),
    ).toEqual({
      code: "FUNDADOR30",
      discountLabel: "30% de descuento",
      expiresAt: "2026-12-31T12:00:00.000Z",
    });
  });
});
