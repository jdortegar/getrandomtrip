import { describe, expect, it, vi, beforeEach } from "vitest";

// `page.tsx` now imports `attribution-server.ts` / `tripper-queries.ts`
// (Node-only, both prisma-touching) for the tripper-attribution server-side
// resolve (PR3). This suite only exercises the pure `getAccordionForStep`
// re-export and never invokes the page component itself, but merely
// importing the module still constructs the real `PrismaClient` at
// module-load time — which throws outside a configured DB env. Mock it away,
// same pattern as `attribution-server.test.ts`.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { findMany: vi.fn() },
  },
}));

const readAttributionSlugMock = vi.fn();
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: () => readAttributionSlugMock(),
}));

const getTripperJourneyContextMock = vi.fn();
vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperJourneyContext: (slug: string) =>
    getTripperJourneyContextMock(slug),
}));

import { getAccordionForStep } from "@/app/[locale]/journey/page";
import JourneyPage from "@/app/[locale]/journey/page";

describe("JourneyPage — unvalidated tripperSlug forwarding (review finding #3)", () => {
  beforeEach(() => {
    readAttributionSlugMock.mockReset();
    getTripperJourneyContextMock.mockReset();
  });

  it("does not forward the raw tripperSlug when the resolved tripper state is 'none' (not_found)", async () => {
    readAttributionSlugMock.mockResolvedValue("dead-tripper");
    getTripperJourneyContextMock.mockResolvedValue({ status: "not_found" });

    const element = await JourneyPage({ params: Promise.resolve({ locale: "es" }) });

    expect(element.props.tripperSlug).toBeUndefined();
    expect(element.props.tripperState).toEqual({ status: "none" });
  });

  it("does not forward the raw tripperSlug when the tripper is inactive", async () => {
    readAttributionSlugMock.mockResolvedValue("paused-tripper");
    getTripperJourneyContextMock.mockResolvedValue({
      status: "inactive",
      name: "Paused Tripper",
    });

    const element = await JourneyPage({ params: Promise.resolve({ locale: "es" }) });

    expect(element.props.tripperSlug).toBeUndefined();
    expect(element.props.tripperState).toEqual({
      status: "unavailable",
      name: "Paused Tripper",
    });
  });

  it("forwards the raw tripperSlug when the tripper resolves ok", async () => {
    readAttributionSlugMock.mockResolvedValue("live-tripper");
    getTripperJourneyContextMock.mockResolvedValue({
      status: "ok",
      context: {
        name: "Live Tripper",
        avatarUrl: null,
        location: null,
        allowedTypes: [],
        allowedLevelsByType: {},
        priceOverrides: null,
      },
    });

    const element = await JourneyPage({ params: Promise.resolve({ locale: "es" }) });

    expect(element.props.tripperSlug).toBe("live-tripper");
    expect(element.props.tripperState.status).toBe("ok");
  });
});

describe("getAccordionForStep", () => {
  it("returns 'pax' for the pax substep — Travellers is a normal collapsible accordion item, same as Origin/Dates/Transport", () => {
    expect(getAccordionForStep("details", "pax", "group")).toBe("pax");
  });

  it("still maps dates/transport/origin substeps under details", () => {
    expect(getAccordionForStep("details", "dates")).toBe("dates");
    expect(getAccordionForStep("details", "transport")).toBe("transport");
    expect(getAccordionForStep("details", "origin")).toBe("origin");
    expect(getAccordionForStep("details")).toBe("origin");
  });

  it("defaults to 'pax' (not 'origin') when no substep is requested and the travel type has the Travellers substep — e.g. clicking the 'Details and planning' tab itself, or advancing via Next", () => {
    expect(getAccordionForStep("details", undefined, "group")).toBe("pax");
    expect(getAccordionForStep("details", undefined, "family")).toBe("pax");
    expect(getAccordionForStep("details", undefined, "paws")).toBe("pax");
  });

  it("still defaults to 'origin' for travel types without the Travellers substep", () => {
    expect(getAccordionForStep("details", undefined, "couple")).toBe("origin");
    expect(getAccordionForStep("details", undefined, null)).toBe("origin");
  });

  it("an explicit substepId always wins over the travelType-based default", () => {
    expect(getAccordionForStep("details", "dates", "group")).toBe("dates");
    expect(getAccordionForStep("details", "origin", "group")).toBe("origin");
  });

  it("keeps existing budget/excuse/preferences behavior unchanged", () => {
    expect(getAccordionForStep("budget", "experience")).toBe("experience");
    expect(getAccordionForStep("budget")).toBe("travel-type");
    expect(getAccordionForStep("excuse", "refine-details")).toBe(
      "refine-details",
    );
    // "reason", not "excuse" — the tab id and its first substep's accordion
    // value used to collide on the same string ("excuse"), which silently
    // broke the sidebar's active-substep highlight once activeSubstepId was
    // actually wired up. Renamed for consistency with the dictionary's
    // substep id and JourneyProgressSidebar's own isSubstepComplete check,
    // both of which already used "reason".
    expect(getAccordionForStep("excuse")).toBe("reason");
    expect(getAccordionForStep("preferences")).toBe("filters");
  });
});
