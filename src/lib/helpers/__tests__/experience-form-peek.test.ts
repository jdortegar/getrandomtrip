import { describe, it, expect, vi } from "vitest";
import { resolveFieldPeek, resolveEntryPeek } from "../experience-form-peek";
import type { AccommodationEntry, ExperienceFormDraft } from "@/types/tripper";

const baseDraft: ExperienceFormDraft = {
  status: "PENDING_TRIPPER_REVIEW",
  title: "Original title",
  type: ["couple"],
  level: "essenza",
  teaser: "",
  description: "",
  heroImage: "",
  tags: [],
  destinationCountry: "",
  destinationCity: "",
  excuseKey: [],
  climate: "any",
  minPax: 1,
  maxPax: 4,
  minNights: 1,
  maxNights: 7,
  pricingByType: null,
  reviewNote: null,
  estimatedCost: "",
  season: [],
  transport: "any",
  travelTime: "",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  accommodationType: "any",
  accommodations: [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" }],
  activities: [{ name: "", durationRhythm: null, description: "", risks: "", image: null }],
  itinerary: [{ title: "", description: "", image: null }],
  inclusions: [],
  exclusions: [],
  createBlogPost: false,
};

const copy = {
  peekShowOriginal: "Click to see original content",
  peekShowSuggestion: "Click to see admin's suggestion",
  noContent: "(no content)",
};

describe("resolveFieldPeek", () => {
  it("returns undefined when the field is not in changedFieldSet", () => {
    const result = resolveFieldPeek({
      field: "title",
      changedFieldSet: new Set(["teaser"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when originalDraft is undefined", () => {
    const result = resolveFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: undefined,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns a FieldPeek when the field is changed and originalDraft is present", () => {
    const onToggle = vi.fn();
    const result = resolveFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle,
      copy,
    });
    expect(result).toEqual({
      originalValue: "Original title",
      active: false,
      onToggle,
      tooltip: {
        showOriginal: copy.peekShowOriginal,
        showSuggestion: copy.peekShowSuggestion,
      },
      emptyLabel: copy.noContent,
    });
  });

  it("marks active true when the field is in peekedFields", () => {
    const result = resolveFieldPeek({
      field: "title",
      changedFieldSet: new Set(["title"]),
      originalDraft: baseDraft,
      peekedFields: new Set(["title"]),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.active).toBe(true);
  });

  it("yields an empty originalValue (placeholder-driving) when the original field was empty", () => {
    const result = resolveFieldPeek({
      field: "teaser",
      changedFieldSet: new Set(["teaser"]),
      originalDraft: baseDraft,
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.originalValue).toBe("");
  });
});

const originalEntry: AccommodationEntry = {
  hotelName: "Llao Llao Hotel & Resort",
  hotelStars: "5",
  hotelLocation: "Bariloche",
  hotelDays: "5",
  hotelLink: "",
  referredLink: "",
};

describe("resolveEntryPeek", () => {
  it("returns undefined when the array diffKey is not in changedFieldSet", () => {
    const result = resolveEntryPeek({
      diffKey: "hotels",
      changedFieldSet: new Set(["title"]),
      originalEntry,
      entryKey: "hotelName",
      currentValue: "Llao Llao Hotel & Resort EDITED",
      peekKey: "accommodations.0.hotelName",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when the entry has no original counterpart (admin added it)", () => {
    const result = resolveEntryPeek<AccommodationEntry>({
      diffKey: "hotels",
      changedFieldSet: new Set(["hotels"]),
      originalEntry: undefined,
      entryKey: "hotelName",
      currentValue: "New hotel",
      peekKey: "accommodations.1.hotelName",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when this specific sub-field did not change", () => {
    const result = resolveEntryPeek({
      diffKey: "hotels",
      changedFieldSet: new Set(["hotels"]),
      originalEntry,
      entryKey: "hotelLink",
      currentValue: "",
      peekKey: "accommodations.0.hotelLink",
      peekedFields: new Set(),
      onToggle: vi.fn(),
      copy,
    });
    expect(result).toBeUndefined();
  });

  it("returns a FieldPeek when the array changed and this sub-field differs", () => {
    const onToggle = vi.fn();
    const result = resolveEntryPeek({
      diffKey: "hotels",
      changedFieldSet: new Set(["hotels"]),
      originalEntry,
      entryKey: "hotelName",
      currentValue: "Llao Llao Hotel & Resort EDITED",
      peekKey: "accommodations.0.hotelName",
      peekedFields: new Set(),
      onToggle,
      copy,
    });
    expect(result).toEqual({
      originalValue: "Llao Llao Hotel & Resort",
      active: false,
      onToggle,
      tooltip: {
        showOriginal: copy.peekShowOriginal,
        showSuggestion: copy.peekShowSuggestion,
      },
      emptyLabel: copy.noContent,
    });
  });

  it("marks active true when the composite peekKey is in peekedFields", () => {
    const result = resolveEntryPeek({
      diffKey: "hotels",
      changedFieldSet: new Set(["hotels"]),
      originalEntry,
      entryKey: "hotelName",
      currentValue: "Llao Llao Hotel & Resort EDITED",
      peekKey: "accommodations.0.hotelName",
      peekedFields: new Set(["accommodations.0.hotelName"]),
      onToggle: vi.fn(),
      copy,
    });
    expect(result?.active).toBe(true);
  });
});
