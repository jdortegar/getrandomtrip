import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TripPaymentCard } from "@/components/app/dashboard/traveler/TripPaymentCard";
import es from "@/dictionaries/es.json";
import type { TripPaymentSummary } from "@/types/tripDetails";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

const payment: TripPaymentSummary = {
  status: "APPROVED",
  amount: 700,
  currency: "usd",
  provider: "stripe",
  providerPaymentId: "pi_3U0TuN50kABCDEF",
  createdAt: "2026-10-08T12:00:00.000Z",
  paidAt: "2026-10-08T12:05:00.000Z",
};

function render(receiptHref?: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripPaymentCard copy={es.tripDetail} locale="es" payment={payment} receiptHref={receiptHref} />,
    ),
  );
}

it("leads with the amount and summarizes when and how it was paid", () => {
  render("/api/trips/trip-1/receipt");

  const text = container.textContent ?? "";
  expect(text).toContain(es.tripDetail.paymentStatus.APPROVED);
  expect(text).toContain("USD");
  expect(text).toContain("700,00");
  expect(text).toMatch(/Pagado el 8 oct 2026 con Stripe/);
  // Full reference, truncated by CSS rather than sliced.
  expect(text).toContain("pi_3U0TuN50kABCDEF");

  const receipt = container.querySelector("a");
  expect(receipt?.getAttribute("href")).toBe("/api/trips/trip-1/receipt");
  expect(receipt?.getAttribute("target")).toBe("_blank");
  expect(receipt?.textContent).toContain(es.tripDetail.downloadReceipt);
});

it("hides the receipt action for an unsettled payment", () => {
  render();
  expect(container.querySelector("a")).toBeNull();
});
