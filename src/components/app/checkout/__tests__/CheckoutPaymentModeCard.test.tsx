import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import { CheckoutPaymentModeCard } from "../CheckoutPaymentModeCard";

const enDict = en as unknown as Dictionary;
const esDict = es as unknown as Dictionary;
const usd = (amount: number) => `USD ${amount.toFixed(2)}`;

let harness: DomHarness;
const onModeChange = vi.fn();
const onEmailChange = vi.fn();
const onCalculate = vi.fn();
const onDisclaimerChange = vi.fn();

function renderCard(
  props: Partial<Parameters<typeof CheckoutPaymentModeCard>[0]> = {},
  dict: Dictionary = enDict,
) {
  harness.render(
    <CheckoutPaymentModeCard
      calculating={false}
      copy={dict.journey.checkout.paymentMode}
      deadlineHours={72}
      disabled={false}
      disclaimerAccepted={false}
      emails={["", ""]}
      emailsError={null}
      mode="TOTAL"
      onCalculate={onCalculate}
      onDisclaimerChange={onDisclaimerChange}
      onEmailChange={onEmailChange}
      onModeChange={onModeChange}
      share={null}
      showDisclaimerError={false}
      usd={usd}
      {...props}
    />,
  );
}

const buttons = () => Array.from(harness.container.querySelectorAll("button"));
const byText = (text: string) => buttons().find((b) => b.textContent === text)!;

beforeEach(() => {
  harness = createDomHarness();
  vi.resetAllMocks();
});

afterEach(() => harness.unmount());

describe("CheckoutPaymentModeCard", () => {
  it("offers paying the total or individually, in both locales", () => {
    renderCard();
    expect(harness.container.textContent).toContain("How are you paying?");
    harness.click(byText("Pay individually"));
    expect(onModeChange).toHaveBeenCalledWith("INDIVIDUAL");
    harness.click(byText("Pay total"));
    expect(onModeChange).toHaveBeenCalledWith("TOTAL");
    renderCard({}, esDict);
    expect(buttons().map((b) => b.textContent)).toEqual(["Pago total", "Pago individual"]);
  });

  it("asks for one email per companion only when paying individually", () => {
    renderCard();
    expect(harness.container.querySelectorAll("input[type=email]")).toHaveLength(0);
    renderCard({ mode: "INDIVIDUAL" });
    const inputs = harness.container.querySelectorAll("input[type=email]");
    expect(inputs).toHaveLength(2);
    expect(harness.container.textContent).toContain("Companion 2 email");
    harness.click(byText("Calculate my share"));
    expect(onCalculate).toHaveBeenCalledOnce();
  });

  it("shows a pending calculation and blocks repeat clicks", () => {
    renderCard({ mode: "INDIVIDUAL", calculating: true });
    const button = byText("Calculating…");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.querySelector("svg.animate-spin")).not.toBeNull();
  });

  it("shows the shares and a disclaimer with the deadline and the maximum top-up", () => {
    renderCard({ mode: "INDIVIDUAL", share: { yours: 1023.34, companion: 1023.33, maxTopUp: 46.66 } });
    const text = harness.container.textContent ?? "";
    expect(text).toContain("Your share today");
    expect(text).toContain("USD 1023.34");
    expect(text).toContain("USD 1023.33");
    expect(text).toContain("have 72 hours to pay their share");
    expect(text).toContain("USD 46.66 at most");
    const checkbox = harness.container.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    harness.click(checkbox);
    expect(onDisclaimerChange).toHaveBeenCalledWith(true);
  });

  it("surfaces email and disclaimer errors", () => {
    renderCard({
      mode: "INDIVIDUAL",
      emailsError: enDict.journey.checkout.paymentMode.emailsInvalid,
      share: { yours: 10, companion: 10, maxTopUp: 0 },
      showDisclaimerError: true,
    });
    const alerts = Array.from(harness.container.querySelectorAll("[role=alert]")).map((a) => a.textContent);
    expect(alerts).toEqual([
      "Enter a different, valid email for each companion.",
      "Accept the individual payment terms to continue.",
    ]);
  });

  it("explains that the organizer's share includes the minors, in both locales", () => {
    const share = { yours: 2100, companion: 1050, maxTopUp: 0 };
    renderCard({ mode: "INDIVIDUAL", share: { ...share, minors: 1 } });
    expect(harness.container.textContent).toContain("Includes the share of the minor traveling with you.");
    renderCard({ mode: "INDIVIDUAL", share: { ...share, minors: 2 } }, esDict);
    expect(harness.container.textContent).toContain("Incluye la parte de los 2 menores que viajan contigo.");
    renderCard({ mode: "INDIVIDUAL", share: { ...share, minors: 0 } });
    expect(harness.container.textContent).not.toContain("Includes the share");
  });
});
