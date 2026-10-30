import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  CurrencyProvider,
  useDisplayCurrency,
} from "../CurrencyProvider";
import { NavCurrencyMenu } from "@/components/NavCurrencyMenu";
import { NavCurrencyPill } from "@/components/NavCurrencyPill";
import { COOKIE_DISPLAY_CURRENCY } from "@/lib/currency/config";
import enCopy from "@/dictionaries/en.json";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

function PriceProbe() {
  const { formatPrice, formatApprox, formatPriceText } = useDisplayCurrency();
  return (
    <>
      <span data-testid="price">{formatPrice(100, "USD 100")}</span>
      <span data-testid="approx">{formatApprox(100) ?? "none"}</span>
      <span data-testid="note">{formatPriceText("2-3 filters: USD 18 each.")}</span>
    </>
  );
}

let container: HTMLDivElement;
let root: Root;

async function render(local: { currency: string; rate: number } | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ local }))),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <CurrencyProvider copy={enCopy.currency} locale="en">
        <NavCurrencyMenu ariaLabel="Select currency" />
        <NavCurrencyPill ariaLabel="Select currency" />
        <PriceProbe />
      </CurrencyProvider>,
    );
  });
}

// Intl separates the currency code with a non-breaking space.
const text = (id: string) =>
  container
    .querySelector(`[data-testid="${id}"]`)
    ?.textContent?.replace(/\u00a0/g, " ");

function clearModeCookie() {
  document.cookie = `${COOKIE_DISPLAY_CURRENCY}=; path=/; max-age=0`;
}

describe("CurrencyProvider", () => {
  beforeEach(() => {
    clearModeCookie();
    vi.mocked(toast.info).mockReset();
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("keeps the caller's USD text and hides the selectors without a local currency", async () => {
    await render(null);
    expect(text("price")).toBe("USD 100");
    expect(text("approx")).toBe("none");
    expect(text("note")).toBe("2-3 filters: USD 18 each.");
    expect(container.querySelector('[aria-label="Select currency"]')).toBeNull();
  });

  it("defaults to USD even when a local currency is detected", async () => {
    await render({ currency: "ARS", rate: 1200 });
    expect(text("price")).toBe("USD 100");
    const pill = [...container.querySelectorAll("button[aria-pressed]")];
    expect(pill.map((b) => b.textContent)).toEqual(["USD", "ARS"]);
    expect(pill[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("switches to the local reference price, toasts, and writes a session cookie", async () => {
    await render({ currency: "ARS", rate: 1200 });
    const ars = [...container.querySelectorAll("button[aria-pressed]")].find(
      (b) => b.textContent === "ARS",
    ) as HTMLButtonElement;
    await act(async () => ars.click());

    expect(text("price")).toBe("≈ ARS 120,000");
    expect(text("approx")).toBe("≈ ARS 120,000");
    expect(text("note")).toBe("2-3 filters: ≈ ARS 21,600 each.");
    expect(toast.info).toHaveBeenCalledWith(
      "Prices in ARS are for reference only. Charges are made in US dollars (USD).",
    );
    expect(document.cookie).toContain(`${COOKIE_DISPLAY_CURRENCY}=LOCAL`);
  });

  it("switches back to USD from the desktop menu without a toast", async () => {
    document.cookie = `${COOKIE_DISPLAY_CURRENCY}=LOCAL; path=/`;
    await render({ currency: "ARS", rate: 1200 });
    expect(text("price")).toBe("≈ ARS 120,000");

    const trigger = container.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toBe("ARS");
    await act(async () => trigger.click());
    const usd = [...container.querySelectorAll('[role="menuitemradio"]')].find(
      (b) => b.textContent === "USD",
    ) as HTMLButtonElement;
    await act(async () => usd.click());

    expect(text("price")).toBe("USD 100");
    expect(toast.info).not.toHaveBeenCalled();
    expect(document.cookie).toContain(`${COOKIE_DISPLAY_CURRENCY}=USD`);
  });
});
