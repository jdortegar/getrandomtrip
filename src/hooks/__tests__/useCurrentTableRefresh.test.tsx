import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCurrentTableRefresh } from "../useCurrentTableRefresh";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root;
let refresh: (origin: string) => Promise<void>;
const callback = vi.fn();
function Harness({ query }: { query: string }) {
  const current = useCurrentTableRefresh(async (origin: string) => {
    callback(query, origin);
  });
  useEffect(() => {
    refresh = current;
  }, [current]);
  return null;
}
beforeEach(() => {
  callback.mockClear();
  root = createRoot(document.createElement("div"));
  act(() => root.render(<Harness query="all" />));
});
afterEach(() => {
  act(() => root.unmount());
});
it("an old mutation continuation invokes the latest query with its original arguments", async () => {
  const captured = refresh;
  act(() => root.render(<Harness query="approved" />));
  expect(refresh).toBe(captured);
  await captured("all");
  expect(callback).toHaveBeenCalledExactlyOnceWith("approved", "all");
});
it("does not refetch an unmounted table", async () => {
  const captured = refresh;
  act(() => root.render(null));
  await captured("all");
  expect(callback).not.toHaveBeenCalled();
});
