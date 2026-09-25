import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTripDocumentSource } from "../useTripDocumentSource";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let current: ReturnType<typeof useTripDocumentSource>;
const fetchMock = vi.fn();
function Harness({ experienceId }: { experienceId?: string | null }) {
  const value = useTripDocumentSource("trip", experienceId);
  useEffect(() => {
    current = value;
  });
  return null;
}
const context = (title: string) => ({
  experienceItinerary: { title, itinerary: [], inclusions: [], exclusions: [] },
  candidates: { hotel: [], activity: [], dinner: [] },
});
const response = (title: string) =>
  new Response(JSON.stringify(context(title)));
beforeEach(() => {
  root = createRoot(document.createElement("div"));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it("loads selection through GET only and distinguishes saved source from explicit clear", async () => {
  fetchMock.mockResolvedValueOnce(response("Saved"));
  await act(async () => root.render(<Harness />));
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/admin/trip-requests/trip/document-source",
  );
  fetchMock.mockResolvedValueOnce(response("Cleared"));
  await act(async () => root.render(<Harness experienceId={null} />));
  expect(fetchMock.mock.calls[1][0]).toBe(
    "/api/admin/trip-requests/trip/document-source?experienceId=",
  );
  expect(
    fetchMock.mock.calls.every(
      ([, init]) => !init.method || init.method === "GET",
    ),
  ).toBe(true);
});
it("clears old data immediately and ignores out-of-order responses after selection/discard", async () => {
  fetchMock.mockResolvedValueOnce(response("Saved"));
  await act(async () => root.render(<Harness />));
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => root.render(<Harness experienceId="new" />));
  expect(current.context).toBeNull();
  expect(current.status).toBe("loading");
  const signal = fetchMock.mock.calls[1][1].signal;
  fetchMock.mockResolvedValueOnce(response("Saved"));
  await act(async () => root.render(<Harness />));
  expect(signal.aborted).toBe(true);
  await act(async () => finish(response("Stale")));
  expect(current.context?.experienceItinerary?.title).toBe("Saved");
});
it("fails closed and retries the current source instead of retaining old defaults", async () => {
  fetchMock.mockResolvedValueOnce(response("Saved"));
  await act(async () => root.render(<Harness />));
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await act(async () => root.render(<Harness experienceId="new" />));
  expect(current.status).toBe("error");
  expect(current.context).toBeNull();
  fetchMock.mockResolvedValueOnce(response("New"));
  await act(async () => current.retry());
  expect(current.context?.experienceItinerary?.title).toBe("New");
});
