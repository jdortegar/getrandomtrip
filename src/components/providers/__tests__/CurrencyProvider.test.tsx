import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrencyProvider } from "../CurrencyProvider";
import { LocalPriceApprox } from "@/components/common/LocalPriceApprox";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render(
  local: { currency: string; rate: number } | null,
  locale = "en",
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ local }))),
  );
  container = document.createElement("div");
  root = createRoot(container);
  await act(async () => {
    root.render(
      <CurrencyProvider locale={locale}>
        <span data-testid="usd">USD 350</span>
        <LocalPriceApprox usd={350} />
      </CurrencyProvider>,
    );
  });
}

// Intl may separate digits with non-breaking spaces.
const text = () => container.textContent?.replace(/ /g, " ");

describe("CurrencyProvider + LocalPriceApprox", () => {
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("shows only the USD price without a local currency", async () => {
    await render(null);
    expect(text()).toBe("USD 350");
    expect(container.querySelector('[data-component="LocalPriceApprox"]')).toBeNull();
  });

  it("adds the ≈ local line under the USD price, rounded to 3 significant figures", async () => {
    await render({ currency: "ARS", rate: 1539.593 }, "es");
    expect(text()).toBe("USD 350≈ $539.000 ARS");
  });

  it("uses the localized symbol for non-dollar currencies", async () => {
    await render({ currency: "EUR", rate: 0.92 });
    expect(text()).toBe("USD 350≈ €322");
  });

  it("forwards the dev-only ?country=XX override to the API", async () => {
    window.history.replaceState(null, "", "/experiences?country=AR");
    await render(null);
    expect(fetch).toHaveBeenCalledWith("/api/currency?country=AR");
  });
});
