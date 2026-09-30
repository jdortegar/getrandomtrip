import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useJourneyDraftDetails } from "@/hooks/useJourneyDraftDetails";
import { useJourneyDraftPreferences } from "@/hooks/useJourneyDraftPreferences";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
const detailsUrl = {
  originCountry: "AR",
  originCity: "Buenos Aires",
  startDate: "2027-04-01",
  nights: 2,
  transportOrder: ["plane", "train", "bus", "car"],
};
const preferencesUrl = {
  departPref: "morning",
  arrivePref: "any",
  climate: "warm",
  maxTravelTime: "no-limit",
  accommodationType: "any",
};
const updateQuery = vi.fn();
const detailsResult = vi.fn();
const preferencesResult = vi.fn();

function Drafts({
  tab,
  city = "Buenos Aires",
  climate = "warm",
}: {
  tab: string;
  city?: string;
  climate?: string;
}) {
  const details = useJourneyDraftDetails(
    tab,
    {
      ...detailsUrl,
      originCity: city,
      transportOrder: [...detailsUrl.transportOrder],
    },
    updateQuery,
  );
  const preferences = useJourneyDraftPreferences(tab, {
    ...preferencesUrl,
    climate,
  });
  useEffect(() => {
    detailsResult(details);
    preferencesResult(preferences);
  });
  return (
    <output>{`${details.effectiveOriginCity}:${preferences.effectiveClimate}`}</output>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const details = () =>
  detailsResult.mock.lastCall![0] as ReturnType<typeof useJourneyDraftDetails>;
const preferences = () =>
  preferencesResult.mock.lastCall![0] as ReturnType<
    typeof useJourneyDraftPreferences
  >;

it("preserves unsaved details on equal-value rerenders and flushes once when leaving", () => {
  act(() => root.render(<Drafts tab="details" />));
  expect(details().effectiveOriginCity).toBe("Buenos Aires");
  act(() => details().setDraftOriginCity("Mendoza"));
  act(() => root.render(<Drafts tab="details" />));
  expect(details().effectiveOriginCity).toBe("Mendoza");
  expect(updateQuery).not.toHaveBeenCalled();
  act(() => root.render(<Drafts tab="preferences" />));
  expect(updateQuery).toHaveBeenCalledTimes(1);
  expect(updateQuery).toHaveBeenCalledWith(
    expect.objectContaining({ originCity: "Mendoza", nights: "2" }),
  );
  act(() => root.render(<Drafts tab="preferences" />));
  expect(updateQuery).toHaveBeenCalledTimes(1);
});

it("accepts real URL changes and reseeds details on reentry", () => {
  act(() => root.render(<Drafts tab="details" />));
  act(() => details().setDraftOriginCity("Mendoza"));
  act(() => root.render(<Drafts city="Rosario" tab="details" />));
  expect(details().effectiveOriginCity).toBe("Rosario");
  act(() => root.render(<Drafts city="Rosario" tab="preferences" />));
  act(() => root.render(<Drafts city="Salta" tab="details" />));
  expect(details().effectiveOriginCity).toBe("Salta");
});

it("keeps a preference edit until its URL input actually changes", () => {
  act(() => root.render(<Drafts tab="preferences" />));
  act(() => preferences().setDraftClimate("cold"));
  act(() => root.render(<Drafts tab="preferences" />));
  expect(preferences().effectiveClimate).toBe("cold");
  act(() => root.render(<Drafts climate="temperate" tab="preferences" />));
  expect(preferences().effectiveClimate).toBe("temperate");
});
