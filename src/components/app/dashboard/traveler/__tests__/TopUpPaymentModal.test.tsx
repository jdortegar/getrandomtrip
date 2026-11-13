import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";

const form = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));
vi.mock("@/lib/stripe-client", () => ({ getStripePromise: () => Promise.resolve(null) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/app/checkout/StripePaymentForm", () => ({
  StripePaymentForm: (props: Record<string, unknown>) => {
    form.props = props;
    return <form data-testid="payment-form" />;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

import { TopUpPaymentModal } from "../TopUpPaymentModal";

const topUp = { shareId: "topup-1", amount: 17.5, currency: "USD", deadline: "2026-11-01T12:00:00.000Z" };
const copy = en.dashboard.topUpDue;

describe("TopUpPaymentModal", () => {
  let root: Root;
  const fetchMock = vi.fn();
  const onPaid = vi.fn();
  beforeEach(() => {
    form.props = null;
    fetchMock.mockReset();
    onPaid.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    root = createRoot(document.createElement("div"));
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  const render = async (props: Partial<Parameters<typeof TopUpPaymentModal>[0]> = {}) => {
    await act(async () =>
      root.render(
        <TopUpPaymentModal
          copy={copy}
          locale="en"
          onClose={vi.fn()}
          onPaid={onPaid}
          paymentCopy={{ ...en.journey.checkout }}
          topUp={topUp}
          {...props}
        />,
      ),
    );
  };

  it("asks for the payer's top-up intent and returns to the dashboard after paying", async () => {
    fetchMock.mockResolvedValue(Response.json({ clientSecret: "secret_topup" }));
    await render();
    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/top-up-intent", expect.objectContaining({
      body: JSON.stringify({ shareId: "topup-1" }),
    }));
    expect(document.body.textContent).toContain("Pay USD 17.50 with your card.");
    expect(form.props).toMatchObject({ collectBillingDetails: true });
    // Paying returns to the same success page as the trip checkout.
    expect(form.props).not.toHaveProperty("returnPath");
  });

  it("reports an already settled top-up", async () => {
    fetchMock.mockResolvedValue(Response.json({ paid: true }));
    await render();
    expect(document.body.textContent).toContain(copy.paid);
    expect(onPaid).toHaveBeenCalledOnce();
  });

  it("says the window closed once the grace period is over", async () => {
    fetchMock.mockResolvedValue(Response.json({ errorCode: "GRACE_PASSED" }, { status: 409 }));
    await render();
    expect(document.body.textContent).toContain(copy.closed);
    expect(form.props).toBeNull();
  });

  it("retries after an error", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: "boom" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ clientSecret: "secret_topup" }));
    await render();
    const retry = Array.from(document.body.querySelectorAll("[role=alert] button"))[0] as HTMLButtonElement;
    await act(async () => retry.click());
    expect(form.props).not.toBeNull();
  });

  it("requests once when already paid even if the parent re-renders on onPaid", async () => {
    fetchMock.mockImplementation(async () => Response.json({ paid: true }));
    function Parent() {
      const [, set] = useState(0);
      return (
        <TopUpPaymentModal
          copy={copy}
          locale="en"
          onClose={vi.fn()}
          onPaid={() => set((n) => n + 1)}
          paymentCopy={{ ...en.journey.checkout }}
          topUp={topUp}
        />
      );
    }
    await act(async () => root.render(<Parent />));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requests nothing while closed", async () => {
    await render({ topUp: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
