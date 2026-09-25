import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { XsedBookClient } from "@/components/app/xsed/XsedBookClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams("originCountry=Argentina&originCity=Buenos+Aires"),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("@/components/app/xsed/XsedInternalHero", () => ({
  XsedInternalHero: () => null,
}));

vi.mock("@/components/journey/JourneyContentNavigation", () => ({
  default: () => null,
}));

vi.mock("@/components/journey/JourneyProgressSidebar", () => ({
  default: () => null,
}));

vi.mock("@/components/journey/CountrySelector", () => ({
  default: () => null,
}));

vi.mock("@/components/journey/CitySelector", () => ({
  default: () => null,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("XsedBookClient travelers", () => {
  let container: HTMLDivElement;
  let root: Root;
  let paxInput: HTMLInputElement;
  let travelTypeSelect: HTMLSelectElement;

  function changePax(value: string) {
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(paxInput, value);
      paxInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function changeTravelType(value: string) {
    act(() => {
      travelTypeSelect.value = value;
      travelTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <XsedBookClient
          book={en.xsedBook}
          detailsStepLabels={en.journey.detailsStep}
          locale="en"
          userBadgeLabels={en.journey.userBadge}
        />,
      );
    });

    const travelersSection = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.startsWith("Travelers"));
    act(() => travelersSection?.click());

    paxInput = container.querySelector<HTMLInputElement>("#xsed-pax")!;
    travelTypeSelect =
      container.querySelector<HTMLSelectElement>("#xsed-travel-type")!;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each(["", "couple", "family", "group"])(
    "selects Solo and updates the summary when %s becomes one traveler",
    (travelType) => {
      if (travelType) changeTravelType(travelType);

      changePax("1");

      expect(paxInput.value).toBe("1");
      expect(travelTypeSelect.value).toBe("solo");
      expect(container.textContent).toContain("Solo · 1 traveler");
      const summary = container.querySelector('[data-component="XsedSummary"]');
      expect(summary?.textContent).toContain("Solo · 1 persona");
      expect(summary?.textContent).toContain("USD 350");
    },
  );

  it.each(["couple", "family", "group"])(
    "preserves %s when changing to more than one traveler",
    (travelType) => {
      changeTravelType(travelType);

      changePax("3");

      expect(paxInput.value).toBe("3");
      expect(travelTypeSelect.value).toBe(travelType);
      expect(paxInput.disabled).toBe(false);
    },
  );

  it("still resets the count to one when Solo is selected explicitly", () => {
    changePax("3");

    changeTravelType("solo");

    expect(paxInput.value).toBe("1");
    expect(paxInput.disabled).toBe(false);
  });

  it.each(["count", "dropdown"])(
    "disables non-Solo options when %s sets one traveler",
    (selection) => {
      if (selection === "count") changePax("1");
      else changeTravelType("solo");

      for (const value of ["couple", "family", "group"]) {
        const option = travelTypeSelect.querySelector<HTMLOptionElement>(
          `option[value="${value}"]`,
        );
        expect(option?.disabled).toBe(true);
      }
      expect(
        travelTypeSelect.querySelector<HTMLOptionElement>(
          'option[value="solo"]',
        )?.disabled,
      ).toBe(false);
      expect(paxInput.disabled).toBe(false);
    },
  );

  it.each(["couple", "family", "group"])(
    "rejects a programmatic %s selection for one traveler",
    (travelType) => {
      changePax("1");

      changeTravelType(travelType);

      expect(travelTypeSelect.value).toBe("solo");
      expect(container.textContent).toContain("Solo · 1 traveler");
    },
  );

  it("re-enables other travel types when the count increases above one", () => {
    changePax("1");

    changePax("2");

    for (const value of ["couple", "family", "group"]) {
      const option = travelTypeSelect.querySelector<HTMLOptionElement>(
        `option[value="${value}"]`,
      );
      expect(option?.disabled).toBe(false);
      changeTravelType(value);
      expect(travelTypeSelect.value).toBe(value);
    }
  });

  it("allows multi-digit input beginning with one and clears Solo above one", () => {
    changeTravelType("group");

    changePax("1");

    expect(travelTypeSelect.value).toBe("solo");
    expect(paxInput.disabled).toBe(false);

    changePax("12");

    expect(paxInput.value).toBe("12");
    expect(travelTypeSelect.value).toBe("");
    expect(container.textContent).toContain("12 travelers");
  });

  it("keeps clearing the count consistent with visible one traveler without locking multi-digit input", () => {
    changeTravelType("group");

    changePax("");

    expect(paxInput.value).toBe("1");
    expect(travelTypeSelect.value).toBe("solo");
    expect(paxInput.disabled).toBe(false);

    changePax("12");

    expect(paxInput.value).toBe("12");
    expect(travelTypeSelect.value).toBe("");
  });
});
