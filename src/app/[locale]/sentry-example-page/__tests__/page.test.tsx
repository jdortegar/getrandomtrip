import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import Page from "../page";
import { handleI18n } from "@/lib/i18n/middleware";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/components/app/sentry/SentryExamplePageClient", () => ({
  SentryExamplePageClient: () => null,
}));
afterEach(() => vi.unstubAllEnvs());

it.each(["production", "test"])("hides the page in %s", async (environment) => {
  vi.stubEnv("NODE_ENV", environment);
  await expect(
    Page({ params: Promise.resolve({ locale: "en" }) }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
});

it.each([
  ["en", en],
  ["es", es],
] as const)("loads %s copy in development", async (locale, dictionary) => {
  vi.stubEnv("NODE_ENV", "development");
  const page = await Page({ params: Promise.resolve({ locale }) });
  expect(page.props.copy).toEqual(dictionary.sentryExample);
});

it("resolves the default and English smoke URLs through existing locale routing", () => {
  const defaultResponse = handleI18n(
    new NextRequest("http://localhost/sentry-example-page"),
  );
  expect(defaultResponse?.headers.get("x-middleware-rewrite")).toBe(
    "http://localhost/es/sentry-example-page",
  );
  const englishResponse = handleI18n(
    new NextRequest("http://localhost/en/sentry-example-page"),
  );
  expect(englishResponse?.headers.get("x-middleware-next")).toBe("1");
});
