import { afterEach, expect, it, vi } from "vitest";
import type { TripperAttributionDict } from "@/lib/types/dictionary";
import { AttributionModeBanner } from "../AttributionModeBanner";

const server = vi.hoisted(() => ({
  readAttributionSlug: vi.fn(),
  readLastSeenTripperSlug: vi.fn(),
  resolveLiveAttribution: vi.fn(),
}));
vi.mock("@/lib/tripper/attribution-server", () => server);

const copy = {} as TripperAttributionDict;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it("renders nothing in production without reading cookies or the DB", async () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "production");
  server.readAttributionSlug.mockResolvedValue("alex");
  server.resolveLiveAttribution.mockResolvedValue({ name: "Alex" });

  expect(await AttributionModeBanner({ copy })).toBeNull();
  expect(server.readAttributionSlug).not.toHaveBeenCalled();
  expect(server.readLastSeenTripperSlug).not.toHaveBeenCalled();
  expect(server.resolveLiveAttribution).not.toHaveBeenCalled();
});

it("still resolves attribution in nonproduction", async () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
  server.readAttributionSlug.mockResolvedValue("alex");
  server.resolveLiveAttribution.mockResolvedValue({ name: "Alex" });

  const banner = await AttributionModeBanner({ copy });
  expect(banner).not.toBeNull();
  expect(server.resolveLiveAttribution).toHaveBeenCalledWith("alex");
});
