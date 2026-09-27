import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StripePaymentForm } from "../StripePaymentForm";
const confirmPayment = vi.hoisted(() => vi.fn());
const element = vi.hoisted(() => ({ ready: () => {}, error: () => {} }));
vi.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => ({ confirmPayment }),
  useElements: () => ({}),
  PaymentElement: (props: { onReady?: () => void; onLoadError?: () => void }) => {
    element.ready = props.onReady ?? (() => {});
    element.error = props.onLoadError ?? (() => {});
    return null;
  },
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
          paymentLoading: "Loading secure payment form",
          paymentLoadError: "Payment form could not load",
          paymentRetry: "Retry form",
          paymentFailed: "Payment failed",
        }}
        key={key}
        onBeforeConfirm={onBeforeConfirm}
        onCancel={vi.fn()}
        onProcessingChange={onProcessingChange}
        onRetry={vi.fn()}
      />
    );
  }
  beforeEach(() => {
    vi.resetAllMocks();
    container = document.createElement("div");
    root = createRoot(container);
    act(() => root.render(form("initial")));
  });
  afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });
  function submit() {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }

  it("blocks profile writes and confirmation before the element is ready", async () => {
    expect(container.textContent).toContain("Loading secure payment form");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    await act(async () => submit());
    expect(onBeforeConfirm).not.toHaveBeenCalled();
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it("shows a recoverable load error and blocks payment", async () => {
    act(() => element.error());
    expect(container.textContent).toContain("Payment form could not load");
    expect(container.textContent).toContain("Retry form");
    await act(async () => submit());
    expect(onBeforeConfirm).not.toHaveBeenCalled();
  });

  it("resets element readiness when the payment form remounts", async () => {
    act(() => element.ready());
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    act(() => root.render(form("replacement")));
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    await act(async () => submit());
    expect(onBeforeConfirm).not.toHaveBeenCalled();
  });

  it("offers reload after an unready timeout without entering payment processing", async () => {
    vi.useFakeTimers();
    act(() => root.render(form("timeout")));
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(container.textContent).toContain("Payment form could not load");
    expect(onBeforeConfirm).not.toHaveBeenCalled();
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it("keeps provider confirmation locked instead of timing out and allowing a duplicate", async () => {
    vi.useFakeTimers();
    onBeforeConfirm.mockResolvedValue(true);
    confirmPayment.mockReturnValue(new Promise(() => {}));
    act(() => element.ready());
    await act(async () => submit());
    await act(async () => { await vi.advanceTimersByTimeAsync(120000); submit(); });
    expect(confirmPayment).toHaveBeenCalledTimes(1);
    expect(container.querySelector('button[type="submit"]')?.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it("does not confirm detached Elements after unmount during preflight", async () => {
    let resolve!: (value: boolean) => void;
    onBeforeConfirm.mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    act(() => element.ready());
    act(submit);
    act(() => root.render(null));
    await act(async () => resolve(true));
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(onProcessingChange).toHaveBeenLastCalledWith(false);
  });

  it("unlocks after rejected preflight and rejects duplicate submit events", async () => {
    onBeforeConfirm.mockRejectedValue(new Error("Save failed"));
    act(() => element.ready());
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
    act(() => element.ready());
    act(submit);
    act(() => root.render(form("replacement")));
    act(() => element.ready());
    act(submit);
    expect(onProcessingChange).toHaveBeenLastCalledWith(true);
    await act(async () => resolveOld(false));
    expect(onProcessingChange).toHaveBeenLastCalledWith(true);
    expect(confirmPayment).not.toHaveBeenCalled();
  });
});
