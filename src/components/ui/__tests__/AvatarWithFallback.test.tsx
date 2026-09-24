import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AvatarWithFallback from "@/components/ui/AvatarWithFallback";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
function render(
  props: Partial<ComponentProps<typeof AvatarWithFallback>> = {},
) {
  act(() =>
    root.render(
      <AvatarWithFallback
        alt="Traveler portrait"
        src="/portrait.svg"
        {...props}
      />,
    ),
  );
}
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("AvatarWithFallback image boundary", () => {
  it.each([
    "/portrait.svg",
    "https://unconfigured.example/portrait.jpg?size=48",
    "blob:http://localhost/portrait-id",
    "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'/%3E",
  ])("keeps the authored source without an optimizer: %s", (src) => {
    render({ src });
    const image = container.querySelector("img")!;
    expect(image.src).toBe(new URL(src, document.baseURI).href);
    expect(image.alt).toBe("Traveler portrait");
    expect(image.getAttribute("srcset")).toBeNull();
  });

  it.each([undefined, null, ""])(
    "uses the outer fallback for a missing source: %s",
    (src) => {
      render({ src });
      expect(container.querySelector("img")).toBeNull();
      render({ src: "/available.svg", alt: "Available portrait" });
      expect(container.querySelector("img")?.alt).toBe("Available portrait");
    },
  );

  it("keeps the outer error fallback after changing to a valid source", () => {
    render();
    act(() =>
      container.querySelector("img")!.dispatchEvent(new Event("error")),
    );
    expect(container.querySelector("img")).toBeNull();
    render({ src: "/replacement.svg" });
    expect(container.querySelector("img")).toBeNull();
  });

  it("removes the loading placeholder at native load without waiting for decode", async () => {
    render();
    const image = container.querySelector("img")!;
    const placeholder = image.previousElementSibling!;
    expect(placeholder.tagName).toBe("DIV");
    let finishDecode!: () => void;
    const decoded = new Promise<void>((resolve) => {
      finishDecode = resolve;
    });
    Object.defineProperty(image, "decode", { value: () => decoded });
    act(() => image.dispatchEvent(new Event("load")));
    expect(placeholder.isConnected).toBe(false);
    expect(container.querySelector("img")?.alt).toBe("Traveler portrait");
    await act(async () => finishDecode());
    render({ src: "/next.svg" });
    expect(container.querySelector("img")?.src).toBe(
      new URL("/next.svg", document.baseURI).href,
    );
    expect(container.querySelector("img")?.previousElementSibling).toBeNull();
  });
});

it.each([
  ["sm", 32],
  ["md", 48],
  ["lg", 64],
  ["xl", 96],
] as const)("retains eager square image sizing for %s", (size, pixels) => {
  render({ size });
  const image = container.querySelector("img")!;
  expect(image.width).toBe(pixels);
  expect(image.height).toBe(pixels);
  expect(image.getAttribute("loading")).toBe("eager");
  expect(image.getAttribute("decoding")).toBe("auto");
});

it("does not replace the outer error fallback when pending decode settles", async () => {
  render();
  const image = container.querySelector("img")!;
  let finishDecode!: () => void;
  Object.defineProperty(image, "decode", {
    value: () =>
      new Promise<void>((resolve) => {
        finishDecode = resolve;
      }),
  });
  act(() => image.dispatchEvent(new Event("load")));
  act(() => image.dispatchEvent(new Event("error")));
  expect(container.querySelector("img")).toBeNull();
  await act(async () => finishDecode());
  expect(container.querySelector("img")).toBeNull();
});
