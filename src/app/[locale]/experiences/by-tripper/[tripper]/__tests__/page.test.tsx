import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
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
  redirect: vi.fn(() => { throw new Error("redirect"); }),
}));

it.each(["en", "es"])("keeps the %s locale in directory and profile links", async (locale) => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(await Page({
    params: Promise.resolve({ locale, tripper: "alex" }),
  }));

  const prefix = locale === "en" ? "/en" : "";
  expect(Array.from(template.content.querySelectorAll("a")).map((link) => link.getAttribute("href")))
    .toEqual([`${prefix}/trippers`, `${prefix}/trippers/alex`, `${prefix}/trippers`]);
});

it.each(["en", "es"])("preserves %s in the invalid-tripper fallback", async (locale) => {
  vi.mocked(redirect).mockClear();
  await expect(Page({ params: Promise.resolve({ locale, tripper: "undefined" }) }))
    .rejects.toThrow("redirect");
  expect(redirect).toHaveBeenCalledExactlyOnceWith(
    `${locale === "en" ? "/en" : ""}/experiences/by-type/group`,
  );
});
