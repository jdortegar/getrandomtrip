import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Chip from "@/components/Chip";
import RemovableTag from "@/components/RemovableTag";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { ChipListInput } from "@/components/ui/ChipListInput";
import TripperInspirationGallery from "@/components/tripper/TripperInspirationGallery";
import type { FeaturedTripCard } from "@/types/tripper";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("badge and tag casing", () => {
  it("uppercases inspiration type, tier, and hashtag badges without changing prose or tags", () => {
    const trip: FeaturedTripCard = {
      displayPrice: "$100",
      heroImage: "/images/trip.jpg",
      highlights: [],
      id: "trip-1",
      level: "essenza",
      likes: 1,
      nights: 2,
      pax: 2,
      tags: ["family"],
      teaser: "A family escape",
      title: "Family trip",
      type: "couple",
    };
    act(() =>
      root.render(
        <TripperInspirationGallery tripperName="Alex" trips={[trip]} />,
      ),
    );

    const tag = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "#family",
    )!;
    expect(tag.classList.contains("uppercase")).toBe(true);
    expect(trip.tags).toEqual(["family"]);
    const tier = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "Essenza",
    )!;
    expect(tier.classList.contains("uppercase")).toBe(true);
    expect(tier.previousElementSibling?.classList.contains("uppercase")).toBe(
      true,
    );
    const title = Array.from(container.querySelectorAll("h3")).find(
      (element) => element.textContent === trip.title,
    )!;
    expect(title.closest(".uppercase")).toBeNull();
  });

  it.each(["default", "outline", "primary"] as const)(
    "uppercases %s toggle chips visually without changing selection behavior",
    (variant) => {
      const onClick = vi.fn();
      act(() =>
        root.render(
          <Chip active onClick={onClick} variant={variant}>
            Family trip
          </Chip>,
        ),
      );

      const chip = container.querySelector("button")!;
      expect(chip.classList.contains("uppercase")).toBe(true);
      expect(chip.textContent).toBe("Family trip");
      expect(chip.getAttribute("aria-pressed")).toBe("true");
      act(() => chip.click());
      expect(onClick).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps disabled chips as non-interactive buttons and owns touch sizing", () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <Chip disabled onClick={onClick} size="touch">
          Family
        </Chip>,
      ),
    );
    const chip = container.querySelector("button")!;
    expect(chip.classList.contains("min-h-11")).toBe(true);
    expect(chip.disabled).toBe(true);
    act(() => chip.click());
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "uppercases tags while preserving original content and removal semantics (locked: %s)",
    (locked) => {
      const onRemove = vi.fn();
      const item = {
        key: "destination",
        label: "Destino",
        locked,
        onRemove,
        value: ["Río Negro", "San Martín"],
      };
      act(() => root.render(<RemovableTag item={item} />));

      const tag = container.querySelector('[data-component="RemovableTag"]')!;
      expect(tag.classList.contains("uppercase")).toBe(true);
      expect(tag.textContent).toBe("Destino: Río Negro,San Martín");
      expect(item.value).toEqual(["Río Negro", "San Martín"]);
      const remove = tag.querySelector("button");
      if (locked) {
        expect(remove).toBeNull();
      } else {
        expect(remove?.getAttribute("aria-label")).toBe("Quitar Destino");
        act(() => remove?.click());
        expect(onRemove).toHaveBeenCalledTimes(1);
      }
    },
  );

  it("keeps read-only tags uppercase without implying removal", () => {
    act(() =>
      root.render(<RemovableTag item={{ key: "meal", value: "Breakfast" }} />),
    );
    expect(
      container.querySelector("span")?.classList.contains("uppercase"),
    ).toBe(true);
    expect(container.querySelector("button")).toBeNull();
  });

  it.each(["inclusion", "exclusion"] as const)(
    "keeps %s list tag styles local and original values unchanged",
    (kind) => {
      const onAdd = vi.fn();
      const onRemove = vi.fn();
      const values = ["Family walk"];
      act(() =>
        root.render(
          <ChipListInput
            kind={kind}
            id="activities"
            label="Activities"
            onAdd={onAdd}
            onRemove={onRemove}
            placeholder="Add an activity"
            values={values}
          />,
        ),
      );

      const tag = container.querySelector("span")!;
      expect(
        tag.parentElement?.classList.contains(
          kind === "inclusion" ? "bg-green-50" : "bg-red-50",
        ),
      ).toBe(true);
      expect(tag.classList.contains("uppercase")).toBe(true);
      expect(tag.textContent).toBe("Family walk");
      const input = container.querySelector("input")!;
      expect(input.closest(".uppercase")).toBeNull();
      act(() => {
        input.value = "Río Negro";
        input.dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
        );
      });
      expect(onAdd).toHaveBeenCalledWith("Río Negro");
      expect(values).toEqual(["Family walk"]);
      act(() => container.querySelector("button")!.click());
      expect(onRemove).toHaveBeenCalledWith(0);
    },
  );

  it("retains uppercase status presentation and localized source copy", () => {
    act(() =>
      root.render(
        <StatusIndicatorBadge
          label="Confirmado"
          family="trip"
          status="CONFIRMED"
        />,
      ),
    );
    const status = container.querySelector(
      '[data-component="StatusIndicatorBadge"]',
    )!;
    expect(status.classList.contains("uppercase")).toBe(true);
    expect(status.textContent).toBe("Confirmado");
  });
});
