import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ constructEvent: vi.fn(), update: vi.fn(), settleShare: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/db/payment", async (importOriginal) => ({
  // The real metadata parser runs, so route tests cover the stored values.
  promoAttributionFromMetadata: (await importOriginal<typeof import("@/lib/db/payment")>())
    .promoAttributionFromMetadata,
  updatePaymentFromStripeWebhook: mocks.update,
}));
vi.mock("@/lib/db/paymentShare", () => ({ settleShareFromStripe: mocks.settleShare }));
import { POST } from "../route";
beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllEnvs());
const request = () =>
  new NextRequest("https://site.test/api/stripe/webhook", {
    method: "POST",
    body: "verified by provider SDK",
    headers: { "stripe-signature": "signature" },
  });
it.each([true, false, undefined])(
  "forwards only verified provider live mode (%s)",
  async (livemode) => {
    const event = {
      type: "payment_intent.succeeded",
      data: {
        object: { id: "pi_test", status: "succeeded", created: 1, livemode },
      },
    };
    mocks.constructEvent.mockReturnValue(event);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      "pi_test",
      expect.objectContaining({ status: "APPROVED" }),
      event,
      livemode === true,
    );
  },
);
it("does not settle unsigned events", async () => {
  mocks.constructEvent.mockImplementation(() => {
    throw new Error("invalid signature");
  });
  expect((await POST(request())).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});
it.each(["nonproduction", undefined, "unknown"])(
  "rejects live events before writes for %s",
  async (context) => {
    vi.stubEnv("RT_DEPLOY_ENV", context);
    for (const live of [
      { event: true, intent: false },
      { event: false, intent: true },
    ]) {
      mocks.constructEvent.mockReturnValue({
        livemode: live.event,
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            status: "succeeded",
            created: 1,
            livemode: live.intent,
          },
        },
      });
      expect((await POST(request())).status).toBe(400);
      expect(mocks.update).not.toHaveBeenCalled();
    }
  },
);
it("accepts a signed test-mode event in nonproduction", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  mocks.constructEvent.mockReturnValue({
    livemode: false,
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test",
        status: "succeeded",
        created: 1,
        livemode: false,
      },
    },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledOnce();
});
it("returns a retryable failure when atomic settlement/enqueue fails", async () => {
  mocks.constructEvent.mockReturnValue({
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test",
        status: "succeeded",
        created: 1,
        livemode: true,
      },
    },
  });
  mocks.update.mockRejectedValue(new Error("outbox unavailable"));
  expect((await POST(request())).status).toBe(500);
});
it("persists the checkout promo code from succeeded intent metadata", async () => {
  mocks.constructEvent.mockReturnValue({
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test",
        status: "succeeded",
        created: 1,
        livemode: false,
        metadata: { promoCode: "FUNDADOR30", promoCodeId: "promo_123", discountAmountUsd: "30.5" },
      },
    },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(
    "pi_test",
    expect.objectContaining({
      promoCode: "FUNDADOR30",
      stripePromotionCodeId: "promo_123",
      promoDiscountUsd: 30.5,
    }),
    expect.anything(),
    false,
  );
});
it.each([{}, { promoCode: "", promoCodeId: "", discountAmountUsd: "0" }, undefined])(
  "leaves promo columns untouched without promo metadata (%o)",
  async (metadata) => {
    mocks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: { id: "pi_test", status: "succeeded", created: 1, metadata },
      },
    });
    expect((await POST(request())).status).toBe(200);
    const [, data] = mocks.update.mock.calls[0];
    expect(data.promoCode).toBeUndefined();
    expect(data.stripePromotionCodeId).toBeUndefined();
    expect(data.promoDiscountUsd).toBeUndefined();
  },
);
it.each(["", "abc", "-5", "0", "Infinity", 30])(
  "leaves the promo discount unset for invalid metadata (%o)",
  async (discountAmountUsd) => {
    mocks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test",
          status: "succeeded",
          created: 1,
          metadata: { promoCode: "FUNDADOR30", promoCodeId: "promo_123", discountAmountUsd },
        },
      },
    });
    expect((await POST(request())).status).toBe(200);
    const [, data] = mocks.update.mock.calls[0];
    expect(data.stripePromotionCodeId).toBe("promo_123");
    expect(data.promoDiscountUsd).toBeUndefined();
  },
);
it("does not attribute a promo code to a failed intent", async () => {
  mocks.constructEvent.mockReturnValue({
    type: "payment_intent.payment_failed",
    data: {
      object: {
        id: "pi_test",
        status: "requires_payment_method",
        created: 1,
        metadata: { promoCode: "FUNDADOR30", promoCodeId: "promo_123", discountAmountUsd: "30" },
      },
    },
  });
  expect((await POST(request())).status).toBe(200);
  const [, data] = mocks.update.mock.calls[0];
  expect(data.stripePromotionCodeId).toBeUndefined();
  expect(data.promoDiscountUsd).toBeUndefined();
});
it.each([
  ["payment_intent.succeeded", "succeeded", "APPROVED"],
  ["payment_intent.payment_failed", "requires_payment_method", "FAILED"],
])("settles a companion share intent (%s) without touching the trip payment", async (type, status, expected) => {
  mocks.settleShare.mockResolvedValue(true);
  mocks.constructEvent.mockReturnValue({
    type,
    data: { object: { id: "pi_share", status, created: 10, metadata: { kind: "SHARE", shareId: "share-1" } } },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.settleShare).toHaveBeenCalledWith(
    "pi_share",
    expected,
    status === "succeeded" ? new Date(10_000) : undefined,
  );
  expect(mocks.update).not.toHaveBeenCalled();
});
it("acknowledges a share intent no share holds anymore", async () => {
  mocks.settleShare.mockResolvedValue(false);
  mocks.constructEvent.mockReturnValue({
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_old_share", status: "succeeded", created: 1, metadata: { kind: "SHARE" } } },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("keeps routing organizer and total intents to the trip payment", async () => {
  mocks.constructEvent.mockReturnValue({
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_org", status: "succeeded", created: 1, metadata: { paymentMode: "INDIVIDUAL" } } },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.settleShare).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenCalledWith("pi_org", expect.objectContaining({ status: "APPROVED" }), expect.anything(), false);
});
