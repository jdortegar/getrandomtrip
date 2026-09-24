import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import TripperPlanner from "@/components/tripper/TripperPlanner";
import { JourneyPreferencesStep } from "../JourneyPreferencesStep";
import JourneySummary from "../JourneySummary";

const nav = vi.hoisted(() => ({ query: "", push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.query),
  useParams: () => ({ locale: "en" }),
}));
// Isolate remote geo lookup, not planner state, callbacks or rendered expertise.
vi.mock("@/components/journey/CountrySelector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (name: string, code: string) => void;
  }) => (
    <select
      aria-label="Country"
      onChange={(e) =>
        onChange(e.target.value, e.target.value === "Argentina" ? "AR" : "CL")
      }
      value={value}
    >
      <option value="">Choose country</option>
      <option>Argentina</option>
      <option>Chile</option>
    </select>
  ),
}));
vi.mock("@/components/journey/CitySelector", () => ({
  default: ({
    value,
    onChange,
    countryCode,
  }: {
    value: string;
    onChange: (value: string) => void;
    countryCode: string;
  }) => (
    <input
      aria-label="City"
      disabled={!countryCode}
      onInput={(e) => onChange(e.currentTarget.value)}
      value={value}
    />
  ),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const copy = en.journey.preferencesStep;
const noChange = () => {};
const preferenceProps: ComponentProps<typeof JourneyPreferencesStep> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  climate: undefined,
  departPref: undefined,
  maxTravelTime: undefined,
  transport: undefined,
  labels: copy,
  openSectionId: "",
  originCity: "",
  originCountry: "",
  onAccommodationTypeChange: noChange,
  onAddonsChange: noChange,
  onArrivePrefChange: noChange,
  onClimateChange: noChange,
  onDepartPrefChange: noChange,
  onMaxTravelTimeChange: noChange,
  onOpenSection: noChange,
};
const tripper = {
  id: "tripper-1",
  name: "Ana Perez",
  slug: "ana & friends",
  commission: 10,
  availableTypes: ["solo"],
};
const http = vi.fn();
let container: HTMLDivElement;
let root: Root;
function render(node: ReactNode) {
  act(() => root.render(node));
}
function preferences(props: Partial<typeof preferenceProps> = {}) {
  render(<JourneyPreferencesStep {...preferenceProps} {...props} />);
  return container.querySelector("button[aria-expanded]")!.textContent;
}
function summary(filterOptions = copy.filterOptions) {
  render(
    <JourneySummary
      filterOptions={filterOptions}
      summary={en.journey.summary}
      totalsLabels={en.journey.checkout}
    />,
  );
  const heading = [...container.querySelectorAll("p")].find(
    (el) => el.textContent === en.journey.summary.transportSection,
  )!;
  return heading.parentElement!;
}
function expertise(data: ComponentProps<typeof TripperPlanner>["tripperData"]) {
  render(<TripperPlanner tripperData={data} />);
  return [...container.querySelectorAll("li")].map((el) => el.textContent);
}
beforeEach(() => {
  nav.query = "";
  nav.push.mockReset();
  nav.replace.mockReset();
  http.mockReset().mockImplementation(() => {
    throw new Error("Unexpected request");
  });
  vi.stubGlobal("fetch", http);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  expect(http).not.toHaveBeenCalled();
});

describe("Journey display memo approvals", () => {
  it("keeps empty/default preferences independent of transport", () => {
    const expected = copy.filtersLabel + copy.filtersSummaryDefault;
    expect(preferences()).toBe(expected);
    expect(
      preferences({
        transport: "plane",
        departPref: "any",
        maxTravelTime: "no-limit",
      }),
    ).toBe(expected);
  });

  it("preserves ordered preference labels and excludes transport", () => {
    const values = {
      departPref: "morning",
      arrivePref: "night",
      maxTravelTime: "3h",
      climate: "cold",
      accommodationType: "hotel-style",
    };
    const expected =
      "FiltersDeparture: Morning, Arrival: Night, Time: Up to 3h, Climate: Cold, Accommodation: Hotel Style";
    expect(preferences(values)).toBe(expected);
    expect(preferences({ ...values, transport: "ship" })).toBe(expected);
  });

  it("keeps the known English transport label ahead of dictionary text", () => {
    nav.query = "transportOrder=plane,bus,ship,train";
    expect(summary().textContent).toContain("Plane");
    expect(summary().textContent).not.toContain("Flight");
  });

  it.each(["", "plane,bus,ship", "plane,bus,ship,train,custom"])(
    "requires exactly four transport entries: %s",
    (order) => {
      nav.query = `transportOrder=${order}`;
      const section = summary();
      expect(section.querySelector("button")?.textContent).toBe(
        en.journey.summary.add,
      );
      expect(section.textContent).not.toContain("Plane");
    },
  );

  it("uses the custom dictionary fallback when all four entries exist", () => {
    nav.query = "transportOrder=custom,plane,bus,ship";
    const options = {
      ...copy.filterOptions,
      transport: {
        label: "Transport",
        options: [{ key: "custom", label: "Private shuttle" }],
      },
    };
    expect(summary(options).textContent).toContain("Private shuttle");
  });

  it("prefers interests, then derives known and unknown type labels on refresh", () => {
    expect(expertise({ ...tripper, interests: ["Bird watching"] })).toEqual([
      "Bird watching",
    ]);
    expect(
      expertise({
        ...tripper,
        interests: [],
        availableTypes: ["solo", "custom"],
      }),
    ).toEqual(["Solo", "custom"]);
    expect(expertise({ ...tripper, availableTypes: ["family"] })).toEqual([
      "En Familia",
    ]);
  });

  it.each([[], undefined])(
    "keeps the empty or absent type fallback: %s",
    (availableTypes) => {
      expect(
        expertise({ ...tripper, availableTypes: availableTypes as string[] }),
      ).toEqual(["—"]);
    },
  );

  it("retains origin clearing and the encoded unprefixed journey destination", () => {
    expertise(tripper);
    const country = container.querySelector<HTMLSelectElement>("select")!;
    const city = container.querySelector<HTMLInputElement>("input")!;
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.disabled).toBe(true);
    act(() => {
      country.value = "Argentina";
      country.dispatchEvent(new Event("change", { bubbles: true }));
    });
    act(() => {
      city.value = "   ";
      city.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(button.disabled).toBe(true);
    act(() => {
      city.value = "Buenos Aires";
      city.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(button.disabled).toBe(false);
    act(() => {
      country.value = "Chile";
      country.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(city.value).toBe("");
    expect(button.disabled).toBe(true);
    act(() => {
      city.value = "Viña del Mar";
      city.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => button.click());
    expect(nav.push).toHaveBeenCalledExactlyOnceWith(
      "/journey?tripper=ana+%26+friends&originCity=Vi%C3%B1a+del+Mar&originCountry=Chile",
    );
  });
  it("refreshes custom transport text on a dictionary-only rerender", () => {
    nav.query = "transportOrder=custom,plane,bus,ship";
    const options = (label: string) => ({
      ...copy.filterOptions,
      transport: { label: "Transport", options: [{ key: "custom", label }] },
    });
    expect(summary(options("Private shuttle")).textContent).toContain(
      "Private shuttle",
    );
    const updated = summary(options("Traslado privado"));
    expect(updated.textContent).toContain("Traslado privado");
    expect(updated.textContent).not.toContain("Private shuttle");
    const fallback = summary();
    expect(fallback.textContent).toContain("custom");
    expect(fallback.textContent).not.toContain("Traslado privado");
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("refreshes preference copy while retaining raw unknown values", () => {
    expect(preferences({ climate: "custom" })).toBe("FiltersClimate: custom");
    expect(
      preferences({
        climate: "custom",
        labels: { ...copy, filtersSummaryClimate: "Weather" },
      }),
    ).toBe("FiltersWeather: custom");
  });
});
