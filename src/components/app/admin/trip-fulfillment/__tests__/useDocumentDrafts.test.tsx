import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { useDocumentDrafts } from "../useDocumentDrafts";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const draft = {
  id: "draft",
  tripRequestId: "trip",
  revision: 1,
  document: createTripDocumentSnapshot("hotel-voucher", {}),
  documentId: null,
  publishedRevision: null,
  previewId: null,
  createdAt: "now",
  updatedAt: "now",
};
let root: Root;
let host: HTMLDivElement;
let current: ReturnType<typeof useDocumentDrafts>;
const fetchMock = vi.fn();
function Harness({ tripId = "trip" }) {
  const result = useDocumentDrafts(tripId);
  useEffect(() => {
    current = result;
  });
  return null;
}
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
beforeEach(() => {
  host = document.createElement("div");
  root = createRoot(host);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it("lists private drafts and creates/opens without conflating trip save", async () => {
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [draft],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => current.list());
  expect(current.drafts).toEqual([draft]);
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.create("hotel-voucher", 0));
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
    template: "hotel-voucher",
    candidateIndex: 0,
  });
  expect(current.document).toEqual(draft.document);
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  expect(fetchMock.mock.calls[2][0]).toBe(
    "/api/admin/trip-requests/trip/document-drafts/draft",
  );
});
it("saves incomplete edits with revision and keeps409 conflicts editable", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  act(() => current.edit({ ...draft.document, label: "Incomplete" }));
  fetchMock.mockResolvedValueOnce(
    response({ error: "revision_conflict" }, 409),
  );
  await act(async () => current.save());
  expect(current.error).toBe("conflict");
  expect(current.document?.label).toBe("Incomplete");
  expect(current.dirty).toBe(true);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
    revision: 1,
    document: { label: "Incomplete" },
  });
  fetchMock.mockResolvedValueOnce(
    response({
      ...draft,
      revision: 2,
      document: { ...draft.document, label: "Incomplete" },
    }),
  );
  await act(async () => current.save());
  expect(current.selected?.revision).toBe(2);
  expect(current.dirty).toBe(false);
});
it("ignores stale save after edit and aborts on trip change", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  let finish!: (r: Response) => void;
  fetchMock.mockReturnValue(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => {
    void current.save();
  });
  const signal = fetchMock.mock.calls[1][1].signal;
  act(() => current.edit({ ...draft.document, label: "Newer edit" }));
  expect(signal.aborted).toBe(true);
  await act(async () => finish(response({ ...draft, revision: 2 })));
  expect(current.document?.label).toBe("Newer edit");
  act(() => root.render(<Harness tripId="other" />));
  expect(current.selected).toBe(null);
  expect(current.drafts).toEqual([]);
});
it("ignores out-of-order open and unmount results", async () => {
  let finish!: (r: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => {
    void current.open("old");
  });
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  await act(async () => finish(response({ ...draft, id: "old" })));
  expect(current.selected?.id).toBe("draft");
  fetchMock.mockReturnValue(new Promise(() => {}));
  act(() => {
    void current.list();
  });
  const signal = fetchMock.mock.calls[2][1].signal;
  act(() => root.unmount());
  expect(signal.aborted).toBe(true);
  root = createRoot(host);
});
it.each([
  [403, "forbidden"],
  [404, "not_found"],
  [422, "invalid"],
  [503, "unavailable"],
] as const)("maps status%d safely", async (status, error) => {
  fetchMock.mockResolvedValue(response({ error: "secret" }, status));
  await act(async () => current.list());
  expect(current.error).toBe(error);
});
