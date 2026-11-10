import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { TabSelector } from "../TabSelector";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tabs = [
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Pareja" },
  { id: "group", label: "Grupo" },
  { id: "family", label: "Familia" },
  { id: "honeymoon", label: "Honeymoon" },
  { id: "paws", label: "PAWS" },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

it("keeps marketing tabs in a horizontal scroller so they do not overflow the viewport", () => {
  act(() =>
    root.render(
      <TabSelector
        activeTab="couple"
        onTabChange={() => undefined}
        tabs={tabs}
      />,
    ),
  );
  const scroller = container.querySelector("[data-component='TabSelector']")!;
  expect(scroller.className).toContain("overflow-x-auto");
  expect(scroller.className).toContain("min-w-0");
  expect(scroller.className).toContain("w-full");
  expect(container.querySelector("[data-tab='couple']")?.className).toContain(
    "shrink-0",
  );
});
