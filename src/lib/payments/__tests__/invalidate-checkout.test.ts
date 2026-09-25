import { beforeEach, describe, expect, it, vi } from "vitest";
const stripe = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn(), cancel: vi.fn() },
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripe }));
import { invalidateCheckoutForEdit } from "../invalidate-checkout";
const payment = { status: "PENDING", stripePaymentIntentId: "pi_old" };

describe("invalidateCheckoutForEdit", () => {
  beforeEach(() => vi.resetAllMocks());
  it.each(["processing", "succeeded", "requires_capture", "requires_action"])(
    "rejects a %s intent before traveler mutation",
    async (status) => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_old",
        status,
      });
      await expect(invalidateCheckoutForEdit(payment)).rejects.toMatchObject({
        status: 409,
      });
      expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    },
  );
  it("awaits cancellation before allowing the old party to change", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_old",
      status: "requires_payment_method",
    });
    stripe.paymentIntents.cancel.mockRejectedValue(
      new Error("Confirmation won"),
    );
    await expect(invalidateCheckoutForEdit(payment)).rejects.toMatchObject({
      status: 409,
    });
    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith("pi_old");
  });
  it("leaves an unchanged-price room edit's intent intact", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_old",
      status: "requires_payment_method",
    });
    await invalidateCheckoutForEdit(payment, false);
    expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled();
  });
});
