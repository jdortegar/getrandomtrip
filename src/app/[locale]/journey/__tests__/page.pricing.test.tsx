import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperJourneyContext: vi.fn(),
}));
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
}));
vi.mock("@/lib/pricing/journey-pricing.server", () => ({
  resolveJourneyPricing: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";
import { readAttributionSlug } from "@/lib/tripper/attribution-server";
import { resolveJourneyPricing } from "@/lib/pricing/journey-pricing.server";
import Page from "../page";
beforeEach(() => vi.resetAllMocks());
it("keeps marketing context distinct from the persisted booking's price context", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { email: "buyer@example.test" },
  });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "buyer" } as never);
  vi.mocked(readAttributionSlug).mockResolvedValue("current");
  vi.mocked(getTripperJourneyContext).mockResolvedValue({
    status: "ok",
    context: { name: "Current", priceOverrides: { couple: { essenza: 350 } } },
  } as never);
  vi.mocked(resolveJourneyPricing).mockResolvedValue({
    bookingBound: true,
    overrides: { couple: { essenza: 1000 } },
  });
  const result = await Page({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({
      tripRequestId: "owned",
      draftId: "local-only",
      travelType: "couple",
    }),
  });
  expect(resolveJourneyPricing).toHaveBeenCalledWith({
    currentOverrides: { couple: { essenza: 350 } },
    tripRequestId: "owned",
    type: "couple",
    userId: "buyer",
  });
  expect(result.props.pricing.overrides.couple.essenza).toBe(1000);
  expect(result.props.tripperState.context.name).toBe("Current");
  expect(result.props.tripperSlug).toBe("current");
});
it("uses current anonymous context without treating a local draft ID as a database ID", async () => {
  vi.mocked(readAttributionSlug).mockResolvedValue(null);
  vi.mocked(getServerSession).mockResolvedValue(null);
  vi.mocked(resolveJourneyPricing).mockResolvedValue({
    bookingBound: false,
    overrides: null,
  });
  const result = await Page({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({ draftId: "local-only" }),
  });
  expect(resolveJourneyPricing).toHaveBeenCalledWith({
    currentOverrides: null,
    tripRequestId: undefined,
    type: "couple",
    userId: undefined,
  });
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
  expect(result.props.pricing.bookingBound).toBe(false);
  expect(result.props.tripperState).toEqual({ status: "none" });
});
it("does not render private or terminal explicit-resume pricing when lookup fails", async () => {
  vi.mocked(readAttributionSlug).mockResolvedValue(null);
  vi.mocked(getServerSession).mockResolvedValue(null);
  vi.mocked(resolveJourneyPricing).mockResolvedValue(null);
  await expect(
    Page({ searchParams: Promise.resolve({ tripRequestId: "private" }) }),
  ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
});
it.each([
  {
    search: { tripRequestId: ["", "other"], travelType: ["", "xsed"] },
    id: undefined,
    type: "",
    family: "journey",
  },
  {
    search: { tripRequestId: ["owned", "other"], travelType: "couple" },
    id: "owned",
    type: "couple",
    family: "journey",
  },
  {
    search: { travelType: ["xsed", "couple"] },
    id: undefined,
    type: "xsed",
    family: "xsed",
  },
  {
    search: {
      tripRequestId: [" owned ", "other"],
      travelType: ["couple", "xsed"],
    },
    id: "owned",
    type: "couple",
    family: "journey",
  },
])(
  "normalizes repeated pricing parameters to their first values: $type",
  async ({ search, id, type, family }) => {
    vi.mocked(readAttributionSlug).mockResolvedValue(null);
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: "buyer@example.test" },
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "buyer",
    } as never);
    vi.mocked(resolveJourneyPricing).mockResolvedValue({
      bookingBound: true,
      overrides: null,
    });
    const result = await Page({ searchParams: Promise.resolve(search) });
    expect(resolveJourneyPricing).toHaveBeenCalledWith({
      currentOverrides: null,
      tripRequestId: id,
      type,
      userId: "buyer",
    });
    expect(JSON.parse(result.props.pricing.binding)).toEqual([
      "buyer@example.test",
      id ?? "",
      family,
    ]);
  },
);
