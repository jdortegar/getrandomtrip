import { expect, it } from "vitest";
import { getInitialStepFromParams } from "../JourneyPageClient";

const base = { travelType: "couple", experience: "essenza" };

it("opens the excuse reason when the level has an excuse step and none is chosen", () => {
  expect(getInitialStepFromParams(new URLSearchParams(base))).toEqual({
    tabId: "excuse",
    sectionId: "reason",
  });
});

it("moves past the excuse step once the URL already carries an excuse", () => {
  const params = new URLSearchParams({ ...base, excuse: "escapada-romantica" });
  expect(getInitialStepFromParams(params)).toEqual({
    tabId: "details",
    sectionId: "origin",
  });
});
