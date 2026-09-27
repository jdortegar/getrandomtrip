import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import LocalizedLink from "../LocalizedLink";
const state = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next/navigation", () => ({ useParams: () => state }));
it.each(["en", "es"])(
  "renders %s internal links using the URL locale",
  (locale) => {
    state.locale = locale;
    const html = renderToStaticMarkup(
      <LocalizedLink href="/trippers/maria?campaign=x">Profile</LocalizedLink>,
    );
    expect(html).toContain(
      `href="${locale === "en" ? "/en" : ""}/trippers/maria?campaign=x"`,
    );
  },
);
it("preserves fragment and external destinations, and localizes object hrefs", () => {
  state.locale = "en";
  expect(
    renderToStaticMarkup(
      <LocalizedLink href="#section">Section</LocalizedLink>,
    ),
  ).toContain('href="#section"');
  expect(
    renderToStaticMarkup(
      <LocalizedLink href="https://example.com">External</LocalizedLink>,
    ),
  ).toContain('href="https://example.com"');
  expect(
    renderToStaticMarkup(
      <LocalizedLink href={{ pathname: "/blog", query: { tag: "solo" } }}>
        Blog
      </LocalizedLink>,
    ),
  ).toContain('href="/en/blog?tag=solo"');
});
