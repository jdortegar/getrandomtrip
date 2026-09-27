import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findLegacy: vi.fn(),
  update: vi.fn(),
  retrieve: vi.fn(),
}));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { id: "buyer" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: mocks.retrieve } }),
}));
vi.mock("@/lib/db/payment", () => ({
  findPaymentByStripeIntentId: mocks.find,
  findPaymentByProviderId: mocks.findLegacy,
  updatePaymentFromStripeWebhook: mocks.update,
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
  );
});

it("authorizes an owned legacy provider-ID row before repairing settlement", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.findLegacy.mockResolvedValue({ userId: "buyer" });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith("pi_test", expect.objectContaining({ status: "APPROVED" }));
});
