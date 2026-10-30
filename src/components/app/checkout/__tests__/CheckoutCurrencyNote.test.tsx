import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutCurrencyNote } from "../CheckoutCurrencyNote";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import en from "@/dictionaries/en.json";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

let container: HTMLDivElement;
let root: Root;

async function render(local: { currency: string; rate: number } | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ local }))),
  );
  container = document.createElement("div");
  root = createRoot(container);
  await act(async () => {
    root.render(
      <CurrencyProvider copy={en.currency} locale="en">
        <CheckoutCurrencyNote copy={en.currency} />
      </CurrencyProvider>,
    );
  });
}

describe("CheckoutCurrencyNote", () => {
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });

  it("always states that charges are in USD", async () => {
    await render(null);
    expect(container.textContent).toContain(en.currency.checkoutDisclaimer);
    expect(container.textContent).not.toContain(en.currency.cardTaxesNote);
  });

  it("adds the card taxes note for Argentine visitors", async () => {
    await render({ currency: "ARS", rate: 1200 });
    expect(container.textContent).toContain(en.currency.checkoutDisclaimer);
    expect(container.textContent).toContain(en.currency.cardTaxesNote);
  });

  it("omits the card taxes note for other local currencies", async () => {
    await render({ currency: "EUR", rate: 0.9 });
    expect(container.textContent).not.toContain(en.currency.cardTaxesNote);
  });
});
