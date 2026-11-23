import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { payment: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/payments/stripeReceiptUrl", () => ({ getStripeReceiptUrl: vi.fn() }));

import { getServerSession } from "next-auth";
import { getStripeReceiptUrl } from "@/lib/payments/stripeReceiptUrl";
import { prisma } from "@/lib/prisma";
import { GET } from "../route";

const sessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findPaymentMock = prisma.payment.findUnique as ReturnType<typeof vi.fn>;
const receiptMock = vi.mocked(getStripeReceiptUrl);

const RECEIPT = "https://pay.stripe.com/receipts/payment/abc123";

function get(id = "trip-1") {
  return GET(new NextRequest(`http://localhost/api/trips/${id}/receipt`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: "buyer-1" } });
  findPaymentMock.mockResolvedValue({ userId: "buyer-1", stripePaymentIntentId: "pi_1" });
  receiptMock.mockResolvedValue(RECEIPT);
});

describe("GET /api/trips/[id]/receipt", () => {
  it("redirects the buyer to the Stripe receipt", async () => {
    const res = await get();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(RECEIPT);
    expect(findPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tripRequestId: "trip-1" } }),
    );
    expect(receiptMock).toHaveBeenCalledWith("pi_1");
  });

  it("rejects unauthenticated requests", async () => {
    sessionMock.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(findPaymentMock).not.toHaveBeenCalled();
  });

  it("returns 404 to anyone but the buyer, without asking Stripe", async () => {
    sessionMock.mockResolvedValue({ user: { id: "companion-1" } });
    expect((await get()).status).toBe(404);
    expect(receiptMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the trip has no payment", async () => {
    findPaymentMock.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
  });

  it("returns 404 when Stripe has no receipt yet", async () => {
    receiptMock.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
  });

  it("never redirects outside Stripe's receipt host", async () => {
    receiptMock.mockResolvedValue("https://evil.example.com/receipt");
    const res = await get();
    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
  });
});
