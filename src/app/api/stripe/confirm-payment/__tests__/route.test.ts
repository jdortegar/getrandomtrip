import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findLegacy: vi.fn(),
  update: vi.fn(),
  retrieve: vi.fn(),
  findShare: vi.fn(),
  settleShare: vi.fn(),
}));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { id: "buyer" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: mocks.retrieve } }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/db/payment", async (importOriginal) => ({
  // The real metadata parser runs, so route tests cover the stored values.
  promoAttributionFromMetadata: (await importOriginal<typeof import("@/lib/db/payment")>())
    .promoAttributionFromMetadata,
  findPaymentByStripeIntentId: mocks.find,
  findPaymentByProviderId: mocks.findLegacy,
  updatePaymentFromStripeWebhook: mocks.update,
}));
vi.mock("@/lib/db/paymentShare", () => ({
  findShareByIntent: mocks.findShare,
  settleShareFromStripe: mocks.settleShare,
}));
import { POST } from "../route";
const request = () =>
  new NextRequest("http://localhost/api/stripe/confirm-payment", {
    method: "POST",
    body: JSON.stringify({ paymentIntentId: "pi_test" }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.retrieve.mockResolvedValue({
    id: "pi_test",
    status: "succeeded",
    created: 1,
    livemode: true,
  });
});
it("does not retrieve or settle another buyer's intent", async () => {
  mocks.find.mockResolvedValue({ userId: "other-buyer" });
  expect((await POST(request())).status).toBe(403);
  expect(mocks.retrieve).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});
it("requires an owned payment row before provider access", async () => {
  mocks.find.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(404);
  expect(mocks.retrieve).not.toHaveBeenCalled();
});
it("settles the current buyer's provider-verified intent", async () => {
  mocks.find.mockResolvedValue({ userId: "buyer" });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(
    "pi_test",
    expect.objectContaining({ status: "APPROVED" }),
    undefined,
    true,
  );
});

it("authorizes an owned legacy provider-ID row before repairing settlement", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue({ userId: "buyer" });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith("pi_test", expect.objectContaining({ status: "APPROVED" }), undefined, true);
});

it("stores the checkout promo code from the verified intent metadata", async () => {
  mocks.find.mockResolvedValue({ userId: "buyer" });
  mocks.retrieve.mockResolvedValue({
    id: "pi_test",
    status: "succeeded",
    created: 1,
    livemode: true,
    metadata: { promoCode: "FUNDADOR30", promoCodeId: "promo_123", discountAmountUsd: "30" },
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(
    "pi_test",
    expect.objectContaining({ promoCode: "FUNDADOR30", stripePromotionCodeId: "promo_123", promoDiscountUsd: 30 }),
    undefined,
    true,
  );
});

it("leaves promo columns unset when checkout applied no promo", async () => {
  mocks.find.mockResolvedValue({ userId: "buyer" });
  mocks.retrieve.mockResolvedValue({
    id: "pi_test",
    status: "succeeded",
    created: 1,
    livemode: true,
    metadata: { promoCode: "", promoCodeId: "", discountAmountUsd: "0" },
  });
  await POST(request());
  const data = mocks.update.mock.calls[0][1];
  expect(data.promoCode).toBeUndefined();
  expect(data.stripePromotionCodeId).toBeUndefined();
  expect(data.promoDiscountUsd).toBeUndefined();
});

it("leaves the promo discount unset for malformed metadata", async () => {
  mocks.find.mockResolvedValue({ userId: "buyer" });
  mocks.retrieve.mockResolvedValue({
    id: "pi_test",
    status: "succeeded",
    created: 1,
    livemode: true,
    metadata: { promoCode: "FUNDADOR30", promoCodeId: "promo_123", discountAmountUsd: "abc" },
  });
  await POST(request());
  const data = mocks.update.mock.calls[0][1];
  expect(data.stripePromotionCodeId).toBe("promo_123");
  expect(data.promoDiscountUsd).toBeUndefined();
});

it("takes live mode only from Stripe, not the browser request", async () => {
  mocks.find.mockResolvedValue({ userId: "buyer" });
  mocks.retrieve.mockResolvedValue({ id: "pi_test", status: "succeeded", created: 1, livemode: false });
  const forged = new NextRequest("http://localhost/api/stripe/confirm-payment", {
    method: "POST", body: JSON.stringify({ paymentIntentId: "pi_test", livemode: true }),
  });
  expect((await POST(forged)).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith("pi_test", expect.objectContaining({ status: "APPROVED" }), undefined, false);
});
it("settles the signed-in companion's own share intent, never the trip payment", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue(null);
  mocks.findShare.mockResolvedValue({ id: "share-1", userId: "buyer", stripePaymentIntentId: "pi_test" });
  mocks.retrieve.mockResolvedValue({ id: "pi_test", status: "succeeded", created: 7, metadata: { shareId: "share-1", kind: "SHARE" } });
  const res = await POST(request());
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "succeeded" });
  expect(mocks.settleShare).toHaveBeenCalledWith("pi_test", "APPROVED", new Date(7000));
  expect(mocks.update).not.toHaveBeenCalled();
});
it("refuses another person's share intent without asking Stripe", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue(null);
  mocks.findShare.mockResolvedValue({ id: "share-1", userId: "someone-else", stripePaymentIntentId: "pi_test" });
  expect((await POST(request())).status).toBe(403);
  expect(mocks.retrieve).not.toHaveBeenCalled();
  expect(mocks.settleShare).not.toHaveBeenCalled();
});
it("keeps 404 when neither a payment nor a share holds the intent", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue(null);
  mocks.findShare.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(404);
});
it("does not settle a share from an intent issued for another share", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue(null);
  mocks.findShare.mockResolvedValue({ id: "share-1", userId: "buyer", stripePaymentIntentId: "pi_test" });
  mocks.retrieve.mockResolvedValue({ id: "pi_test", status: "succeeded", created: 7, metadata: { shareId: "share-2" } });
  await POST(request());
  expect(mocks.settleShare).not.toHaveBeenCalled();
});

