import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageHeading } from "@/components/layout/PageHeading";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("PageHeading", () => {
  it("preserves the heading and description without an eyebrow", () => {
    act(() => {
      root.render(
        <PageHeading
          description="Explore our experiences"
          title="Experiences"
        />,
      );
    });

    const title = container.querySelector("h1");

    expect(title?.previousElementSibling).toBeNull();
    expect(title?.textContent).toBe("Experiences");
    expect(title?.nextElementSibling?.textContent).toBe(
      "Explore our experiences",
    );
    expect(title?.parentElement?.children).toHaveLength(2);
  });

  it("places an optional eyebrow directly before the title", () => {
    act(() => {
      root.render(<PageHeading eyebrow="TRAVELER" title="My dashboard" />);
    });

    const title = container.querySelector("h1");

    expect(title?.previousElementSibling?.textContent).toBe("TRAVELER");
    expect(title?.previousElementSibling?.classList.contains("uppercase")).toBe(
      true,
    );
    expect(
      title?.previousElementSibling?.classList.contains("text-neutral-600"),
    ).toBe(true);
    expect(title?.nextElementSibling).toBeNull();
  });
});
