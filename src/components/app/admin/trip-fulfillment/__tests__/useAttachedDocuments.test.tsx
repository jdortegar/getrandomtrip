import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAttachedDocuments } from "../useAttachedDocuments";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let current: ReturnType<typeof useAttachedDocuments>;
const fetchMock = vi.fn();
const document = { id: "attached" } as never;
function Harness({ tripId = "trip" }) {
  const value = useAttachedDocuments(tripId);
  useEffect(() => {
    current = value;
  });
  return null;
}
beforeEach(() => {
  root = createRoot(window.document.createElement("div"));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
const response = (documents: unknown[]) =>
  new Response(JSON.stringify({ documents }));
it("refreshes authoritative rows without changing unrelated trip fields", async () => {
  fetchMock.mockResolvedValueOnce(response([document]));
  let result: unknown;
  await act(async () => {
    result = await current.refresh();
  });
  expect(result).toBe(true);
  expect(current.documents).toEqual([document]);
  expect(current.status).toBe("ready");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/trip-requests/trip",
    expect.objectContaining({ cache: "no-store" }),
  );
});
it("coalesces duplicate refreshes and clears rejection for retry", async () => {
  let fail!: (error: Error) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((_resolve, reject) => {
      fail = reject;
    }),
  );
  act(() => {
    void current.refresh();
    void current.refresh();
  });
  expect(current.status).toBe("loading");
  expect(fetchMock).toHaveBeenCalledOnce();
  await act(async () => fail(new Error("offline")));
  expect(current.status).toBe("error");
  fetchMock.mockResolvedValueOnce(response([document]));
  await act(async () => current.refresh());
  expect(current.status).toBe("ready");
});
it("keeps existing rows and exposes refresh failure for retry rather than a false empty list", async () => {
  act(() => current.replace([document]));
  fetchMock.mockResolvedValueOnce(new Response("failure", { status: 503 }));
  await act(async () => current.refresh());
  expect(current.documents).toEqual([document]);
  expect(current.status).toBe("error");
  fetchMock.mockResolvedValueOnce(response([]));
  await act(async () => current.refresh());
  expect(current.documents).toEqual([]);
  expect(current.status).toBe("ready");
});
it("refreshes an independently loaded draft link only when its document is absent", async () => {
  act(() => current.replace([document]));
  await act(async () => current.ensure("attached"));
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response([document, { id: "new" }]));
  await act(async () => current.ensure("new"));
  expect(current.documents).toHaveLength(2);
});
it("ignores old refresh JSON after a trip switch or a local upload update", async () => {
  let finish!: (value: unknown) => void;
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = current.refresh();
  });
  act(() => current.replace([document]));
  await act(async () => {
    finish({ documents: [] });
    await pending;
  });
  expect(current.documents).toEqual([document]);
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await act(async () => {
    pending = current.refresh();
  });
  act(() => root.render(<Harness tripId="other" />));
  await act(async () => {
    finish({ documents: [document] });
    await pending;
  });
  expect(current.documents).toEqual([]);
});
it("treats an unresolved draft attachment link as a synchronization error, not an empty success", async () => {
  fetchMock.mockResolvedValueOnce(response([]));
  await act(async () => current.ensure("linked-but-missing"));
  expect(current.status).toBe("error");
});
it("keeps required-link verification on a retry until authoritative rows contain it", async () => {
  fetchMock.mockResolvedValueOnce(response([]));
  await act(async () => current.ensure("linked"));
  fetchMock.mockResolvedValueOnce(response([]));
  await act(async () => current.refresh());
  expect(current.status).toBe("error");
  fetchMock.mockResolvedValueOnce(response([{ id: "linked" }]));
  await act(async () => current.refresh());
  expect(current.status).toBe("ready");
});
