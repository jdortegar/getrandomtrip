import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import {
  BlogFilterHeader,
  type BlogFilterLabels,
  type BlogFilterState,
} from "@/components/blog/BlogFilterHeader";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";

const emptyValue: BlogFilterState = {
  excuseKey: null,
  levelKey: "",
  travelTypeKey: "",
  tripperId: null,
};
const tripper = {
  avatarUrl: null,
  id: "tripper-1",
  name: "A tripper with a very long display name that must stay in its card",
  slug: "tripper-1",
};
let harness: DomHarness;
const onChange = vi.fn();

beforeEach(() => {
  harness = createDomHarness();
  onChange.mockClear();
});
afterEach(() => harness.unmount());

function render(
  value = emptyValue,
  labels: BlogFilterLabels = en.blogPage.filters,
  locale = "en",
) {
  harness.render(
    <BlogFilterHeader
      labels={labels}
      locale={locale}
      onChange={onChange}
      trippers={[tripper]}
      value={value}
    />,
  );
}

function selectNamed(name: string): HTMLSelectElement {
  const select = harness.container.querySelector<HTMLSelectElement>(
    `select[aria-label="${name}"]`,
  );
  expect(select).not.toBeNull();
  return select!;
}

describe("BlogFilterHeader", () => {
  it("uses equal responsive columns and constrains long labels and select overlays", () => {
    render({ ...emptyValue, tripperId: tripper.id });
    const header = harness.container.querySelector(
      '[data-component="BlogFilterHeader"]',
    )!;
    expect(header.classList.contains("grid")).toBe(true);
    expect(header.classList.contains("grid-cols-1")).toBe(true);
    expect(header.classList.contains("md:grid-cols-2")).toBe(true);
    expect(header.classList.contains("xl:grid-cols-4")).toBe(true);
    expect(header.children).toHaveLength(4);
    for (const card of header.children) {
      expect(card.classList.contains("min-w-0")).toBe(true);
      expect(card.classList.contains("md:ml-auto")).toBe(false);
      const select = card.querySelector("select")!;
      for (const className of ["h-full", "min-w-0", "w-full"]) {
        expect(select.classList.contains(className)).toBe(true);
      }
    }
    const title = header.children[3].querySelector("p")!;
    expect(title.textContent).toBe(tripper.name);
    expect(title.classList.contains("truncate")).toBe(true);
  });

  it.each([
    ["en", en.blogPage.filters],
    ["es", es.blogPage.filters],
  ] as const)(
    "keeps localized accessible names and All before XSED in %s",
    (locale, labels) => {
      render(emptyValue, labels, locale);
      for (const label of [
        labels.travelTypeLabel,
        labels.levelLabel,
        labels.excuseLabel,
        labels.tripperLabel,
      ]) {
        expect(selectNamed(label).value).toBe("");
      }
      expect(
        [...selectNamed(labels.levelLabel).options]
          .slice(0, 2)
          .map((option) => [option.value, option.text]),
      ).toEqual([
        ["", labels.allOption],
        ["xsed", "XSED"],
      ]);
    },
  );

  it.each([
    ["travelTypeKey", "travelTypeLabel", "solo", ""],
    ["levelKey", "levelLabel", "xsed", ""],
    ["excuseKey", "excuseLabel", "solo-get-lost", null],
    ["tripperId", "tripperLabel", tripper.id, null],
  ] as const)(
    "changes and clears %s without resetting the other filters",
    (key, labelKey, selected, cleared) => {
      const value = {
        excuseKey: "solo-aventura-desafio",
        levelKey: "essenza",
        travelTypeKey: "couple",
        tripperId: tripper.id,
      };
      render(value);
      const select = selectNamed(en.blogPage.filters[labelKey]);
      act(() => {
        select.value = selected;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(onChange).toHaveBeenLastCalledWith({ ...value, [key]: selected });
      render({ ...value, [key]: selected });
      expect(select.value).toBe(selected);
      act(() => {
        select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(onChange).toHaveBeenLastCalledWith({ ...value, [key]: cleared });
    },
  );
});
