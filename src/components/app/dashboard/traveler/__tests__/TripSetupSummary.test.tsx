import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TripSetupSummary } from "@/components/app/dashboard/traveler/TripSetupSummary";
import es from "@/dictionaries/es.json";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

function render(props: Partial<Parameters<typeof TripSetupSummary>[0]> = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripSetupSummary
        avoidDestinations={[]}
        copy={es.tripDetail}
        excuse={null}
        filters={[]}
        items={[{ label: "Tipo", value: "Pareja" }]}
        {...props}
      />,
    ),
  );
}

it("joins trip info, excuse, filters and avoided destinations in one card", () => {
  render({
    avoidDestinations: ["Roma"],
    excuse: {
      title: "Aniversario",
      refineDetails: [{ key: "beach", label: "Playa" }],
    },
    filters: [{ label: "Clima", value: "Cálido" }],
  });

  const text = container.textContent ?? "";
  expect(text).toContain(es.tripDetail.setupTitle);
  expect(text).toContain("Pareja");
  expect(text).toContain("Aniversario");
  expect(text).toContain("Playa");
  expect(text).toContain(es.tripDetail.filtersTitle);
  expect(text).toContain("Cálido");
  expect(text).toContain("Roma");

  // Every value renders as a label/value row in the grid — no chips or tags.
  const values = Array.from(container.querySelectorAll("dd")).map(
    (dd) => dd.textContent,
  );
  expect(values).toEqual(["Pareja", "Aniversario", "Playa", "Cálido", "Roma"]);
});

it("omits empty groups", () => {
  render();

  const text = container.textContent ?? "";
  expect(text).not.toContain(es.tripDetail.filtersTitle);
  expect(text).not.toContain(es.tripDetail.avoidDestinationsLabel);
  expect(text).not.toContain(es.tripDetail.excuseLabel);
});
