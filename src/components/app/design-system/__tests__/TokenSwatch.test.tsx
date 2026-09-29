import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TokenSwatch } from "../TokenSwatch";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  document.documentElement.style.setProperty("--color-primary", "#123456");
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.style.removeProperty("--color-primary");
  vi.restoreAllMocks();
});

it.each([en.designSystem, es.designSystem])(
  "copies current token values with busy feedback, duplicate protection, and failure recovery",
  async (copy) => {
    let resolve!: () => void;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockReturnValueOnce(pending);
    act(() =>
      root.render(
        <TokenSwatch
          copy={copy.foundations.clipboard}
          fallback="#0F5C60"
          name="Deep Teal"
          token="--color-primary"
          usage={copy.foundations.colors.primary.usage}
        />,
      ),
    );
    const button = container.querySelector("button")!;
    expect(button.textContent).toContain("#123456");
    document.documentElement.style.setProperty("--color-primary", "#654321");
    act(() => {
      button.click();
      button.click();
    });
    expect(write).toHaveBeenCalledExactlyOnceWith("#654321");
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector(".animate-spin")).not.toBeNull();
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      copy.foundations.clipboard.pending,
    );
    await act(async () => resolve());
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      copy.foundations.clipboard.success,
    );
    write.mockRejectedValueOnce(new Error("Denied"));
    await act(async () => button.click());
    expect(button.disabled).toBe(false);
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      copy.foundations.clipboard.failure,
    );
    write.mockResolvedValueOnce();
    await act(async () => button.click());
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      copy.foundations.clipboard.success,
    );
  },
);
