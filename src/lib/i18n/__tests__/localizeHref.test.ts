import { expect, it } from "vitest";
import { localizeHref } from "../localizeHref";
it.each([
  [
    "en",
    "/experiences/by-type/solo?tripper=maria",
    "/en/experiences/by-type/solo?tripper=maria",
  ],
  ["en", "/en/blog/story#section", "/en/blog/story#section"],
  ["es", "/en/blog/story", "/blog/story"],
  ["en", "/?campaign=x", "/en?campaign=x"],
  ["en", "#exploration", "#exploration"],
  ["en", "https://example.com", "https://example.com"],
  ["en", "//example.com", "//example.com"],
  ["en", "/api/download?token=x", "/api/download?token=x"],
])("localizes %s %s without losing its suffix", (locale, href, expected) =>
  expect(localizeHref(locale, href)).toBe(expected),
);
