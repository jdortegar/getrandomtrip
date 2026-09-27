import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { TravelerHomePageClient } from "../TravelerHomePageClient";
import { getPayments, getTrips, type Trip } from "@/lib/utils/trips";
import en from "@/dictionaries/en.json";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/utils/trips", () => ({
  getTrips: vi.fn(),
  getPayments: vi.fn(),
}));
vi.mock("@/components/common/DashboardRoleToast", () => ({
  DashboardRoleToast: () => null,
}));
vi.mock("@/components/app/dashboard/traveler/UpcomingTripsList", () => ({
  UpcomingTripsList: () => null,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;
const fetchMock = vi.fn<typeof fetch>();

const trips: Trip[] = ["first/trip", "second-trip"].map((id) => ({
  id,
  city: "Origin",
  country: "Country",
  endDate: "2027-01-03",
  level: "essenza",
  pax: 2,
  startDate: "2027-01-01",
  status: "PENDING_PAYMENT",
  totalTripUsd: 700,
  type: "couple",
}));

beforeEach(() => {
  vi.mocked(getTrips).mockResolvedValue(trips);
  vi.mocked(getPayments).mockResolvedValue([]);
  vi.stubGlobal("fetch", fetchMock);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function confirm() {
  const button = Array.from(
    document.querySelectorAll('[role="dialog"] button'),
  ).find((element) => element.textContent?.trim() === "Delete");
  expect(button).toBeDefined();
  button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

it.each(["http", "network"])(
  "reports a %s failure exactly once, then retries the selected trip successfully",
  async (failure) => {
    if (failure === "http")
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    else fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await act(async () =>
      root.render(
        <TravelerHomePageClient
          copy={en.dashboard}
          eyebrow="Dashboard"
          heading="Your trips"
          locale="en"
          roleToast=""
        />,
      ),
    );
    const deleteButton = container.querySelector("tbody button")!;
    act(() =>
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => confirm());

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/trips/first%2Ftrip",
      { method: "DELETE" },
    );
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      en.dashboard.unpaidTrips.deleteFailed,
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    await act(async () => confirm());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]).toEqual([
      "/api/trips/first%2Ftrip",
      { method: "DELETE" },
    ]);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(
      container.querySelector('a[href="/en/checkout?tripId=second-trip"]'),
    ).not.toBeNull();
  },
);
