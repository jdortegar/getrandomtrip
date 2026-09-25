import { act, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ModalProps } from "@/components/ui/Modal";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { CheckoutTravelersSummarySection } from "../CheckoutTravelersSummarySection";

vi.mock("@/components/ui/Modal", () => ({
  DialogTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
  Modal: ({ children, open }: ModalProps) =>
    open ? <div role="dialog">{children}</div> : null,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function deferredSave() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, reject, resolve };
}

describe.each([
  { checkoutCopy: en.journey.checkout, locale: "en", savingLabel: "Saving…" },
  {
    checkoutCopy: es.journey.checkout,
    locale: "es",
    savingLabel: "Guardando…",
  },
])("checkout traveler saving ($locale)", ({ checkoutCopy, savingLabel }) => {
  let container: HTMLDivElement;
  let root: Root;
  const onSaveTravelers = vi.fn<() => Promise<void>>();

  beforeEach(() => {
    onSaveTravelers.mockReset();
    container = document.createElement("div");
    root = createRoot(container);
    act(() =>
      root.render(
        <CheckoutTravelersSummarySection
          checkoutCopy={checkoutCopy}
          onSaveTravelers={onSaveTravelers}
          partyEditable
          paxDetails={{ adults: 2, minors: 0, rooms: 1 }}
          tileClassName=""
          tileLabelClassName=""
        />,
      ),
    );
    act(() => container.querySelector("button")!.click());
  });

  afterEach(() => act(() => root.unmount()));

  function doneButton() {
    return container.querySelector<HTMLButtonElement>(
      '[role="dialog"] > button',
    )!;
  }

  function expectPending(button: HTMLButtonElement) {
    expect(button.textContent).toBe(savingLabel);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.disabled).toBe(true);
    expect(
      button.querySelector("svg.animate-spin")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  }

  function expectIdle(button: HTMLButtonElement) {
    expect(button.textContent).toBe(checkoutCopy.travelersModalDone);
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(button.disabled).toBe(false);
    expect(button.querySelector("svg.animate-spin")).toBeNull();
    expect(container.querySelector("fieldset")?.disabled).toBe(false);
  }

  it("shows localized progress, blocks duplicate saves, and resets after success", async () => {
    const pending = deferredSave();
    onSaveTravelers.mockReturnValue(pending.promise);
    const button = doneButton();
    expectIdle(button);

    act(() => {
      button.click();
      button.click();
    });

    expect(onSaveTravelers).toHaveBeenCalledTimes(1);
    expect(onSaveTravelers).toHaveBeenCalledWith({
      adults: 2,
      minors: 0,
      rooms: 1,
    });
    expectPending(button);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    await act(async () => pending.resolve());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => container.querySelector("button")!.click());
    expectIdle(doneButton());
  });

  it("restores the action and fields after rejection and allows retry", async () => {
    const first = deferredSave();
    const retry = deferredSave();
    onSaveTravelers
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(retry.promise);
    const button = doneButton();

    act(() => button.click());
    expectPending(button);
    await act(async () => first.reject(new Error("Save failed")));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expectIdle(button);
    expect(container.querySelector('[role="dialog"] [role="alert"]')?.textContent).toBe(checkoutCopy.errors.updateTripFailed);

    act(() => button.click());
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(onSaveTravelers).toHaveBeenCalledTimes(2);
    expectPending(button);
    await act(async () => retry.resolve());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => container.querySelector("button")!.click());
    expectIdle(doneButton());
  });
});
