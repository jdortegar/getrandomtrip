import { expect, it, vi, beforeEach } from "vitest";
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
  resolveLiveAttribution: vi.fn(),
}));
vi.mock("../ExperiencesPageClient", () => ({ default: () => null }));
import {
  readAttributionSlug,
  resolveLiveAttribution,
} from "@/lib/tripper/attribution-server";
import Page from "../page";
beforeEach(() => vi.resetAllMocks());
it("loads current validated attribution into the root planner", async () => {
  vi.mocked(readAttributionSlug).mockResolvedValue("expert");
  vi.mocked(resolveLiveAttribution).mockResolvedValue({
    priceOverrides: { couple: { essenza: 1000 } },
  } as never);
  const result = await Page({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({}),
  });
  expect(result.props.tripperContext.priceOverrides.couple.essenza).toBe(1000);
  expect(resolveLiveAttribution).toHaveBeenCalledWith("expert");
});
it("keeps explicit Randomtrip catalog mode and does not read attribution", async () => {
  const result = await Page({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({ catalog: "randomtrip" }),
  });
  expect(result.props.tripperContext).toBeNull();
  expect(readAttributionSlug).not.toHaveBeenCalled();
});
