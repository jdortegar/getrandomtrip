import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import { useStore } from "@/store/store";
import AddonDetail from "../AddonDetail";
import AnimatedDeckCard from "../AnimatedDeckCard";

vi.mock("@/store/store", async () => {
  const { create } = await import("zustand");
  const { createJourneySlice } = await import("@/store/slices/journeyStore");
  return { useStore: create(createJourneySlice) };
});
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const perPax = ADDONS.find((addon) => addon.id === "travel-ins-basic")!;
const perTrip = ADDONS.find((addon) => addon.id === "cancel-ins")!;
let container: HTMLDivElement;
let root: Root;
const selected = () => useStore.getState().addons.selected;
function quantity() {
  return [...container.querySelectorAll("span")].find((el) =>
    /^\d+$/.test(el.textContent ?? ""),
  )!;
}
function step(direction: "up" | "down") {
  // Legacy Deck controls have no accessible names; their displayed quantity separates them.
  const button =
    direction === "up"
      ? quantity().nextElementSibling
      : quantity().previousElementSibling;
  act(() => (button as HTMLButtonElement).click());
}
function click(text: string) {
  const button = [...container.querySelectorAll("button")].find(
    (el) => el.textContent === text,
  )!;
  act(() => button.click());
}
function deck(addon = perPax, active = true) {
  act(() => root.render(<AnimatedDeckCard active={active} addon={addon} />));
}
function detail(activeId: string | null = perPax.id, onClose = vi.fn()) {
  act(() => root.render(<AddonDetail activeId={activeId} onClose={onClose} />));
}
beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Deck immediate quantity ownership", () => {
  it("persists per-passenger increments/decrements and removes at zero", () => {
    deck();
    expect(container.textContent).toContain(perPax.title);
    expect(quantity().textContent).toBe("0");
    step("up");
    step("up");
    expect(quantity().textContent).toBe("2");
    expect(selected()).toEqual([{ id: perPax.id, qty: 2 }]);
    step("down");
    expect(selected()).toEqual([{ id: perPax.id, qty: 1 }]);
    step("down");
    step("down");
    expect(quantity().textContent).toBe("0");
    expect(selected()).toEqual([]);
  });

  it("toggles per-trip selection without a passenger quantity control", () => {
    deck(perTrip);
    expect(container.textContent).toContain(perTrip.title);
    expect(quantity()).toBeUndefined();
    click("Agregar");
    expect(selected()).toEqual([{ id: perTrip.id, qty: 1 }]);
    click("Quitar");
    expect(selected()).toEqual([]);
  });

  it("reflects external selected quantity and source changes", () => {
    deck();
    act(() => useStore.getState().setAddon({ id: perPax.id, qty: 4 }));
    expect(quantity().textContent).toBe("4");
    const next = ADDONS.find((addon) => addon.id === "seat-select")!;
    deck(next);
    expect(quantity().textContent).toBe("0");
    step("up");
    expect(selected()).toEqual([
      { id: perPax.id, qty: 4 },
      { id: next.id, qty: 1 },
    ]);
    act(() => useStore.getState().resetAddons());
    expect(quantity().textContent).toBe("0");
    expect(selected()).toEqual([]);
  });

  it("does not expose controls for an unavailable level or closed card", () => {
    useStore.setState({ level: "unavailable" });
    deck();
    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(quantity()).toBeUndefined();
    act(() => useStore.setState({ level: "essenza" }));
    deck(perPax, false);
    expect(container.querySelector("button")?.disabled).toBe(false);
    expect(
      container.querySelector("button")?.getAttribute("aria-expanded"),
    ).toBe("false");
  });
});

describe("Detail explicit-save quantity ownership", () => {
  it("keeps edits local with a minimum of one until Add is chosen", () => {
    detail();
    step("down");
    expect(quantity().textContent).toBe("1");
    step("up");
    expect(quantity().textContent).toBe("2");
    expect(selected()).toEqual([]);
    click("Agregar");
    expect(selected()).toEqual([{ id: perPax.id, qty: 2 }]);
    step("up");
    expect(selected()).toEqual([{ id: perPax.id, qty: 2 }]);
    click("Actualizar");
    expect(selected()).toEqual([{ id: perPax.id, qty: 3 }]);
  });

  it("retains the local draft on same-ID external changes and reseeds A→B→A", () => {
    useStore.getState().setAddon({ id: perPax.id, qty: 2 });
    detail();
    step("up");
    act(() => useStore.getState().setAddon({ id: perPax.id, qty: 7 }));
    expect(quantity().textContent).toBe("3");
    detail(perTrip.id);
    expect(quantity().textContent).toBe("1");
    step("up");
    detail(perPax.id);
    expect(quantity().textContent).toBe("7");
    detail(null);
    expect(container.textContent).toContain("Elegí un add-on");
    detail(perPax.id);
    expect(quantity().textContent).toBe("7");
  });

  it("removes the selection before notifying close", () => {
    useStore.getState().setAddon({ id: perPax.id, qty: 2 });
    const onClose = vi.fn(() => expect(selected()).toEqual([]));
    detail(perPax.id, onClose);
    click("Quitar");
    expect(onClose).toHaveBeenCalledOnce();
    expect(selected()).toEqual([]);
  });

  it("shows unavailability instead of edit/save controls", () => {
    useStore.setState({ level: "unavailable" });
    detail();
    expect(container.textContent).toContain(
      "no está disponible para tu nivel actual (unavailable)",
    );
    expect(quantity()).toBeUndefined();
    expect(
      [...container.querySelectorAll("button")].map((el) =>
        el.getAttribute("aria-label"),
      ),
    ).toEqual(["Cerrar"]);
  });
});

it("retains an unsaved Detail quantity after external removal until explicitly saved", () => {
  useStore.getState().setAddon({ id: perPax.id, qty: 2 });
  detail();
  step("up");
  act(() => useStore.getState().resetAddons());
  expect(quantity().textContent).toBe("3");
  expect(selected()).toEqual([]);
  click("Agregar");
  expect(selected()).toEqual([{ id: perPax.id, qty: 3 }]);
});
