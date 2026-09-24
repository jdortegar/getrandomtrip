import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { TravelerDTO } from "@/types/traveler";
import CheckoutResultSuccess from "../CheckoutResultSuccess";

const navigation = vi.hoisted(() => ({ push: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
// Canvas decoration is not part of the checkout request/control contract.
vi.mock("@/components/feedback/Confetti", () => ({ default: () => null }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const http = vi.fn<typeof fetch>();
const labels = en.confirmation.page;
const traveler: TravelerDTO = {
  id: "trav-1",
  kind: "ADULT",
  status: "PENDING",
  fullName: "Ana Perez",
  email: "ana@example.com",
  idDocument: "12345678",
  dateOfBirth: null,
  invitedAt: null,
  submittedAt: null,
};
function summary() {
  return {
    trip: {
      id: "trip-1",
      type: "solo",
      level: "Explorer",
      nights: 2,
      pax: 1,
      originCity: "Buenos Aires",
      originCountry: "Argentina",
      startDate: null,
      endDate: null,
      roster: {
        deadline: null,
        startDate: null,
        locked: false,
        cap: 1,
        submitted: 0,
        travelers: [{ ...traveler }],
      },
    },
    payment: {
      amount: 250,
      currency: "usd",
      receiptUrl: "https://receipt.example/1",
    },
  };
}
function deferred() {
  let resolve!: (value: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
let container: HTMLDivElement;
let root: Root;
async function render(
  props: Partial<ComponentProps<typeof CheckoutResultSuccess>> = {},
) {
  await act(async () =>
    root.render(
      <CheckoutResultSuccess
        hero={en.confirmation.hero}
        labels={labels}
        locale="en"
        travelersCopy={en.inviteTravelers}
        {...props}
      />,
    ),
  );
}
function button(name: string) {
  return [...container.querySelectorAll("button")].find(
    (el) => el.textContent === name,
  )!;
}
beforeEach(() => {
  navigation.query = "payment_intent=pi_query&redirect_status=succeeded";
  navigation.push.mockReset();
  http.mockReset().mockImplementation(async (url) => {
    throw new Error(`Unexpected HTTP: ${url}`);
  });
  vi.stubGlobal("fetch", http);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Checkout confirmation approval", () => {
  it("renders success immediately and waits for confirmation before requesting the summary", async () => {
    const confirm = deferred();
    http
      .mockReturnValueOnce(confirm.promise)
      .mockResolvedValueOnce(Response.json(summary()));
    await render({
      stripeReturn: { paymentIntent: "pi_server", redirectStatus: "succeeded" },
    });
    expect(container.querySelector("h1")?.textContent).toBe(
      en.confirmation.hero.title,
    );
    expect(
      container.querySelector(`a[href="/en/dashboard"]`)?.textContent,
    ).toBe(labels.ctaMyTrips);
    expect(http.mock.calls).toEqual([
      [
        "/api/stripe/confirm-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: "pi_server" }),
        },
      ],
    ]);
    expect(container.textContent).not.toContain("trip-1");
    await act(async () => confirm.resolve(Response.json({ ok: true })));
    expect(http.mock.calls[1]).toEqual([
      "/api/stripe/trip-summary?paymentIntentId=pi_server",
    ]);
    expect(container.textContent).toContain("trip-1");
    expect(container.textContent).toContain("USD 250");
    expect(container.textContent).toContain("Buenos Aires, Argentina");
    expect(container.textContent).toContain(en.inviteTravelers.heading);
    expect(
      container.querySelector<HTMLInputElement>("#traveler-trav-1-fullName")
        ?.value,
    ).toBe("Ana Perez");
    expect(
      container.querySelector(`a[href="https://receipt.example/1"]`)
        ?.textContent,
    ).toBe(labels.receiptLink);
  });

  it("shows retry without requests for a failed payment", async () => {
    navigation.query =
      "payment_intent=pi_failed&redirect_status=requires_payment_method";
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    await render();
    expect(container.querySelector("h1")?.textContent).toBe(labels.errorTitle);
    act(() => button(labels.retry).click());
    expect(back).toHaveBeenCalledOnce();
    expect(http).not.toHaveBeenCalled();
    expect(container.querySelector(`a[href="/en/dashboard"]`)).toBeNull();
  });

  it("keeps success and the default-locale dashboard link without a payment intent", async () => {
    navigation.query = "";
    await render({ locale: "invalid" });
    expect(container.querySelector("h1")?.textContent).toBe(
      en.confirmation.hero.title,
    );
    expect(
      container.querySelector(`a[href="/es/dashboard"]`)?.textContent,
    ).toBe(labels.ctaMyTrips);
    expect(http).not.toHaveBeenCalled();
    expect(button(labels.saveTravelersAction)).toBeUndefined();
  });

  it.each(["COMPLETE", "PENDING"] as const)(
    "navigates after saving only when roster becomes COMPLETE: %s",
    async (status) => {
      const saved = deferred();
      http
        .mockResolvedValueOnce(Response.json({ ok: true }))
        .mockResolvedValueOnce(Response.json(summary()))
        .mockReturnValueOnce(saved.promise);
      await render();
      act(() => button(labels.saveTravelersAction).click());
      expect(button(labels.savingTravelersAction).disabled).toBe(true);
      expect(navigation.push).not.toHaveBeenCalled();
      expect(http.mock.calls[2]).toEqual([
        "/api/travelers/trav-1",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Ana Perez",
            email: "ana@example.com",
            idDocument: "12345678",
          }),
        },
      ]);
      await act(async () =>
        saved.resolve(Response.json({ traveler: { ...traveler, status } })),
      );
      expect(navigation.push.mock.calls).toEqual(
        status === "COMPLETE" ? [["/en/dashboard"]] : [],
      );
      expect(button(labels.saveTravelersAction).disabled).toBe(false);
      expect(container.textContent).toContain(
        status === "COMPLETE"
          ? en.inviteTravelers.statusComplete
          : en.inviteTravelers.statusPending,
      );
    },
  );
  it("still requests the summary after confirmation rejects", async () => {
    const confirm = deferred();
    http
      .mockReturnValueOnce(confirm.promise)
      .mockResolvedValueOnce(Response.json(summary()));
    await render();
    expect(http.mock.calls.map(([url]) => url)).toEqual([
      "/api/stripe/confirm-payment",
    ]);
    await act(async () =>
      confirm.reject(new Error("Confirmation unavailable")),
    );
    expect(http.mock.calls.map(([url]) => url)).toEqual([
      "/api/stripe/confirm-payment",
      "/api/stripe/trip-summary?paymentIntentId=pi_query",
    ]);
    expect(container.textContent).toContain("USD 250");
  });

  it.each(["locked", "empty"])("omits saving for a %s roster", async (kind) => {
    const data = summary();
    if (kind === "locked") data.trip.roster.locked = true;
    else {
      data.trip.roster.cap = 0;
      data.trip.roster.travelers = [];
    }
    http
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json(data));
    await render();
    expect(container.textContent).toContain("trip-1");
    expect(button(labels.saveTravelersAction)).toBeUndefined();
    expect(navigation.push).not.toHaveBeenCalled();
    if (kind === "locked") {
      expect(
        container.querySelector<HTMLInputElement>("#traveler-trav-1-fullName")
          ?.disabled,
      ).toBe(true);
    } else
      expect(container.textContent).not.toContain(en.inviteTravelers.heading);
  });

  it("retains the success screen when summary retrieval fails", async () => {
    http
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockRejectedValueOnce(new Error("Summary unavailable"));
    await render();
    expect(http.mock.calls.map(([url]) => url)).toEqual([
      "/api/stripe/confirm-payment",
      "/api/stripe/trip-summary?paymentIntentId=pi_query",
    ]);
    expect(container.querySelector("h1")?.textContent).toBe(
      en.confirmation.hero.title,
    );
    expect(
      container.querySelector(`a[href="/en/dashboard"]`)?.textContent,
    ).toBe(labels.ctaMyTrips);
    expect(button(labels.saveTravelersAction)).toBeUndefined();
  });
});
