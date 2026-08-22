import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const cookieStore = new Map<string, { value: string }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
  }),
}));

process.env.NEXTAUTH_SECRET = "test-secret-for-attribution-server";

import {
  GRT_TRIPPER_COOKIE,
  GRT_TRIPPER_LAST_SEEN_COOKIE,
  getAttributionSecret,
  signAttribution,
} from "@/lib/tripper/attribution";
import {
  readAttributionSlug,
  readLastSeenTripperSlug,
} from "../attribution-server";

describe("readAttributionSlug / readLastSeenTripperSlug (review finding #4 — separate cookies)", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("readAttributionSlug reads only grt_tripper, ignoring grt_tripper_last_seen", async () => {
    const secret = getAttributionSecret();
    const liveToken = await signAttribution("maria", secret, 3600);
    cookieStore.set(GRT_TRIPPER_COOKIE, { value: liveToken });

    expect(await readAttributionSlug()).toBe("maria");
  });

  it("readLastSeenTripperSlug reads only grt_tripper_last_seen, ignoring grt_tripper", async () => {
    const secret = getAttributionSecret();
    const lastSeenToken = await signAttribution("carlos", secret, 3600);
    cookieStore.set(GRT_TRIPPER_LAST_SEEN_COOKIE, { value: lastSeenToken });

    expect(await readLastSeenTripperSlug()).toBe("carlos");
  });

  it("readLastSeenTripperSlug survives grt_tripper being cleared (toggle-to-randomtrip scenario)", async () => {
    const secret = getAttributionSecret();
    const lastSeenToken = await signAttribution("carlos", secret, 3600);
    cookieStore.set(GRT_TRIPPER_LAST_SEEN_COOKIE, { value: lastSeenToken });
    // grt_tripper intentionally absent — simulates the cookie having been
    // cleared by the "switch to randomtrip" toggle.

    expect(await readAttributionSlug()).toBeNull();
    expect(await readLastSeenTripperSlug()).toBe("carlos");
  });

  it("returns null for both when no cookies are present", async () => {
    expect(await readAttributionSlug()).toBeNull();
    expect(await readLastSeenTripperSlug()).toBeNull();
  });
});
