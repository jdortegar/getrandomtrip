import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperReviews: vi.fn().mockResolvedValue({ reviews: [], total: 0 }),
  getTripperReviewStats: vi.fn().mockResolvedValue({
    averageRating: 0,
    totalReviews: 0,
    nps: 0,
    promoters: 0,
    detractors: 0,
  }),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getTripperReviews } from "@/lib/db/tripper-queries";
import { GET } from "../route";

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/tripper/reviews${query}`);
}

describe("GET /api/tripper/reviews — status + search passthrough", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "tripper-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tripper-1",
      roles: ["TRIPPER"],
    });
  });

  it("defaults status to 'all' when not provided", async () => {
    await GET(makeRequest(""));

    const args = (getTripperReviews as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args.status).toBe("all");
  });

  it("passes through a valid status value", async () => {
    await GET(makeRequest("?status=unapproved"));

    const args = (getTripperReviews as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args.status).toBe("unapproved");
  });

  it("falls back to 'all' for an invalid status value", async () => {
    await GET(makeRequest("?status=bogus"));

    const args = (getTripperReviews as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args.status).toBe("all");
  });

  it("passes through a trimmed search term", async () => {
    await GET(makeRequest("?search=%20Ana%20"));

    const args = (getTripperReviews as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args.search).toBe("Ana");
  });

  it("omits search when not provided", async () => {
    await GET(makeRequest(""));

    const args = (getTripperReviews as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args.search).toBeUndefined();
  });
});
