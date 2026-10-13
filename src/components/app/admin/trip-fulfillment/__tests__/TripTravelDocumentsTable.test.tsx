import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { countryLabel } from "@/lib/geo/countryOptions";
import type { TravelDocumentsSummary } from "@/types/traveler";
import { TripTravelDocumentsTable } from "../TripTravelDocumentsTable";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const summary: TravelDocumentsSummary = {
  rows: [
    {
      id: "buyer",
      kind: "BOOKING_HOLDER",
      name: "Test Buyer",
      nationalities: ["AR", "IT"],
      visas: ["US", "SCHENGEN"],
      missing: false,
    },
    {
      id: "companion",
      kind: "MINOR",
      name: null,
      nationalities: [],
      visas: [],
      missing: true,
    },
  ],
  missingCount: 1,
  totalCount: 2,
};

function render(
  value: TravelDocumentsSummary,
  dict: typeof en = en,
  locale = "en",
) {
  const copy = dict.adminTripFulfillment.travelers;
  act(() =>
    root.render(
      <TripTravelDocumentsTable
        copy={copy.documents}
        kindLabels={{
          BOOKING_HOLDER: copy.bookingHolder,
          ADULT: copy.adult,
          MINOR: copy.minor,
        }}
        locale={locale}
        notProvided={copy.notProvided}
        summary={value}
      />,
    ),
  );
  return copy;
}

it.each([
  [en, "en"],
  [es, "es"],
] as const)(
  "lists buyer then companion with localized countries (%#)",
  (dict, locale) => {
    const copy = render(summary, dict as typeof en, locale);
    const rows = host.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("Test Buyer");
    expect(rows[0].textContent).toContain(copy.bookingHolder);
    for (const code of ["AR", "IT", "US"])
      expect(rows[0].textContent).toContain(countryLabel(code, locale));
    expect(rows[0].textContent).toContain(copy.documents.schengenVisa);
    expect(rows[0].textContent).not.toContain("SCHENGEN");
    expect(rows[0].textContent).toContain(copy.documents.onFile);
    expect(rows[1].textContent).toContain(copy.minor);
    expect(rows[1].textContent).toContain(copy.notProvided);
    expect(rows[1].textContent).toContain(copy.documents.missing);
    expect(rows[1].textContent).toContain(copy.documents.noVisas);
    expect(host.textContent).toContain(
      copy.documents.missingBadge
        .replace("{{missing}}", "1")
        .replace("{{total}}", "2"),
    );
    expect(host.textContent).not.toContain("{{");
  },
);

it("renders flags for nationality codes", () => {
  render(summary);
  expect(host.querySelector("tbody tr")?.textContent).toContain("🇦🇷");
});

it("shows a positive badge when every traveler has documents", () => {
  const copy = render({
    rows: [summary.rows[0]],
    missingCount: 0,
    totalCount: 1,
  });
  expect(host.textContent).toContain(
    copy.documents.completeBadge.replace("{{total}}", "1"),
  );
  expect(host.textContent).not.toContain(copy.documents.missing);
});
