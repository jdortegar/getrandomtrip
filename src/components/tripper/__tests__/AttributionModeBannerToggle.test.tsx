import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttributionModeBannerToggle } from "../AttributionModeBannerToggle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockSearch = "";
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

const fetchMock = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetchMock;

const COPY = {
  visitRandomTripExperiences: "Ver experiencias RandomTrip",
  bannerTripperModeMessage: "Estás viendo experiencias curadas por {name}",
  bannerRandomtripModeMessage: "Estás viendo las experiencias generales de RandomTrip",
  bannerSwitchToRandomtrip: "Ver experiencias generales",
  bannerSwitchToTripper: "Volver a {name}",
};

let container: HTMLDivElement;
let root: Root;

function render(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(ui);
  });
}

beforeEach(() => {
  mockSearch = "";
  refreshMock.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.restoreAllMocks();
});

describe("AttributionModeBannerToggle — initialMode (review finding #4)", () => {
  it("starts in tripper mode when initialMode is 'tripper' (live cookie)", () => {
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="tripper"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );
    expect(container.textContent).toContain("curadas por Maria");
    expect(container.textContent).toContain("Ver experiencias generales");
  });

  it("starts in randomtrip mode with a 'switch back' control when initialMode is 'randomtrip' (last-seen cookie only)", () => {
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="randomtrip"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );
    expect(container.textContent).toContain("experiencias generales de RandomTrip");
    expect(container.textContent).toContain("Volver a Maria");
  });
});

describe("AttributionModeBannerToggle — router.refresh() after toggle (review finding #5)", () => {
  it("calls router.refresh() after a successful toggle POST", async () => {
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="tripper"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    const button = container.querySelector("button")!;
    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/attribution/mode",
      expect.objectContaining({ method: "POST" }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not call router.refresh() when the POST fails", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="tripper"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    const button = container.querySelector("button")!;
    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe("AttributionModeBannerToggle — ?catalog=randomtrip consistency (review finding #6)", () => {
  it("shows the randomtrip-mode message and hides the toggle button when catalog=randomtrip is active, even in tripper mode", () => {
    mockSearch = "catalog=randomtrip";
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="tripper"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    expect(container.textContent).toContain("experiencias generales de RandomTrip");
    expect(container.textContent).not.toContain("curadas por Maria");
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders normally when catalog is any other value", () => {
    mockSearch = "catalog=something-else";
    render(
      <AttributionModeBannerToggle
        copy={COPY}
        initialMode="tripper"
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    expect(container.textContent).toContain("curadas por Maria");
    expect(container.querySelector("button")).not.toBeNull();
  });
});
