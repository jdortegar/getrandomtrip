import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Campaign } from "@/types/emailCampaign";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The preview iframe points at an API route; keep happy-dom from loading it.
const happyDOM = (
  globalThis as {
    happyDOM?: { settings: { navigation: { disableChildFrameNavigation: boolean } } };
  }
).happyDOM;
if (happyDOM) happyDOM.settings.navigation.disableChildFrameNavigation = true;

export interface Mounted {
  container: HTMLDivElement;
  unmount: () => void;
}

export function mount(node: ReactNode): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

export async function flush() {
  await act(async () => {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
  });
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

export function jsonResponse(status: number, body: unknown) {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  };
}

/** Sets a controlled field value the way React listens for it in happy-dom. */
export function setValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) {
  const proto =
    element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(element, value);
    element.dispatchEvent(
      new Event(element instanceof HTMLSelectElement ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}

export function field<T extends HTMLElement>(container: HTMLElement, id: string): T {
  const found = container.querySelector(`#${id}`);
  if (!found) throw new Error(`Field #${id} not found`);
  return found as T;
}

export function buttonByText(
  container: HTMLElement,
  text: string,
): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === text,
  );
}

export async function click(element: HTMLElement | undefined | null) {
  if (!element) throw new Error("Element to click not found");
  await act(async () => {
    element.click();
  });
}

export function draftCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    bodyMarkdown: "Hola **fundador**",
    createdAt: "2026-06-01T00:00:00.000Z",
    ctaLabel: "Reservar",
    ctaUrl: "https://getrandomtrip.com/es",
    id: "camp-1",
    locale: "es",
    name: "Fundadores",
    preheader: null,
    promoCode: "FUNDADOR30",
    segmentSources: ["WAITLIST"],
    sentAt: null,
    status: "DRAFT",
    stripePromotionCodeId: "promo_1",
    subject: "Tu descuento de fundador",
    title: "Hola fundador",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}
