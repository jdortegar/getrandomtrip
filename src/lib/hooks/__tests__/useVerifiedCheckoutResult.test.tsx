import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVerifiedCheckoutResult } from "../useVerifiedCheckoutResult";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function summary(tripStatus: string) {
  return {
    payment: { amount: 1023.34, currency: "USD", status: "APPROVED" },
    trip: { id: "trip-1", status: tripStatus },
  };
}

describe("useVerifiedCheckoutResult", () => {
  let current: ReturnType<typeof useVerifiedCheckoutResult>;
  let root: Root;
  const fetchMock = vi.fn();
  function Harness() {
    current = useVerifiedCheckoutResult("pi_org");
    return null;
  }
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    root = createRoot(document.createElement("div"));
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });

  it.each(["COLLECTING", "CONFIRMED"])(
    "reports success once the paid trip is %s",
    async (tripStatus) => {
      fetchMock.mockImplementation(async (url: string) =>
        url.includes("confirm-payment")
          ? Response.json({ status: "succeeded" })
          : Response.json(summary(tripStatus)),
      );
      await act(async () => root.render(<Harness />));
      await act(async () => {});
      expect(current.status).toBe("success");
      expect(current.data?.trip.status).toBe(tripStatus);
    },
  );
});
