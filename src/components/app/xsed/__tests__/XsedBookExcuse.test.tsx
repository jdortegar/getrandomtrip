import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { XsedBookClient } from "@/components/app/xsed/XsedBookClient";
import { MAX_REFINE_DETAILS } from "@/lib/constants/product-config";
import { familyExcuses } from "@/lib/data/shared/excuses";

const session = vi.hoisted(() => ({
  value: { data: null, status: "unauthenticated" } as {
    data: { user: { email: string } } | null;
    status: string;
  },
}));
const toast = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
}));
const push = vi.hoisted(() => vi.fn());
const catalog = vi.hoisted(() => ({ singleFamilyExcuse: false }));

// Lets a test expose a family catalog with exactly one excuse (the auto-select rule).
vi.mock("@/lib/data/shared/excuses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/shared/excuses")>();
  return {
    ...actual,
    getExcusesByTravelerType: (type: string) =>
      catalog.singleFamilyExcuse && type === "family"
        ? actual.familyExcuses.slice(0, 1)
        : actual.getExcusesByTravelerType(type),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams("originCountry=Argentina&originCity=Buenos+Aires"),
}));
vi.mock("next-auth/react", () => ({ useSession: () => session.value }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/components/app/xsed/XsedInternalHero", () => ({
  XsedInternalHero: () => null,
}));
vi.mock("@/components/journey/JourneyContentNavigation", () => ({
  default: () => null,
}));
const sidebar = vi.hoisted(() => ({
  props: null as null | {
    activeSubstepId?: string;
    activeTab: string;
    completedTabIds?: string[];
    onStepClick: (tabId: string, substepId?: string) => void;
    tabs: Array<{ id: string; substeps: Array<{ id: string; title: string }> }>;
  },
}));
vi.mock("@/components/journey/JourneyProgressSidebar", () => ({
  default: (props: NonNullable<typeof sidebar.props>) => {
    sidebar.props = props;
    return null;
  },
}));
vi.mock("@/components/journey/CountrySelector", () => ({ default: () => null }));
vi.mock("@/components/journey/CitySelector", () => ({ default: () => null }));
vi.mock("@/components/journey/ExcusesCarousel", () => ({
  ExcusesCarousel: ({
    excuses,
    onSelect,
    selectedExcuse,
  }: {
    excuses: Array<{ key: string }>;
    onSelect: (key: string) => void;
    selectedExcuse?: string;
  }) => (
    <div data-testid="excuses" data-selected={selectedExcuse ?? ""}>
      {excuses.map((e) => (
        <button key={e.key} data-excuse={e.key} onClick={() => onSelect(e.key)} />
      ))}
    </div>
  ),
}));
vi.mock("@/components/journey/RefineDetailsCarousel", () => ({
  RefineDetailsCarousel: ({
    options,
    onSelect,
    selectedOptions,
  }: {
    options: Array<{ key: string }>;
    onSelect: (key: string) => void;
    selectedOptions: string[];
  }) => (
    <div data-testid="refine" data-selected={selectedOptions.join(",")}>
      {options.map((o) => (
        <button key={o.key} data-refine={o.key} onClick={() => onSelect(o.key)} />
      ))}
    </div>
  ),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const excuseTab = en.journey.contentTabs.find((t) => t.id === "excuse")!;
const labels = en.journey.mainContent;

describe("XsedBookClient excuse step", () => {
  let container: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn();

  function changeTravelType(value: string) {
    const select = container.querySelector<HTMLSelectElement>(
      "#xsed-travel-type",
    )!;
    act(() => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function goTo(tabId: string, substepId?: string) {
    act(() => sidebar.props?.onStepClick(tabId, substepId));
  }

  const hasCard = (prefix: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>("button")).some(
      (b) => b.textContent?.startsWith(prefix),
    );

  function pickExcuse(key: string) {
    act(() =>
      container
        .querySelector<HTMLButtonElement>(`[data-excuse="${key}"]`)
        ?.click(),
    );
  }

  const isOpen = (prefix: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((b) => b.textContent?.startsWith(prefix))
      ?.getAttribute("aria-expanded") === "true";
  const clickNext = () =>
    act(() =>
      Array.from(container.querySelectorAll("button"))
        .find((b) => b.textContent === en.xsedBook.actionBar.next)
        ?.click(),
    );

  const summaryText = () =>
    container.querySelector('[data-component="XsedSummary"]')?.textContent ?? "";
  const checkoutButton = () =>
    Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === en.xsedBook.actionBar.viewCheckout,
    );

  beforeEach(() => {
    catalog.singleFamilyExcuse = false;
    session.value = { data: null, status: "unauthenticated" };
    toast.error.mockReset();
    push.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tripRequest: { id: "trip-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <XsedBookClient
          book={en.xsedBook}
          excuseLabels={en.journey.mainContent}
          excuseTab={excuseTab}
          detailsStepLabels={en.journey.detailsStep}
          localizedExcuses={en.journey.excuses}
          localizedRefineOptions={en.journey.refineDetailOptions}
          locale="en"
          userBadgeLabels={en.journey.userBadge}
        />,
      );
    });
    goTo("pax");
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("asks for a travel type before showing excuses", () => {
    goTo("excuse");
    expect(container.textContent).toContain(
      labels.selectTravelTypeFirst,
    );
    expect(container.querySelector('[data-testid="excuses"]')).toBeNull();
  });

  it("renders only the cards of the active tab", () => {
    goTo("details");
    expect(hasCard("Origin")).toBe(true);
    expect(hasCard("Travelers")).toBe(false);
    expect(hasCard(labels.excuseLabel)).toBe(false);

    goTo("pax");
    changeTravelType("couple");
    goTo("excuse");
    expect(hasCard(labels.excuseLabel)).toBe(true);
    expect(hasCard(labels.refineDetailsLabel)).toBe(true);
    expect(hasCard("Origin")).toBe(false);
    expect(hasCard("Travelers")).toBe(false);
  });

  it("keeps the tab's cards visible when the open card is collapsed", () => {
    changeTravelType("couple");
    goTo("excuse");
    const trigger = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.startsWith(labels.excuseLabel));
    expect(isOpen(labels.excuseLabel)).toBe(true);
    act(() => trigger?.click());
    expect(isOpen(labels.excuseLabel)).toBe(false);
    expect(hasCard(labels.excuseLabel)).toBe(true);
    expect(hasCard(labels.refineDetailsLabel)).toBe(true);
    expect(hasCard("Travelers")).toBe(false);
    expect(sidebar.props?.activeTab).toBe("excuse");
  });

  it("shows the journey excuse and refine details as two substeps", () => {
    changeTravelType("couple");
    expect(sidebar.props?.tabs.map((t) => t.id)).toEqual(["details", "pax", "excuse"]);
    expect(
      sidebar.props?.tabs.find((t) => t.id === "excuse")?.substeps.map((s) => s.id),
    ).toEqual(["reason", "refine-details"]);
    goTo("excuse");
    expect(isOpen(labels.excuseLabel)).toBe(true);
    expect(container.textContent).toContain(labels.excuseStepDescription);
    expect(container.textContent).toContain(labels.refineDetailsLabel);
    expect(sidebar.props?.activeTab).toBe("excuse");
    expect(sidebar.props?.activeSubstepId).toBe("reason");
  });

  it("moves from reason to refine details with Next once an excuse is chosen", () => {
    changeTravelType("couple");
    clickNext();
    expect(isOpen(labels.excuseLabel)).toBe(true);
    const next = () =>
      Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === en.xsedBook.actionBar.next,
      );
    expect(next()?.disabled).toBe(true);
    pickExcuse(container.querySelector("[data-excuse]")!.getAttribute("data-excuse")!);
    clickNext();
    expect(isOpen(labels.refineDetailsLabel)).toBe(true);
    expect(sidebar.props?.activeSubstepId).toBe("refine-details");
    expect(container.querySelector('[data-testid="refine"]')).not.toBeNull();
  });

  it("navigates to a substep from the sidebar", () => {
    changeTravelType("couple");
    act(() => sidebar.props?.onStepClick("excuse", "refine-details"));
    expect(isOpen(labels.refineDetailsLabel)).toBe(true);
    act(() => sidebar.props?.onStepClick("excuse"));
    expect(isOpen(labels.excuseLabel)).toBe(true);
  });

  it("lands a family trip on the reason substep with every family excuse", () => {
    changeTravelType("family");
    clickNext();
    expect(isOpen(labels.excuseLabel)).toBe(true);
    const keys = Array.from(
      container.querySelectorAll("[data-excuse]"),
      (el) => el.getAttribute("data-excuse"),
    );
    expect(keys).toEqual(familyExcuses.map((e) => e.key));
    expect(keys.length).toBeGreaterThanOrEqual(3);
  });

  it("lands on refine details when the catalog has a single excuse", () => {
    catalog.singleFamilyExcuse = true;
    changeTravelType("family");
    clickNext();
    expect(isOpen(labels.refineDetailsLabel)).toBe(true);
  });

  it("marks the excuse tab complete once an excuse is chosen", () => {
    changeTravelType("couple");
    expect(sidebar.props?.completedTabIds).not.toContain("excuse");
    goTo("excuse");
    pickExcuse(container.querySelector("[data-excuse]")!.getAttribute("data-excuse")!);
    expect(sidebar.props?.completedTabIds).toContain("excuse");
  });

  it("keeps the travelers tab complete after moving on to the excuse", () => {
    expect(sidebar.props?.completedTabIds).not.toContain("pax");
    changeTravelType("couple");
    goTo("excuse");
    expect(sidebar.props?.completedTabIds).toContain("pax");
  });

  it("offers the excuses of the chosen travel type", () => {
    changeTravelType("couple");
    goTo("excuse");
    const keys = Array.from(
      container.querySelectorAll("[data-excuse]"),
      (el) => el.getAttribute("data-excuse"),
    );
    expect(keys.length).toBeGreaterThan(1);
    expect(keys).not.toContain(familyExcuses[0].key);
  });

  it("does not auto-select an excuse when the type has several", () => {
    changeTravelType("family");
    goTo("excuse");
    expect(
      container.querySelector('[data-testid="excuses"]')?.getAttribute("data-selected"),
    ).toBe("");
  });

  it("auto-selects the only excuse when the catalog has a single one", () => {
    catalog.singleFamilyExcuse = true;
    changeTravelType("family");
    goTo("excuse");
    expect(
      container.querySelector('[data-testid="excuses"]')?.getAttribute("data-selected"),
    ).toBe(familyExcuses[0].key);
    expect(summaryText()).toContain(en.journey.excuses.find((e) => e.key === familyExcuses[0].key)!.title);
  });

  it("clears an incompatible excuse when the travel type changes", () => {
    changeTravelType("couple");
    goTo("excuse");
    const first = container
      .querySelector("[data-excuse]")!
      .getAttribute("data-excuse")!;
    pickExcuse(first);
    expect(summaryText()).not.toContain(en.xsedBook.summary.excuseEmpty);

    goTo("pax");
    changeTravelType("group");
    expect(summaryText()).toContain(en.xsedBook.summary.excuseEmpty);
  });

  it("does not offer checkout until an excuse is chosen", () => {
    changeTravelType("couple");
    expect(checkoutButton()).toBeUndefined();
    goTo("excuse");
    pickExcuse(container.querySelector("[data-excuse]")!.getAttribute("data-excuse")!);
    clickNext();
    expect(checkoutButton()).toBeDefined();
  });

  it("caps refine details at MAX_REFINE_DETAILS and still allows deselecting", () => {
    changeTravelType("couple");
    goTo("excuse");
    pickExcuse("escapada-romantica");
    goTo("excuse", "refine-details");
    const keys = Array.from(
      container.querySelectorAll("[data-refine]"),
      (el) => el.getAttribute("data-refine")!,
    );
    expect(keys.length).toBeGreaterThan(MAX_REFINE_DETAILS);
    const selected = () =>
      container
        .querySelector('[data-testid="refine"]')!
        .getAttribute("data-selected")!
        .split(",")
        .filter(Boolean);
    const click = (key: string) =>
      act(() =>
        container.querySelector<HTMLButtonElement>(`[data-refine="${key}"]`)?.click(),
      );

    keys.slice(0, MAX_REFINE_DETAILS).forEach(click);
    expect(selected()).toEqual(keys.slice(0, MAX_REFINE_DETAILS));

    click(keys[MAX_REFINE_DETAILS]);
    expect(selected()).toEqual(keys.slice(0, MAX_REFINE_DETAILS));

    click(keys[0]);
    expect(selected()).toEqual(keys.slice(1, MAX_REFINE_DETAILS));
    click(keys[MAX_REFINE_DETAILS]);
    expect(selected()).toContain(keys[MAX_REFINE_DETAILS]);
  });

  it("posts the excuse and refine details with the booking", async () => {
    session.value = { data: { user: { email: "a@b.com" } }, status: "authenticated" };
    changeTravelType("couple");
    goTo("excuse");
    pickExcuse("escapada-romantica");
    goTo("excuse", "refine-details");
    const refine = container
      .querySelector("[data-refine]")!
      .getAttribute("data-refine")!;
    act(() =>
      container.querySelector<HTMLButtonElement>(`[data-refine="${refine}"]`)?.click(),
    );

    await act(async () => checkoutButton()?.click());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      type: "xsed",
      level: "couple",
      excuseKey: "escapada-romantica",
      refineDetails: [refine],
      status: "SAVED",
    });
    expect(push).toHaveBeenCalledWith("/en/checkout?tripId=trip-1");
  });
});
