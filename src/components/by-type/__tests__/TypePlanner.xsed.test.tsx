import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { XSED_PRICE_PER_PERSON } from "@/lib/data/traveler-types";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";
import ExperiencesPageClient from "@/app/[locale]/experiences/ExperiencesPageClient";
import TravelerTypePage from "@/app/[locale]/experiences/by-type/[type]/page";
import BudgetStep from "@/components/journey/BudgetStep";
import { XsedLevelCard } from "@/components/app/xsed/XsedLevelCard";
import TypePlanner from "../TypePlanner";

const navigation = vi.hoisted(() => ({ locale: "en", push: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({
    scroll,
    ...props
  }: React.ComponentProps<"a"> & { scroll?: boolean }) => (
    <a {...props} data-scroll={String(scroll)} />
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: navigation.locale }),
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("Not found");
  },
}));
vi.mock("@/lib/db/tripper-queries", () => ({
  getReviewsForTripType: async () => [],
}));
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: async () => null,
  resolveLiveAttribution: async () => null,
}));
vi.mock("@/components/Hero", () => ({ default: () => null }));
vi.mock("@/components/Paragraph", () => ({ default: () => null }));
vi.mock("@/components/Blog", () => ({ default: () => null }));
vi.mock("@/components/InspirationBanner", () => ({ default: () => null }));
vi.mock("@/components/Testimonials/Testimonials", () => ({
  default: () => null,
}));
vi.mock("@/components/layout/Section", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
  ),
}));
vi.mock("@/components/EmblaCarousel/EmblaCarousel", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/landing/exploration/TravelerTypesCarousel", () => ({
  TravelerTypesCarousel: ({
    localizedTravelerTypes,
    onSelect,
  }: {
    localizedTravelerTypes: Array<{ key: string }>;
    onSelect: (key: string) => void;
  }) => (
    <div>
      {localizedTravelerTypes.map(({ key }) => (
        <button
          data-traveler-type={key}
          key={key}
          onClick={() => onSelect(key)}
          type="button"
        />
      ))}
    </div>
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  navigation.locale = "en";
  navigation.push.mockClear();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const cards = () =>
  Array.from(
    container.querySelectorAll<HTMLElement>('[data-component="LevelCard"]'),
  );
const names = () =>
  cards().map((card) => card.querySelector("h3")?.textContent);

function expectWhiteAndOffWhitePalette() {
  for (const card of cards()) {
    expect(card.classList.contains("bg-primary")).toBe(false);
    expect(card.classList.contains("bg-secondary")).toBe(false);
    expect(
      card.classList.contains("bg-white") ||
        card.classList.contains("bg-ground"),
    ).toBe(true);
    expect(card.querySelector("h3")?.classList.contains("text-ink")).toBe(true);
    expect(card.querySelector(".text-ground")).toBeNull();
    expect(card.querySelector("a")?.classList.contains("text-ink")).toBe(true);
    expect(card.querySelector("a")?.classList.contains("text-white")).toBe(
      false,
    );
  }
}

it.each(["en", "es"])(
  "prepends the localized standalone card on both marketing entrypoints (%s)",
  async (locale) => {
    navigation.locale = locale;
    const dict = locale === "en" ? en : es;
    const title = locale === "en" ? "TGIS" : "XSED";
    const href = locale === "en" ? "/en/xsed" : "/xsed";
    const regularLevels = getPlannerContentForType("couple", locale).levels;

    for (const page of [
      <ExperiencesPageClient
        key="landing"
        locale={locale}
        tripperContext={null}
      />,
      await TravelerTypePage({
        params: Promise.resolve({ locale, type: "couple" }),
        searchParams: Promise.resolve({}),
      }),
    ]) {
      act(() => root.render(page));
      expect(names()).toEqual([
        title,
        ...regularLevels.map((level) => level.name),
      ]);
      const [xsed, ...regular] = cards();
      expect(xsed.textContent).toContain(`${XSED_PRICE_PER_PERSON} USD`);
      expect(xsed.textContent).toContain(dict.xsedLevelCard.subtitle);
      expect(xsed.textContent).toContain(dict.xsedLevelCard.closingLine);
      for (const feature of dict.xsedLevelCard.features) {
        expect(xsed.textContent).toContain(feature.title);
        expect(xsed.textContent).toContain(feature.description);
      }
      expect(xsed.textContent).toContain(
        locale === "en" ? "per person" : "por persona",
      );
      expect(xsed.textContent).toContain(
        locale === "en"
          ? "1 night — Saturday to Sunday"
          : "1 noche — de sábado a domingo",
      );
      expect(xsed.textContent).toContain(
        locale === "en"
          ? "Your own car; transportation not included"
          : "Tu propio auto; transporte no incluido",
      );
      expect(xsed.textContent).toContain(
        locale === "en"
          ? "Saturday dinner, Sunday breakfast, and a curated local experience"
          : "Cena del sábado, desayuno del domingo y una experiencia local curada",
      );
      expect(xsed.textContent).not.toContain(
        dict.journey.tripperBadge.byTripper,
      );
      expect(xsed.querySelector("a")?.getAttribute("href")).toBe(href);
      expect(xsed.querySelector("a")?.dataset.scroll).toBe("true");
      expect(xsed.querySelector("a")?.classList.contains("text-ink")).toBe(
        true,
      );
      expect(xsed.querySelector("a")?.classList.contains("text-white")).toBe(
        false,
      );
      expect(xsed.querySelector("a")?.textContent).toBe(
        locale === "en" ? "DISCOVER TGIS" : "DESCUBRE XSED",
      );
      expect(
        cards().map((card) => card.classList.contains("bg-white")),
      ).toEqual([true, false, true, false, true, false]);
      expect(
        cards().map((card) => card.classList.contains("bg-ground")),
      ).toEqual([false, true, false, true, false, true]);
      expectWhiteAndOffWhitePalette();
      expect(
        cards()
          .filter((card) =>
            card.textContent?.includes(dict.journey.tripperBadge.mostChosen),
          )
          .map((card) => card.querySelector("h3")?.textContent),
      ).toEqual(["Explora+"]);
      expect(regular[0].querySelector("a")?.getAttribute("href")).toBe(
        "/journey?travelType=couple&experience=essenza",
      );
      expect(
        regular[0].querySelector("a")?.classList.contains("text-ink"),
      ).toBe(true);
      act(() => xsed.click());
      expect(navigation.push).toHaveBeenLastCalledWith(href);
      navigation.push.mockClear();
    }
  },
);

it("keeps default planner levels, tripper badges, selection and ordinary card navigation unchanged", () => {
  const content = getPlannerContentForType("couple", "en");
  const onSelect = vi.fn();
  act(() =>
    root.render(
      <TypePlanner
        allowedLevelIds={["explora"]}
        compact
        content={content}
        onSelect={onSelect}
        tripperBadge={{ name: "Test Tripper", avatarUrl: null }}
        type="couple"
      />,
    ),
  );
  expect(names()).toEqual(content.levels.map((level) => level.name));
  expect(cards().map((card) => card.classList.contains("bg-ground"))).toEqual([
    false,
    true,
    false,
    true,
    false,
  ]);
  expectWhiteAndOffWhitePalette();
  expect(cards()[0].querySelector("a")?.dataset.scroll).toBe("true");
  expect(cards()[0].textContent).toContain(
    en.journey.tripperBadge.byRandomtrip,
  );
  expect(cards()[1].textContent).toContain(
    `${en.journey.tripperBadge.byTripper} Test Tripper`,
  );
  act(() => cards()[0].click());
  expect(onSelect).toHaveBeenCalledWith("essenza");
  expect(navigation.push).not.toHaveBeenCalled();
  act(() =>
    root.render(
      <TypePlanner
        compact
        content={content}
        navigateOnCardClick
        type="couple"
      />,
    ),
  );
  act(() => cards()[0].click());
  expect(navigation.push).toHaveBeenCalledWith(
    "/journey?travelType=couple&experience=essenza",
  );
  expect(cards()[0].querySelector("a")?.dataset.scroll).toBe("false");

  onSelect.mockClear();
  act(() =>
    root.render(
      <TypePlanner
        allowedLevelIds={["xsed", "explora"]}
        compact
        content={content}
        leadingCard={
          <XsedLevelCard
            copy={en.xsedLevelCard}
            locale="en"
            travelType="couple"
          />
        }
        onSelect={onSelect}
        tripperBadge={{ name: "Test Tripper", avatarUrl: null }}
        type="couple"
      />,
    ),
  );
  expect(cards()[0].textContent).not.toContain("Test Tripper");
  act(() => cards()[0].click());
  expect(navigation.push).toHaveBeenLastCalledWith("/en/xsed");
  expect(onSelect).not.toHaveBeenCalled();
});

it("does not add XSED to the real journey BudgetStep", () => {
  act(() =>
    root.render(
      <BudgetStep
        accordionValue="experience"
        experienceContent=""
        handleExperienceSelect={vi.fn()}
        handleTravelTypeSelect={vi.fn()}
        labels={{
          browseGeneralExperiences: "Browse",
          experienceLabel: "Level",
          experienceStepDescription: "Select",
          noLevelsAvailable: "None",
          noTripperExperiences: "None",
          selectTravelTypeFirst: "Select",
          travelTypeLabel: "Type",
        }}
        locale="en"
        onAccordionValueChange={vi.fn()}
        selectedTravelType="couple"
        travelerType="couple"
        travelTypeContent=""
      />,
    ),
  );
  expect(names()).toEqual(
    getPlannerContentForType("couple", "en").levels.map((level) => level.name),
  );
  expect(container.querySelector('a[href*="xsed"]')).toBeNull();
  expect(cards().map((card) => card.classList.contains("bg-ground"))).toEqual([
    false,
    true,
    false,
    true,
    false,
  ]);
  expectWhiteAndOffWhitePalette();
});

it("reprices the XSED card at the solo rate when solo is selected on /experiences", () => {
  act(() =>
    root.render(<ExperiencesPageClient locale="en" tripperContext={null} />),
  );
  expect(cards()[0].textContent).toContain("250 USD");

  act(() =>
    container
      .querySelector<HTMLButtonElement>('[data-traveler-type="solo"]')
      ?.click(),
  );
  expect(cards()[0].textContent).toContain("350 USD");

  act(() =>
    container
      .querySelector<HTMLButtonElement>('[data-traveler-type="family"]')
      ?.click(),
  );
  expect(cards()[0].textContent).toContain("250 USD");
});

it("prices the XSED card at the solo rate on the solo traveler-type page", async () => {
  const page = await TravelerTypePage({
    params: Promise.resolve({ locale: "en", type: "solo" }),
    searchParams: Promise.resolve({}),
  });
  act(() => root.render(page));
  expect(cards()[0].textContent).toContain("350 USD");
});

it.each([
  ["en", "Most popular"],
  ["es", "Más elegido"],
])("labels the XSED and featured cards with localized badges (%s)", (locale, featured) => {
  navigation.locale = locale;
  const dict = locale === "en" ? en : es;
  act(() =>
    root.render(<ExperiencesPageClient locale={locale} tripperContext={null} />),
  );
  const badges = () =>
    Array.from(container.querySelectorAll('[data-component="Label"]')).map(
      (badge) => badge.textContent,
    );
  expect(cards()[0].textContent).toContain(dict.xsedLevelCard.badge);
  expect(badges()).toContain(dict.xsedLevelCard.badge);
  expect(badges()).toContain(featured);
  const badge = container.querySelector('[data-component="Label"]');
  expect(badge?.classList.contains("-translate-y-1/2")).toBe(true);
});
