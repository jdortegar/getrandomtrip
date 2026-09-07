import { describe, expect, it } from "vitest";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import {
  canPublishXsedDrop,
  isXsedTabComplete,
  normalizeXsedDraft,
  resolveXsedFinalizeCopy,
  resolveXsedPublishFields,
} from "@/lib/helpers/xsed-form";

const completeGeneral = {
  destinationCity: "Mendoza",
  destinationCountry: "Argentina",
  titleInternal: "Patagonia drop",
  tripDate: "2026-09-06",
};

const finalizeDict = {
  publish: {
    confirmBody: "It will go live immediately.",
    confirmTitle: "Publish this drop?",
    submitLabel: "Publish",
  },
  save: {
    confirmBody: "The changes will apply immediately.",
    confirmTitle: "Save these changes?",
    submitLabel: "Save changes",
  },
};

describe("canPublishXsedDrop", () => {
  it("requires title, trip date, city, and country", () => {
    expect(canPublishXsedDrop({ ...completeGeneral, titleInternal: "" })).toBe(false);
    expect(canPublishXsedDrop({ ...completeGeneral, tripDate: "" })).toBe(false);
    expect(canPublishXsedDrop({ ...completeGeneral, destinationCity: "" })).toBe(false);
    expect(canPublishXsedDrop({ ...completeGeneral, destinationCountry: "" })).toBe(false);
    expect(canPublishXsedDrop(completeGeneral)).toBe(true);
  });
});

describe("resolveXsedPublishFields", () => {
  it("prefers incoming values and falls back to existing", () => {
    expect(
      resolveXsedPublishFields(
        { titleInternal: "New title" },
        {
          destinationCity: "Madrid",
          destinationCountry: "Spain",
          titleInternal: "Old title",
          tripDate: new Date("2026-09-06T12:00:00.000Z"),
        },
      ),
    ).toEqual({
      destinationCity: "Madrid",
      destinationCountry: "Spain",
      titleInternal: "New title",
      tripDate: "2026-09-06",
    });
  });

  it("treats an empty incoming city as empty instead of falling back", () => {
    const fields = resolveXsedPublishFields(
      { destinationCity: "" },
      { ...completeGeneral },
    );
    expect(fields.destinationCity).toBe("");
    expect(canPublishXsedDrop(fields)).toBe(false);
  });
});

describe("resolveXsedFinalizeCopy", () => {
  it("uses publish copy for drafts and save copy once live", () => {
    expect(resolveXsedFinalizeCopy(finalizeDict, "DRAFT").isPublish).toBe(true);
    expect(resolveXsedFinalizeCopy(finalizeDict, "DRAFT").submitLabel).toBe("Publish");
    expect(resolveXsedFinalizeCopy(finalizeDict, "ACTIVE").isPublish).toBe(false);
    expect(resolveXsedFinalizeCopy(finalizeDict, "ACTIVE").submitLabel).toBe("Save changes");
  });
});

describe("isXsedTabComplete", () => {
  it("marks General complete from the publish fields only", () => {
    expect(isXsedTabComplete("main", { ...EMPTY_XSED_DRAFT, ...completeGeneral })).toBe(true);
    expect(isXsedTabComplete("main", EMPTY_XSED_DRAFT)).toBe(false);
  });

  it("does not throw when a pre-contact section has no contact object", () => {
    const form = {
      ...EMPTY_XSED_DRAFT,
      hotels: [{ ...EMPTY_XSED_DRAFT.hotels[0], hotelName: "Hotel" }],
      sections: [{ title: "Hotel", body: "Stay", photos: [] } as never],
    };
    expect(() => isXsedTabComplete("logistics", form)).not.toThrow();
    expect(isXsedTabComplete("logistics", form)).toBe(false);
  });
});

describe("normalizeXsedDraft", () => {
  it("pads missing activity and section slots from legacy drops", () => {
    const draft = normalizeXsedDraft({
      titleInternal: "Drop 1",
      hotels: [],
      activities: [{ name: "Dinner", durationRhythm: null, description: "", risks: "", image: null }],
      sections: [{ title: "Old", body: "Text" }],
    });
    expect(draft.hotels).toHaveLength(1);
    expect(draft.activities).toHaveLength(2);
    expect(draft.sections).toHaveLength(3);
    expect(draft.sections[0].contact).toEqual({ name: "", phone: "", address: "", hour: "" });
    expect(draft.sections[0].title).toBe("Old");
  });
});
