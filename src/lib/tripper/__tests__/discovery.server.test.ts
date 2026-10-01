import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import { getDiscoverableTrippers } from "../discovery.server";

vi.mock("@/lib/db/tripper-queries", () => ({
  getAllTrippers: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getAllTrippers).mockReset();
  vi.mocked(getAllTrippers).mockResolvedValue([]);
});

afterEach(() => vi.unstubAllEnvs());

it("skips the trippers query while discovery is hidden", async () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "production");

  await expect(getDiscoverableTrippers()).resolves.toEqual([]);
  expect(getAllTrippers).not.toHaveBeenCalled();
});

it("loads trippers while discovery is visible", async () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");

  await getDiscoverableTrippers();
  expect(getAllTrippers).toHaveBeenCalledOnce();
});
