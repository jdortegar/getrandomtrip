import { beforeEach, expect, it, vi } from "vitest";
import DesignSystemPage, { metadata } from "@/app/[locale]/design-system/page";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const dictionary = vi.hoisted(() => vi.fn());
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: dictionary }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

beforeEach(() => dictionary.mockReset());

it.each([
  ["en", en],
  ["es", es],
] as const)(
  "loads only localized gallery copy for %s",
  async (locale, copy) => {
    dictionary.mockResolvedValue(copy);
    const result = await DesignSystemPage({
      params: Promise.resolve({ locale }),
    });
    expect(dictionary).toHaveBeenCalledExactlyOnceWith(locale);
    expect(result.props).toEqual({ copy: copy.designSystem });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  },
);

it("rejects unsupported locales before loading copy", async () => {
  await expect(
    DesignSystemPage({ params: Promise.resolve({ locale: "unsupported" }) }),
  ).rejects.toThrow("NOT_FOUND");
  expect(dictionary).not.toHaveBeenCalled();
});

it("keeps gallery dictionary keys and row status references aligned in both locales", () => {
  function keys(value: unknown, prefix = ""): string[] {
    if (Array.isArray(value))
      return value.flatMap((item, index) => keys(item, `${prefix}.${index}`));
    if (value && typeof value === "object")
      return Object.entries(value).flatMap(([key, item]) =>
        keys(item, `${prefix}.${key}`),
      );
    return [prefix];
  }
  expect(keys(en.designSystem)).toEqual(keys(es.designSystem));
  for (const copy of [en.designSystem, es.designSystem]) {
    for (const row of copy.tables.rows)
      expect(copy.badges.statuses).toHaveProperty(row.status);
  }
});
