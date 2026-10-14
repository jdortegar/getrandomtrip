import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BuyerTravelDocuments } from "@/types/documents";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import { CheckoutTravelDocumentsCard } from "../CheckoutTravelDocumentsCard";

const enDict = en as unknown as Dictionary;
const esDict = es as unknown as Dictionary;

let harness: DomHarness;
const onChange = vi.fn();

function renderCard(
  value: BuyerTravelDocuments,
  options: { dict?: Dictionary; locale?: string; readOnly?: boolean; showErrors?: boolean } = {},
) {
  const dict = options.dict ?? enDict;
  harness.render(
    <CheckoutTravelDocumentsCard
      checkoutCopy={dict.journey.checkout}
      locale={options.locale ?? "en"}
      onChange={onChange}
      profileCopy={dict.profile}
      readOnly={options.readOnly}
      showErrors={options.showErrors ?? false}
      value={value}
    />,
  );
}

beforeEach(() => {
  harness = createDomHarness();
  onChange.mockReset();
});

afterEach(() => harness.unmount());

describe("CheckoutTravelDocumentsCard", () => {
  it("renders localized title, picker labels and helper copy", () => {
    renderCard({ nationalities: ["AR"], visas: [] });
    const text = harness.container.textContent ?? "";
    expect(text).toContain(en.journey.checkout.travelDocumentsTitle);
    expect(text).toContain(en.journey.checkout.travelDocumentsDescription);
    expect(text).toContain(en.profile.sections.nationalities);
    expect(text).toContain(en.profile.labels.nationalitiesHelper);
    expect(text).toContain(en.profile.labels.approvedVisas);
    expect(text).toContain(en.profile.labels.approvedVisasHelper);
  });

  it("renders Spanish copy for the es locale", () => {
    renderCard({ nationalities: [], visas: [] }, { dict: esDict, locale: "es" });
    const text = harness.container.textContent ?? "";
    expect(text).toContain(es.journey.checkout.travelDocumentsTitle);
    expect(text).toContain(es.profile.labels.nationalitiesHelper);
  });

  it("shows the required-nationality error only when errors are requested and none is selected", () => {
    renderCard({ nationalities: [], visas: [] });
    expect(harness.container.querySelector('[role="alert"]')).toBeNull();

    renderCard({ nationalities: [], visas: [] }, { showErrors: true });
    const alert = harness.container.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe(en.journey.checkout.errors.nationalitiesRequired);

    renderCard({ nationalities: ["AR"], visas: [] }, { showErrors: true });
    expect(harness.container.querySelector('[role="alert"]')).toBeNull();
  });

  it("labels the Schengen visa zone from the dictionary", () => {
    renderCard({ nationalities: ["AR"], visas: ["SCHENGEN", "US"] }, { readOnly: true });
    expect(harness.container.textContent).toContain(en.profile.labels.schengenVisa);
  });

  it("reports nationality and visa removals while keeping the other list", () => {
    renderCard({ nationalities: ["AR", "IT"], visas: ["SCHENGEN", "US"] });
    const removeItaly = harness.container.querySelector('[aria-label="Remove Italy"]');
    expect(removeItaly).not.toBeNull();
    harness.click(removeItaly!);
    expect(onChange).toHaveBeenLastCalledWith({
      nationalities: ["AR"],
      visas: ["SCHENGEN", "US"],
    });

    const removeSchengen = harness.container.querySelector(
      `[aria-label="Remove ${en.profile.labels.schengenVisa}"]`,
    );
    expect(removeSchengen).not.toBeNull();
    harness.click(removeSchengen!);
    expect(onChange).toHaveBeenLastCalledWith({
      nationalities: ["AR", "IT"],
      visas: ["US"],
    });
  });

  it("renders read-only chips without remove buttons", () => {
    renderCard({ nationalities: ["AR"], visas: [] }, { readOnly: true });
    expect(harness.container.querySelector('[aria-label="Remove Argentina"]')).toBeNull();
    expect(harness.container.textContent).toContain("Argentina");
  });
});
