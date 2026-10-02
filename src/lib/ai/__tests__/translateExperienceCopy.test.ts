import { describe, expect, it } from "vitest";
import type { ExperienceFormDraft } from "@/types/tripper";
import {
  applyExperienceCopy,
  collectExperienceCopy,
  sourceLocaleFor,
} from "../translateExperienceCopy";

function draft(overrides: Partial<ExperienceFormDraft> = {}): ExperienceFormDraft {
  return {
    accommodationType: "any",
    accommodations: [
      {
        hotelDays: "",
        hotelLink: "",
        hotelLocation: "Centro",
        hotelName: "Hotel Belmond",
        hotelStars: "",
        referredLink: "",
      },
    ],
    activities: [
      {
        description: "<p>Caminata al amanecer</p>",
        durationRhythm: null,
        image: "https://example.com/a.jpg",
        name: "Caminata",
        risks: "<p><br></p>",
      },
    ],
    arrivePref: "any",
    climate: "any",
    createBlogPost: false,
    departPref: "any",
    description: "Una escapada corta",
    destinationCity: "Bariloche",
    destinationCountry: "Argentina",
    estimatedCost: "",
    exclusions: [],
    excuseKey: [],
    heroImage: "https://example.com/hero.jpg",
    inclusions: [],
    itinerary: [{ description: "<p></p>", image: null, title: "Día uno" }],
    level: "essenza",
    maxNights: 2,
    maxPax: 2,
    maxTravelTime: "no-limit",
    minNights: 2,
    minPax: 1,
    season: [],
    status: "DRAFT",
    tags: [],
    teaser: "Lago y montaña",
    title: "Amanecer en el lago",
    transport: "any",
    travelTime: "",
    type: ["couple"],
    ...overrides,
  };
}

describe("collectExperienceCopy", () => {
  it("keeps prose and skips empty markup, images, and proper names", () => {
    const pieces = collectExperienceCopy(draft());

    expect(pieces).toEqual([
      { html: false, id: "title", text: "Amanecer en el lago" },
      { html: false, id: "teaser", text: "Lago y montaña" },
      { html: false, id: "description", text: "Una escapada corta" },
      { html: false, id: "activity", index: 0, key: "name", text: "Caminata" },
      {
        html: true,
        id: "activity",
        index: 0,
        key: "description",
        text: "<p>Caminata al amanecer</p>",
      },
      { html: false, id: "itinerary", index: 0, key: "title", text: "Día uno" },
    ]);
    expect(sourceLocaleFor("en")).toBe("es");
    expect(sourceLocaleFor("es")).toBe("en");
  });
});

describe("applyExperienceCopy", () => {
  it("writes translations back without touching images or hotels", () => {
    const current = draft();
    const next = applyExperienceCopy(current, [
      { html: false, id: "title", text: "Sunrise on the lake" },
      {
        html: true,
        id: "activity",
        index: 0,
        key: "description",
        text: "<p>Sunrise walk</p>",
      },
    ]);

    expect(next.title).toBe("Sunrise on the lake");
    expect(next.activities[0]?.description).toBe("<p>Sunrise walk</p>");
    expect(next.activities[0]?.image).toBe("https://example.com/a.jpg");
    expect(next.heroImage).toBe("https://example.com/hero.jpg");
    expect(next.accommodations[0]?.hotelName).toBe("Hotel Belmond");
    expect(next.destinationCity).toBe("Bariloche");
  });
});
