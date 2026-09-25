import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StripePaymentForm } from "../StripePaymentForm";
const confirmPayment = vi.hoisted(() => vi.fn());
vi.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => ({ confirmPayment }),
  useElements: () => ({}),
  PaymentElement: () => null,
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("Stripe confirmation lifecycle", () => {
  let root: Root;
  let container: HTMLDivElement;
  const onBeforeConfirm = vi.fn();
  const onProcessingChange = vi.fn();
  function form(key: string) {
    return (
      <StripePaymentForm
        billingCity=""
        billingCountry=""
        billingEmail=""
        billingLine1=""
        billingName=""
        billingPhone=""
        billingPostalCode=""
        billingState=""
        copy={{
          paymentBack: "Back",
          paymentProcessing: "Processing",
          paymentSubmit: "Pay",
        }}
        key={key}
        onBeforeConfirm={onBeforeConfirm}
        onCancel={vi.fn()}
        onProcessingChange={onProcessingChange}
      />
    );
  }
  beforeEach(() => {
    vi.resetAllMocks();
    container = document.createElement("div");
    root = createRoot(container);
    act(() => root.render(form("initial")));
  });
  afterEach(() => act(() => root.unmount()));
  function submit() {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }

  it("does not confirm detached Elements after unmount during preflight", async () => {
    let resolve!: (value: boolean) => void;
    onBeforeConfirm.mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    act(submit);
    act(() => root.render(null));
    await act(async () => resolve(true));
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(onProcessingChange).toHaveBeenLastCalledWith(false);
  });

  it("unlocks after rejected preflight and rejects duplicate submit events", async () => {
    onBeforeConfirm.mockRejectedValue(new Error("Save failed"));
    await act(async () => {
      submit();
      submit();
    });
    expect(onBeforeConfirm).toHaveBeenCalledTimes(1);
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Save failed");
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
    expect(onProcessingChange).toHaveBeenLastCalledWith(false);
  });

  it("does not let an old preflight clear the replacement form's processing lock", async () => {
    let resolveOld!: (value: boolean) => void;
    onBeforeConfirm
      .mockReturnValueOnce(
        new Promise<boolean>((done) => {
          resolveOld = done;
        }),
      )
      .mockReturnValueOnce(new Promise(() => {}));
    act(submit);
    act(() => root.render(form("replacement")));
    act(submit);
    expect(onProcessingChange).toHaveBeenLastCalledWith(true);
    await act(async () => resolveOld(false));
    expect(onProcessingChange).toHaveBeenLastCalledWith(true);
    expect(confirmPayment).not.toHaveBeenCalled();
  });
});
