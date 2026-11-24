import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TriggerRevealAnimation } from "@/components/app/dashboard/traveler/TriggerRevealAnimation";
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

it("renders the brand line and calls onReplay from its button, links to trip details", () => {
  const onReplay = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TriggerRevealAnimation
        copy={es.tripItinerary.revealReplay}
        detailsHref="/dashboard/trips/trip-1"
        onReplay={onReplay}
      />,
    ),
  );

  expect(container.textContent).toContain(
    "El misterio cambia de forma. El viaje empieza.",
  );
  const button = container.querySelector("button")!;
  expect(button.textContent).toContain("Volver a vivir el reveal");

  const link = container.querySelector("a")!;
  expect(link.textContent).toContain("Ver detalles del viaje");
  expect(link.getAttribute("href")).toBe("/dashboard/trips/trip-1");

  act(() => button.click());
  expect(onReplay).toHaveBeenCalledTimes(1);
});
