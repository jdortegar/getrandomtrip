import { act, createRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { Stripe } from "@stripe/stripe-js";
const mock = vi.hoisted(() => ({
  load: vi.fn(),
  promises: [] as Array<Promise<unknown>>,
}));
vi.mock("@stripe/stripe-js", () => ({ loadStripe: mock.load }));
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({
    children,
    stripe,
  }: {
    children: ReactNode;
    stripe: Promise<unknown>;
  }) => {
    mock.promises.push(stripe);
    void stripe.catch(() => null);
    return children;
  },
}));
vi.mock("../StripePaymentForm", () => ({
  StripePaymentForm: ({ onRetry }: { onRetry: () => void }) => (
    <button onClick={onRetry}>Retry form</button>
  ),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => vi.unstubAllEnvs());
it("reloads a rejected Stripe script and keeps a successful instance stable", async () => {
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_fixture");
  let reject!: (error: Error) => void;
  const failed = new Promise<Stripe | null>((_, no) => {
    reject = no;
  });
  const stripe = {} as Stripe;
  mock.load.mockReturnValueOnce(failed).mockResolvedValue(stripe);
  const { CheckoutContactCard } = await import("../CheckoutContactCard");
  const container = document.createElement("div");
  const testRoot = createRoot(container);
  const props = {
    checkoutCopy: en.journey.checkout,
    clientSecret: "secret",
    formData: {
      city: "",
      country: "",
      idDocument: "",
      name: "",
      phone: "",
      state: "",
      street: "",
      zipCode: "",
    },
    formRef: createRef<HTMLFormElement>(),
    onBack: vi.fn(),
    onBeforeConfirm: vi.fn(),
    onFieldChange: vi.fn(),
    onPaymentProcessingChange: vi.fn(),
    onRetryPayment: vi.fn(),
    paymentError: null,
    retryLabel: "Retry",
    sessionEmail: "buyer@example.com",
    summary: en.journey.summary,
  };
  try {
    await act(async () => testRoot.render(<CheckoutContactCard {...props} />));
    await act(async () => {
      reject(new Error("Connection unavailable"));
      await failed.catch(() => null);
    });
    const first = mock.promises.at(-1);
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")!.click(),
    );
    expect(mock.load).toHaveBeenCalledTimes(2);
    expect(mock.promises.at(-1)).not.toBe(first);
    expect(await mock.promises.at(-1)).toBe(stripe);
    const recovered = mock.promises.at(-1);
    await act(async () =>
      testRoot.render(
        <CheckoutContactCard {...props} sessionEmail="other@example.com" />,
      ),
    );
    expect(mock.promises.at(-1)).toBe(recovered);
    await act(async () => testRoot.render(<CheckoutContactCard {...props} paymentError="Review dates" paymentRecoveryHref="/en/dashboard/traveler" />));
    expect(container.querySelector('a[href="/en/dashboard/traveler"]')?.textContent).toBe(en.journey.checkout.reviewTripDates);
    expect([...container.querySelectorAll("button")].some((button) => button.textContent === "Retry")).toBe(false);
    expect(props.onRetryPayment).not.toHaveBeenCalled();
    expect(props.onBeforeConfirm).not.toHaveBeenCalled();
  } finally {
    act(() => {
      testRoot.unmount();
    });
  }
});
