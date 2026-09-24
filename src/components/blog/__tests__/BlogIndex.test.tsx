import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { BlogIndexPost } from "@/lib/types/BlogIndexPost";
import { BlogIndex } from "../BlogIndex";
import {
  createDomHarness,
  type DomHarness,
} from "../../ui/__tests__/test-dom-utils";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
const copy = en.blogPage;
let harness: DomHarness;
let requests: string[];
function post(title: string): BlogIndexPost {
  return {
    author: { avatarUrl: "", id: "author", name: "Alex", slug: "alex" },
    coverUrl: null,
    excuseKey: [],
    format: "story",
    id: title,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    subtitle: "Travel notes",
    tags: [],
    title,
    travelType: [],
  };
}
beforeEach(() => {
  harness = createDomHarness();
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/trippers") return Response.json([]);
      if (!url.startsWith("/api/blogs?"))
        throw new Error(`Unexpected fetch ${url}`);
      requests.push(url);
      const query = new URL(url, "https://example.test").searchParams;
      const page = Number(query.get("page"));
      const filtered = query.get("level") === "xsed";
      return Response.json({
        blogs: [
          post(
            filtered
              ? "XSED story"
              : page === 1
                ? "First story"
                : "Second story",
          ),
        ],
        pagination: { page, hasMore: !filtered && page === 1 },
      });
    }),
  );
});
afterEach(() => {
  harness.unmount();
  vi.unstubAllGlobals();
});
async function render() {
  await act(async () =>
    harness.render(<BlogIndex copy={{ ...copy }} locale="en" />),
  );
}
function titles() {
  return [...harness.container.querySelectorAll("h3")].map(
    (node) => node.textContent,
  );
}
async function loadMore() {
  const button = [...harness.container.querySelectorAll("button")].find(
    (node) => node.textContent === copy.loadMore,
  )!;
  await act(async () => harness.click(button));
}

it("renders nonempty results and does not refetch on an unchanged parent rerender", async () => {
  await render();
  expect(titles()).toEqual(["First story"]);
  expect(
    harness.container.querySelector('a[href="/en/blog/first-story"]')
      ?.textContent,
  ).toContain("First story");
  expect(requests).toEqual(["/api/blogs?limit=12&page=1"]);
  await render();
  expect(titles()).toEqual(["First story"]);
  expect(requests).toEqual(["/api/blogs?limit=12&page=1"]);
});

it("appends page two and shows the terminal listing message", async () => {
  await render();
  await loadMore();
  expect(requests).toEqual([
    "/api/blogs?limit=12&page=1",
    "/api/blogs?limit=12&page=2",
  ]);
  expect(titles()).toEqual(["First story", "Second story"]);
  expect(harness.container.textContent).toContain(copy.seenAll);
  expect(
    [...harness.container.querySelectorAll("button")].some(
      (node) => node.textContent === copy.loadMore,
    ),
  ).toBe(false);
});

it("resets pagination and replaces the list when the real level filter changes", async () => {
  await render();
  await loadMore();
  const select = [...harness.container.querySelectorAll("select")].find(
    (node) => node.querySelector('option[value="xsed"]'),
  )!;
  await act(async () => {
    select.value = "xsed";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(requests.at(-1)).toBe("/api/blogs?limit=12&page=1&level=xsed");
  expect(titles()).toEqual(["XSED story"]);
  await act(async () =>
    select.dispatchEvent(new Event("change", { bubbles: true })),
  );
  expect(requests).toHaveLength(3);
  await act(async () => {
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(requests.at(-1)).toBe("/api/blogs?limit=12&page=1");
  expect(titles()).toEqual(["First story"]);
});
