import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getTripperExperiencesByTypeAndLevel } from "@/lib/db/tripper-queries";
import { getExcuseImage, getExcuseTitle } from "@/lib/helpers/excuse-helper";
import Page from "../page";

vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperBySlug: vi.fn(async () => ({
    status: "ok",
    tripper: { id: "tripper-1", name: "Alex", tripperSlug: "alex" },
  })),
  getTripperExperiencesByTypeAndLevel: vi.fn(async () => ({})),
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

const EXPERIENCE = {
  activities: [],
  destinationCity: "Synthetic City",
  destinationCountry: "Argentina",
  heroImage: "/images/fallback.jpg",
  id: "synthetic-experience",
  pricingByType: null,
  tags: [],
  teaser: "Synthetic teaser",
  title: "Synthetic experience",
  type: ["solo"],
};

it.each(["en", "es"])(
  "keeps the %s locale in directory and profile links",
  async (locale) => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ locale, tripper: "alex" }),
      }),
    );

    const prefix = locale === "en" ? "/en" : "";
    expect(
      Array.from(template.content.querySelectorAll("a")).map((link) =>
        link.getAttribute("href"),
      ),
    ).toEqual([
      `${prefix}/trippers`,
      `${prefix}/trippers/alex`,
      `${prefix}/trippers`,
    ]);
  },
);

it.each(["en", "es"])(
  "preserves %s in the invalid-tripper fallback",
  async (locale) => {
    vi.mocked(redirect).mockClear();
    await expect(
      Page({ params: Promise.resolve({ locale, tripper: "undefined" }) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledExactlyOnceWith(
      `${locale === "en" ? "/en" : ""}/experiences/by-type/group`,
    );
  },
);

describe.each(["en", "es"])("populated %s catalog", (locale) => {
  it.each([
    { excuseKeys: [], firstKey: undefined, label: "empty excuses" },
    {
      excuseKeys: ["solo-get-lost"],
      firstKey: "solo-get-lost",
      label: "one excuse",
    },
    {
      excuseKeys: ["solo-get-lost", "solo-busqueda-interior"],
      firstKey: "solo-get-lost",
      label: "multiple excuses",
    },
    {
      excuseKeys: ["", "  ", "solo-get-lost"],
      firstKey: "solo-get-lost",
      label: "blank excuses before a usable key",
    },
  ])(
    "renders $label with the existing title/image fallback",
    async ({ excuseKeys, firstKey }) => {
      vi.mocked(getTripperExperiencesByTypeAndLevel).mockResolvedValueOnce({
        solo: {
          essenza: [
            {
              ...EXPERIENCE,
              excuseKey: excuseKeys,
              level: "essenza",
            },
          ],
        },
      });

      const template = document.createElement("template");
      template.innerHTML = renderToStaticMarkup(
        await Page({
          params: Promise.resolve({ locale, tripper: "alex" }),
        }),
      );

      expect(template.content.querySelector("h3")?.textContent).toBe(
        firstKey ? getExcuseTitle(firstKey) : "Paquete Sorpresa",
      );
      const image = template.content.querySelector(
        'img[alt="Paquete sorpresa"]',
      );
      expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(
        firstKey ? getExcuseImage(firstKey) : "/images/fallback.jpg",
      );
      const prefix = locale === "en" ? "/en" : "";
      expect(
        Array.from(template.content.querySelectorAll("a")).map((link) =>
          link.getAttribute("href"),
        ),
      ).toEqual([`${prefix}/trippers`, `${prefix}/trippers/alex`]);
    },
  );

  it.each([null, "unknown"])(
    "renders the existing fallback for level %s",
    async (level) => {
      vi.mocked(getTripperExperiencesByTypeAndLevel).mockResolvedValueOnce({
        solo: {
          unknown: [
            {
              ...EXPERIENCE,
              excuseKey: [],
              level,
            },
          ],
        },
      });

      const html = renderToStaticMarkup(
        await Page({
          params: Promise.resolve({ locale, tripper: "alex" }),
        }),
      );

      expect(html).toContain("Duración: 2-3 días");
      expect(html).toContain("Actividades: 1-2 actividades");
    },
  );
});

it("falls back to an image that exists when an experience has no excuse or hero image", async () => {
  vi.mocked(getTripperExperiencesByTypeAndLevel).mockResolvedValueOnce({
    solo: {
      essenza: [{ ...EXPERIENCE, excuseKey: [], heroImage: "", level: "essenza" }],
    },
  });

  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    await Page({ params: Promise.resolve({ locale: "es", tripper: "alex" }) }),
  );

  const src = decodeURIComponent(
    template.content
      .querySelector('img[alt="Paquete sorpresa"]')
      ?.getAttribute("src") ?? "",
  );
  const asset = /url=([^&]+)/.exec(src)?.[1] ?? src;
  expect(asset).toBe("/images/fallback.jpg");
  expect(existsSync(path.join(process.cwd(), "public", asset))).toBe(true);
});
