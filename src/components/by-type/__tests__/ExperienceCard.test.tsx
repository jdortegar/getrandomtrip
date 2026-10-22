import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";
import { ExperienceCard } from "../shared/ExperienceCard";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({
    scroll,
    ...props
  }: React.ComponentProps<"a"> & { scroll?: boolean }) => (
    <a {...props} data-scroll={String(scroll)} />
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: navigation.push }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const levels = getPlannerContentForType("solo", "en").levels;
const explora = levels.find((level) => level.id === "modo-explora")!;
const essenza = levels.find((level) => level.id === "essenza")!;
const atelier = levels.find((level) => level.id === "atelier-getaway")!;
const card = () =>
  container.querySelector<HTMLElement>('[data-component="ExperienceCard"]')!;

beforeEach(() => {
  navigation.push.mockClear();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

it("renders the photo header, card copy, detail rows and price", () => {
  act(() =>
    root.render(<ExperienceCard level={explora} travelerType="solo" />),
  );
  const content = explora.card!;
  const photo = card().querySelector("img")!;
  expect(photo.getAttribute("alt")).toBe(content.photoAlt);
  expect(photo.getAttribute("src")).toContain("experience-cards");
  expect(card().textContent).toContain(content.tag);
  expect(card().textContent).toContain(content.kicker);
  expect(card().querySelector("h3")?.textContent).toBe(content.name);
  expect(card().querySelector("h3")?.getAttribute("data-name-lines")).toBe("2");
  expect(card().querySelector("h3 sup")?.textContent).toBe("™");
  expect(card().textContent).toContain(content.eyebrow);
  expect(card().textContent).toContain(content.description);
  expect(card().textContent).toContain(`USD ${explora.price}`);
  expect(card().textContent).toContain(explora.priceFootnote);
  expect(card().textContent).toContain(content.revealNote);
  for (const detail of content.details) {
    expect(card().textContent).toContain(detail.label);
    if (detail.kind !== "transport")
      expect(card().textContent).toContain(detail.value);
  }
  const transport = card().querySelector("[data-transport-icons]")!;
  expect(transport.getAttribute("aria-label")).toBe(
    content.details.find((d) => d.kind === "transport")!.value,
  );
  expect(transport.querySelectorAll("svg")).toHaveLength(
    content.transport!.modes.length,
  );
  expect(card().textContent).toContain(content.transportNote);
  expect(card().classList.contains("bg-white")).toBe(true);
});

it("keeps a single-word card name on one line", () => {
  act(() => root.render(<ExperienceCard level={essenza} />));
  expect(card().querySelector("h3")?.textContent).toBe(essenza.card!.name);
  expect(card().querySelector("h3")?.getAttribute("data-name-lines")).toBe("1");
});

it("shows the most-chosen ribbon only when featured, or a custom badge", () => {
  act(() => root.render(<ExperienceCard level={explora} />));
  expect(card().querySelector("[data-ribbon]")).toBeNull();
  act(() => root.render(<ExperienceCard featured level={explora} />));
  expect(card().querySelector("[data-ribbon]")?.textContent).toBe(
    en.journey.tripperBadge.mostChosen,
  );
  act(() =>
    root.render(
      <ExperienceCard badgeLabel="Custom" featured level={explora} />,
    ),
  );
  expect(card().querySelector("[data-ribbon]")?.textContent).toBe("Custom");
});

it("links the CTA to the journey with the card's CTA label and style", () => {
  act(() =>
    root.render(<ExperienceCard level={explora} travelerType="solo" />),
  );
  const link = card().querySelector("a")!;
  expect(link.getAttribute("href")).toBe(
    "/en/journey?travelType=solo&experience=modo-explora",
  );
  expect(link.textContent).toBe(explora.card!.ctaLabel);
  expect(link.classList.contains("bg-primary")).toBe(true);

  act(() =>
    root.render(<ExperienceCard level={atelier} travelerType="solo" />),
  );
  const outline = card().querySelector("a")!;
  expect(outline.classList.contains("bg-white")).toBe(true);
  expect(outline.classList.contains("text-primary")).toBe(true);
  expect(card().textContent).toContain(atelier.priceLabel);
});

it("selects the level from the CTA and the card when ctaSelects is set", () => {
  const onSelect = vi.fn();
  act(() =>
    root.render(
      <ExperienceCard
        ctaSelects
        level={explora}
        onSelect={onSelect}
        travelerType="solo"
      />,
    ),
  );
  expect(card().querySelector("a")).toBeNull();
  act(() => card().querySelector("button")?.click());
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("modo-explora");
  act(() => card().click());
  expect(onSelect).toHaveBeenCalledTimes(2);
  expect(navigation.push).not.toHaveBeenCalled();
});

it("navigates on card click and marks the selected state", () => {
  const onSelect = vi.fn();
  act(() =>
    root.render(
      <ExperienceCard
        level={explora}
        navigateOnCardClick
        onSelect={onSelect}
        selected
        travelerType="solo"
      />,
    ),
  );
  expect(card().dataset.selected).toBe("true");
  expect(card().querySelector(".border-primary")).not.toBeNull();
  expect(
    card().querySelector(`[aria-label="${en.experienceCard.selected}"]`),
  ).not.toBeNull();
  act(() => card().click());
  expect(navigation.push).toHaveBeenCalledWith(
    "/en/journey?travelType=solo&experience=modo-explora",
  );
  expect(onSelect).not.toHaveBeenCalled();
  expect(card().querySelector("a")?.dataset.scroll).toBe("false");
});

it("shows the tripper attribution line", () => {
  act(() =>
    root.render(
      <ExperienceCard
        level={explora}
        tripperBadge={{ avatarUrl: null, name: "Ana" }}
      />,
    ),
  );
  expect(card().textContent).toContain(
    `${en.journey.tripperBadge.byTripper} Ana`,
  );
  act(() =>
    root.render(<ExperienceCard level={explora} showRandomtripBadge />),
  );
  expect(card().textContent).toContain(en.journey.tripperBadge.byRandomtrip);
});

it("falls back to the level fields when card content is missing", () => {
  const level = { ...explora, card: undefined };
  act(() => root.render(<ExperienceCard level={level} />));
  expect(card().querySelector("img")).toBeNull();
  expect(card().querySelector("h3")?.textContent).toBe(level.name);
  expect(card().textContent).toContain(level.subtitle);
  expect(card().textContent).toContain(level.closingLine);
  for (const feature of level.features)
    expect(card().textContent).toContain(feature.description);
  expect(card().querySelector("a")?.textContent).toBe(level.ctaLabel);
});
