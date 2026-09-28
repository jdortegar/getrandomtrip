import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { TripTravelerReminder } from "../TripTravelerReminder";
import styles from "../fulfillment.module.css";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
const fetchMock = vi.fn();
const refresh = vi.fn();
const copy = en.adminTripFulfillment.travelers.reminder;
const response = (status: string, http = 200) =>
  new Response(
    JSON.stringify({
      status,
      nextEligibleAt: new Date(Date.now() + 3_600_000).toISOString(),
    }),
    { status: http },
  );
function render(tripId = "trip") {
  act(() =>
    root.render(
      <TripTravelerReminder
        copy={copy}
        key={tripId}
        onComplete={refresh}
        tripId={tripId}
      />,
    ),
  );
}
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock.mockReset();
  refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  render();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("never sends on mount; shows pending feedback, prevents duplicates and disables accepted daily send", async () => {
  expect(fetchMock).not.toHaveBeenCalled();
  expect(host.textContent).toContain(copy.dailyNote);
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  const button = host.querySelector("button")!;
  expect(button.classList.contains(styles.travelerReminderButton)).toBe(true);
  act(() => {
    button.click();
    button.click();
  });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    "/api/admin/trip-requests/trip/traveler-reminder",
    { method: "POST" },
  );
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.textContent).toBe(copy.sending);
  expect(button.querySelector(".animate-spin")).not.toBeNull();
  await act(async () => finish(response("accepted")));
  expect(button.disabled).toBe(true);
  expect(host.textContent).toContain(copy.sent);
  render("another-trip");
  expect(host.querySelector("button")!.disabled).toBe(false);
  expect(host.textContent).not.toContain(copy.sent);
});
it.each(["reject", "http"])(
  "shows %s failure and allows retry without success",
  async (failure) => {
    if (failure === "reject")
      fetchMock.mockRejectedValueOnce(new Error("offline"));
    else fetchMock.mockResolvedValueOnce(response("error", 503));
    await act(async () => host.querySelector("button")!.click());
    expect(host.textContent).toContain(copy.failed);
    expect(host.textContent).not.toContain(copy.sent);
    expect(host.querySelector("button")!.disabled).toBe(false);
    fetchMock.mockResolvedValueOnce(response("accepted"));
    await act(async () => host.querySelector("button")!.click());
    expect(host.textContent).toContain(copy.sent);
  },
);
it("refreshes a stale completed roster without claiming an email was sent", async () => {
  fetchMock.mockResolvedValueOnce(response("already_complete"));
  await act(async () => host.querySelector("button")!.click());
  expect(refresh).toHaveBeenCalledExactlyOnceWith();
  expect(host.textContent).toContain(copy.alreadyComplete);
  expect(host.textContent).not.toContain(copy.sent);
});
it("explains ineligible state without success", async () => {
  fetchMock.mockResolvedValueOnce(response("not_eligible", 409));
  await act(async () => host.querySelector("button")!.click());
  expect(host.textContent).toContain(copy.notEligible);
  expect(host.textContent).not.toContain(copy.sent);
});
it("ignores response from an unmounted trip", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => host.querySelector("button")!.click());
  render("next-trip");
  await act(async () => finish(response("already_complete")));
  expect(refresh).not.toHaveBeenCalled();
  expect(host.textContent).not.toContain(copy.alreadyComplete);
});

it("explains refresh failure separately from mail delivery", async () => {
  fetchMock.mockResolvedValueOnce(response("already_complete"));
  refresh.mockRejectedValueOnce(new Error("refresh failed"));
  await act(async () => host.querySelector("button")!.click());
  expect(host.textContent).toContain(copy.refreshFailed);
  expect(host.textContent).not.toContain(copy.failed);
});

it("re-enables at the next UTC day and clears yesterday's success without sending again", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-28T23:59:00Z"));
  fetchMock.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        status: "accepted",
        nextEligibleAt: "2026-09-29T00:00:00.000Z",
      }),
    ),
  );
  await act(async () => host.querySelector("button")!.click());
  expect(host.querySelector("button")!.disabled).toBe(true);
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(host.querySelector("button")!.disabled).toBe(false);
  expect(host.textContent).not.toContain(copy.sent);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each([en, es])(
  "explains that legacy roster needs review without claiming mail was sent",
  async (dictionary) => {
    const localized = dictionary.adminTripFulfillment.travelers.reminder;
    act(() =>
      root.render(
        <TripTravelerReminder
          copy={localized}
          onComplete={refresh}
          tripId="trip"
        />,
      ),
    );
    fetchMock.mockResolvedValueOnce(response("roster_needs_review", 409));
    await act(async () => host.querySelector("button")!.click());
    expect(host.textContent).toContain(localized.rosterNeedsReview);
    expect(host.textContent).not.toContain(localized.sent);
  },
);
