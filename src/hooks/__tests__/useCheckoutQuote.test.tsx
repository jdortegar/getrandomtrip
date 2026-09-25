import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCheckoutQuote } from "../useCheckoutQuote";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const quote = (clientSecret: string) => ({
  clientSecret,
  code: null,
  total: 500,
});
const response = (clientSecret: string) =>
  new Response(JSON.stringify(quote(clientSecret)));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("useCheckoutQuote", () => {
  let current: ReturnType<typeof useCheckoutQuote>;
  let root: Root;
  let container: HTMLDivElement;
  const fetchMock = vi.fn();
  function Harness({ id = "trip-a" }: { id?: string }) {
    current = useCheckoutQuote(id);
    return null;
  }
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => response("initial"));
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  const mount = async () => {
    await act(async () => root.render(<Harness />));
  };

  it("serializes save→quote operations and never unlocks on an older response", async () => {
    await mount();
    const first = deferred<Response>();
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(response("latest"));
    const save = vi.fn().mockResolvedValue(undefined);
    let old!: Promise<unknown>;
    let latest!: Promise<unknown>;
    await act(async () => {
      old = current.refresh();
      latest = current.refresh({ save });
    });
    expect(current.isReady()).toBe(false);
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      first.resolve(response("stale"));
      await Promise.all([old, latest]);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(current.quote?.clientSecret).toBe("latest");
    expect(current.isReady()).toBe(true);
  });

  it("blocks confirmation after failure and retries the failed save before quoting", async () => {
    await mount();
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Save failed"))
      .mockResolvedValue(undefined);
    await act(async () => {
      await current.refresh({ save }).catch(() => {});
    });
    expect(current.error).toBe("Save failed");
    expect(current.isReady()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await current.retry();
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(current.isReady()).toBe(true);
  });

  it("retains an explicit promo request when retrying a failed quote", async () => {
    await mount();
    fetchMock
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(response("retry"));
    await act(async () => {
      await current.refresh({ promoCode: "TEN" }).catch(() => {});
    });
    expect(current.isReady()).toBe(false);
    await act(async () => {
      await current.retry();
    });
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body)).toMatchObject({
      tripId: "trip-a",
      promoCode: "TEN",
    });
  });

  it("discards an old trip's response when navigation changes the trip", async () => {
    const first = deferred<Response>();
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(response("trip-b"));
    await act(async () => root.render(<Harness />));
    await act(async () => root.render(<Harness id="trip-b" />));
    await act(async () => {
      first.resolve(response("trip-a"));
      await first.promise;
    });
    expect(current.quote?.clientSecret).toBe("trip-b");
    expect(current.isReady()).toBe(true);
  });
});
