import { describe, expect, it, vi } from "vitest";

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

import { getAccordionForStep } from "@/app/[locale]/journey/page";

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
