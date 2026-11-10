import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, expect, it, vi } from "vitest";
import DesignSystemPage, {
  generateMetadata as brandMetadata,
} from "@/app/[locale]/design-system/page";
import DesignSystemComponentsPage, {
  generateMetadata as componentsMetadata,
} from "@/app/[locale]/design-system/components/page";
import { DesignSystemGallery } from "@/components/app/design-system/DesignSystemGallery";
import { GalleryLlmsDocument } from "@/components/app/design-system/GalleryLlmsDocument";
import { DESIGN_SYSTEM_LLMS } from "@/lib/constants/DESIGN_SYSTEM_LLMS";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
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

function galleryFrom(result: ReactElement<{ children?: ReactNode }>) {
  const kids = Children.toArray(result.props.children);
  const gallery = kids.find(
    (kid) => isValidElement(kid) && kid.type === DesignSystemGallery,
  ) as ReactElement<ComponentProps<typeof DesignSystemGallery>>;
  const llms = kids.find(
    (kid) => isValidElement(kid) && kid.type === GalleryLlmsDocument,
  ) as ReactElement<ComponentProps<typeof GalleryLlmsDocument>>;
  return { gallery, llms };
}

it.each([
  ["en", en],
  ["es", es],
] as const)("loads the brand gallery for %s", async (locale, copy) => {
  dictionary.mockResolvedValue(copy);
  const result = await DesignSystemPage({
    params: Promise.resolve({ locale }),
  });
  const { gallery, llms } = galleryFrom(result);
  const typedLocale = locale as Locale;
  expect(dictionary).toHaveBeenCalledExactlyOnceWith(locale);
  expect(gallery.props).toEqual({
    agentDocsHref: pathForLocale(typedLocale, "/design-system/llms"),
    brandHref: pathForLocale(typedLocale, "/design-system"),
    componentsHref: pathForLocale(typedLocale, "/design-system/components"),
    copy: copy.designSystem,
    view: "brand",
  });
  expect(llms.props.href).toBe(
    pathForLocale(typedLocale, "/design-system/llms"),
  );
  expect(llms.props.markdown).toBe(DESIGN_SYSTEM_LLMS);
  const meta = await brandMetadata({
    params: Promise.resolve({ locale }),
  });
  expect(meta.robots).toEqual({ index: false, follow: false });
  expect(meta.alternates?.types?.["text/markdown"]).toBe(
    pathForLocale(typedLocale, "/design-system/llms"),
  );
});

it.each([
  ["en", en],
  ["es", es],
] as const)("loads the component gallery for %s", async (locale, copy) => {
  dictionary.mockResolvedValue(copy);
  const result = await DesignSystemComponentsPage({
    params: Promise.resolve({ locale }),
  });
  const { gallery } = galleryFrom(result);
  const typedLocale = locale as Locale;
  expect(gallery.props).toEqual({
    agentDocsHref: pathForLocale(typedLocale, "/design-system/llms"),
    brandHref: pathForLocale(typedLocale, "/design-system"),
    componentsHref: pathForLocale(typedLocale, "/design-system/components"),
    copy: copy.designSystem,
    view: "components",
  });
  const meta = await componentsMetadata({
    params: Promise.resolve({ locale }),
  });
  expect(meta.robots).toEqual({ index: false, follow: false });
  expect(meta.alternates?.types?.["text/markdown"]).toBe(
    pathForLocale(typedLocale, "/design-system/llms"),
  );
});

it("rejects unsupported locales before loading copy", async () => {
  await expect(
    DesignSystemPage({ params: Promise.resolve({ locale: "unsupported" }) }),
  ).rejects.toThrow("NOT_FOUND");
  await expect(
    DesignSystemComponentsPage({
      params: Promise.resolve({ locale: "unsupported" }),
    }),
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
