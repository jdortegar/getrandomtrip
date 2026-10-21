import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { getExperienceCard } from "@/lib/data/experience-cards";
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
  getPublishedBlogsForTravelType: async () => [],
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
    container.querySelectorAll<HTMLElement>(
      '[data-component="ExperienceCard"]',
    ),
  );
const names = () =>
  cards().map((card) => card.querySelector("h3")?.textContent);

function expectWhiteCardPalette() {
  for (const card of cards()) {
    expect(card.classList.contains("bg-white")).toBe(true);
    expect(card.classList.contains("bg-primary")).toBe(false);
    expect(card.classList.contains("bg-secondary")).toBe(false);
    expect(card.classList.contains("bg-ground")).toBe(false);
    expect(card.querySelector("h3")?.classList.contains("text-primary")).toBe(
      true,
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
    const xsedCard = getExperienceCard("couple", "xsed", locale)!;

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
        `${title}™`,
        ...regularLevels.map((level) => level.card!.name),
      ]);
      const [xsed, ...regular] = cards();
      expect(xsed.textContent).toContain(`USD ${XSED_PRICE_PER_PERSON}`);
      expect(xsed.textContent).toContain(xsedCard.tag);
      expect(xsed.textContent).toContain(xsedCard.kicker);
      expect(xsed.textContent).toContain(xsedCard.eyebrow);
      expect(xsed.textContent).toContain(xsedCard.description);
      for (const detail of xsedCard.details) {
        expect(xsed.textContent).toContain(detail.label);
      }
      expect(xsed.textContent).toContain(
        locale === "en" ? "per person" : "por persona",
      );
      expect(xsed.textContent).toContain(
        locale === "en"
          ? "1 night · Saturday to Sunday"
          : "1 noche · sábado a domingo",
      );
      expect(xsed.textContent).toContain(
        locale === "en"
          ? "Saturday dinner + a local experience"
          : "Cena de sábado + una experiencia local",
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
      expect(xsed.querySelector("a")?.textContent).toBe(xsedCard.ctaLabel);
      expect(xsed.querySelector("a")?.classList.contains("bg-feature")).toBe(
        true,
      );
      expectWhiteCardPalette();
      expect(
        cards()
          .filter((card) =>
            card.textContent?.includes(dict.journey.tripperBadge.mostChosen),
          )
          .map((card) => card.querySelector("h3")?.textContent),
      ).toEqual(["EXPLORA+™"]);
      expect(regular[0].querySelector("a")?.getAttribute("href")).toBe(
        `${locale === "en" ? "/en" : ""}/journey?travelType=couple&experience=essenza`,
      );
      expect(
        regular[0].querySelector("a")?.classList.contains("bg-primary"),
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
  expect(names()).toEqual(content.levels.map((level) => level.card!.name));
  expectWhiteCardPalette();
  expect(cards()[0].querySelector("a")).toBeNull();
  const selectCta = cards()[0].querySelector("button");
  act(() => selectCta?.click());
  expect(onSelect).toHaveBeenCalledWith("essenza");
  expect(navigation.push).not.toHaveBeenCalled();
  onSelect.mockClear();
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
    "/en/journey?travelType=couple&experience=essenza",
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
    getPlannerContentForType("couple", "en").levels.map(
      (level) => level.card!.name,
    ),
  );
  expect(container.querySelector('a[href*="xsed"]')).toBeNull();
  expectWhiteCardPalette();
});

it("reprices the XSED card at the solo rate when solo is selected on /experiences", () => {
  act(() =>
    root.render(<ExperiencesPageClient locale="en" tripperContext={null} />),
  );
  expect(cards()[0].textContent).toContain("USD 250");

  act(() =>
    container
      .querySelector<HTMLButtonElement>('[data-traveler-type="solo"]')
      ?.click(),
  );
  expect(cards()[0].textContent).toContain("USD 350");

  act(() =>
    container
      .querySelector<HTMLButtonElement>('[data-traveler-type="family"]')
      ?.click(),
  );
  expect(cards()[0].textContent).toContain("USD 250");
});

it("prices the XSED card at the solo rate on the solo traveler-type page", async () => {
  const page = await TravelerTypePage({
    params: Promise.resolve({ locale: "en", type: "solo" }),
    searchParams: Promise.resolve({}),
  });
  act(() => root.render(page));
  expect(cards()[0].textContent).toContain("USD 350");
});

it.each([
  ["en", "Most popular"],
  ["es", "Más elegido"],
])(
  "tags the XSED card and ribbons the featured card with localized labels (%s)",
  (locale, featured) => {
    navigation.locale = locale;
    const dict = locale === "en" ? en : es;
    act(() =>
      root.render(
        <ExperiencesPageClient locale={locale} tripperContext={null} />,
      ),
    );
    const badges = () =>
      Array.from(container.querySelectorAll('[data-component="Label"]')).map(
        (badge) => badge.textContent,
      );
    expect(cards()[0].textContent).toContain(
      getExperienceCard("couple", "xsed", locale)!.tag,
    );
    expect(badges()).toEqual([featured]);
    expect(dict.journey.tripperBadge.mostChosen).toBe(featured);
    const badge = container.querySelector('[data-component="Label"]');
    expect(badge?.classList.contains("translate-y-1/2")).toBe(true);
  },
);
