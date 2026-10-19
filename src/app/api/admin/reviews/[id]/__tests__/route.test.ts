import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/email", () => ({
  sendReviewApprovedForTripper: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    review: { findUnique: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

function approve(): Promise<Response> {
  return PATCH(
    new NextRequest("http://localhost/api/admin/reviews/review-1", {
      method: "PATCH",
      body: JSON.stringify({ isApproved: true }),
    }),
    { params: Promise.resolve({ id: "review-1" }) },
  );
}

function mockTripperLocale(locale: string | null) {
  (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ where }: { where: { id: string } }) =>
      where.id === "admin-1"
        ? { id: "admin-1", roles: ["ADMIN"] }
        : { locale },
  );
}

describe("PATCH /api/admin/reviews/[id] — approval notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.review.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "review-1",
      isApproved: false,
      tripperId: "tripper-1",
    });
    (prisma.review.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "review-1",
      isApproved: true,
      isPublic: false,
      rating: 5,
      tripperId: "tripper-1",
    });
  });

  function notificationData(): Record<string, unknown> {
    return (prisma.notification.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.data;
  }

  it("notifies the tripper with a Spanish title and body by default", async () => {
    mockTripperLocale(null);
    const res = await approve();
    expect(res.status).toBe(200);
    expect(notificationData()).toMatchObject({
      type: "REVIEW_APPROVED",
      title: "Tienes una nueva reseña aprobada",
      body: "Un viajero te calificó con 5/5. La reseña ya fue aprobada y puedes verla en tu panel.",
    });
  });

  it("localizes the notification for an English-speaking tripper", async () => {
    mockTripperLocale("en");
    await approve();
    expect(notificationData()).toMatchObject({
      title: "You have a new approved review",
      body: "A traveler rated you 5/5. The review has been approved and you can see it in your dashboard.",
    });
  });
});
