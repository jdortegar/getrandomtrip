import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { useTableRequestGuard } from "../useTableRequestGuard";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
let begin: () => () => boolean;
function Harness({ query }: { query: string }) {
  const start = useTableRequestGuard(query);
  useEffect(() => {
    begin = start;
  }, [start]);
  return null;
}
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => root.render(<Harness query="all" />));
});
afterEach(() => {
  act(() => root.unmount());
});
it("allows only the most recent retry or same-query refetch to finish", () => {
  const first = begin();
  expect(first()).toBe(true);
  const second = begin();
  expect(first()).toBe(false);
  expect(second()).toBe(true);
});
it("invalidates requests and captured refetch callbacks on raw query changes", () => {
  const oldBegin = begin;
  const oldRequest = begin();
  act(() => root.render(<Harness query="new raw search" />));
  const latest = begin();
  expect(oldRequest()).toBe(false);
  expect(oldBegin()()).toBe(false);
  expect(latest()).toBe(true);
});
it("invalidates callbacks on unmount", () => {
  const pending = begin();
  act(() => root.render(null));
  expect(pending()).toBe(false);
  expect(begin()()).toBe(false);
});
