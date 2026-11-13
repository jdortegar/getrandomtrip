import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Trip } from "@/lib/utils/trips";
import { TopUpDueAlert } from "../TopUpDueAlert";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const trip = {
  id: "trip-1",
  type: "group",
  level: "essenza",
  status: "CONFIRMED",
  myTopUp: { shareId: "topup-1", amount: 17.5, currency: "USD", deadline: "2026-11-01T12:00:00.000Z" },
} as unknown as Trip;

describe("TopUpDueAlert", () => {
  let root: Root;
  let container: HTMLDivElement;
  const onPay = vi.fn();
  beforeEach(() => {
    onPay.mockReset();
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => act(() => root.unmount()));

  it("renders nothing when no top-up is owed", () => {
    act(() => root.render(<TopUpDueAlert copy={en.dashboard.topUpDue} locale="en" onPay={onPay} trips={[{ ...trip, myTopUp: undefined }]} />));
    expect(container.innerHTML).toBe("");
  });

  it("shows the amount, the pay-by time and a pay action per owed top-up", () => {
    act(() => root.render(<TopUpDueAlert copy={en.dashboard.topUpDue} locale="en" onPay={onPay} trips={[trip]} />));
    expect(container.textContent).toContain("A difference is left to pay");
    expect(container.textContent).toContain("USD 17.50");
    expect(container.textContent).toContain("Before November 1, 2026 at 09:00");
    act(() => container.querySelector("button")!.click());
    expect(onPay).toHaveBeenCalledWith(trip);
  });

  it("is localized in Spanish", () => {
    act(() => root.render(<TopUpDueAlert copy={es.dashboard.topUpDue} locale="es" onPay={onPay} trips={[trip]} />));
    expect(container.textContent).toContain("Falta pagar una diferencia");
    expect(container.textContent).toContain("Antes del 1 de noviembre de 2026 a las 09:00");
    expect(container.querySelector("button")?.textContent).toBe("Pagar diferencia");
  });

  it("asks the organizer to pay their remainder so the destination can be revealed", () => {
    const remainder = { ...trip, myTopUp: { shareId: "remainder-1", amount: 35, currency: "USD", deadline: null } } as Trip;
    act(() => root.render(<TopUpDueAlert copy={en.dashboard.topUpDue} locale="en" onPay={onPay} trips={[remainder]} />));
    expect(container.textContent).toContain("USD 35");
    expect(container.textContent).toContain(en.dashboard.topUpDue.remainderNote);
  });
});

