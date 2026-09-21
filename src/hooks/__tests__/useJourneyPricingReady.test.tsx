import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  email: "buyer",
  status: "authenticated",
  id: "trip-A",
  type: "couple",
  refresh: vi.fn(),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: state.status,
    data: state.email ? { user: { email: state.email } } : null,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: state.refresh }),
  useSearchParams: () =>
    new URLSearchParams({ tripRequestId: state.id, travelType: state.type }),
}));
import {
  useJourneyPricingReady,
  journeyPricingKey,
} from "../useJourneyPricingReady";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
function Probe({ binding }: { binding: string }) {
  return <span>{useJourneyPricingReady(binding) ? "quoted" : "loading"}</span>;
}
it("withholds the previous user's or booking's price until the server context refreshes", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <Probe binding={journeyPricingKey(null, "trip-A", "couple")} />,
    ),
  );
  expect(container.textContent).toBe("loading");
  expect(state.refresh).toHaveBeenCalled();
  act(() =>
    root.render(
      <Probe binding={journeyPricingKey("buyer", "trip-A", "couple")} />,
    ),
  );
  expect(container.textContent).toBe("quoted");
  state.id = "trip-B";
  act(() =>
    root.render(
      <Probe binding={journeyPricingKey("buyer", "trip-A", "couple")} />,
    ),
  );
  expect(container.textContent).toBe("loading");
  act(() =>
    root.render(
      <Probe binding={journeyPricingKey("buyer", "trip-B", "couple")} />,
    ),
  );
  expect(container.textContent).toBe("quoted");
  act(() => root.unmount());
});
it("separates product families, not local draft IDs or Journey subtypes", () => {
  expect(journeyPricingKey("buyer", null, "couple")).toBe(
    journeyPricingKey("buyer", null, "family"),
  );
  expect(journeyPricingKey("buyer", null, "xsed")).not.toBe(
    journeyPricingKey("buyer", null, "couple"),
  );
});
it("withholds the quote during session loading and after logout", () => {
  state.status = "loading";
  state.id = "";
  state.email = "buyer";
  state.refresh.mockClear();
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(<Probe binding={journeyPricingKey("buyer", null, "couple")} />),
  );
  expect(container.textContent).toBe("loading");
  expect(state.refresh).not.toHaveBeenCalled();
  state.status = "unauthenticated";
  state.email = "";
  act(() =>
    root.render(<Probe binding={journeyPricingKey("buyer", null, "couple")} />),
  );
  expect(container.textContent).toBe("loading");
  expect(state.refresh).toHaveBeenCalled();
  act(() =>
    root.render(<Probe binding={journeyPricingKey(null, null, "couple")} />),
  );
  expect(container.textContent).toBe("quoted");
  act(() => root.unmount());
});
