import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ constructEvent: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/db/payment", () => ({
  updatePaymentFromStripeWebhook: mocks.update,
}));
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
