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
function Harness({ tripId = "trip", autoLoad = false }) {
  const result = useDocumentDrafts(tripId, autoLoad);
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
it("deletes only the selected revision, removing editor/list without touching attachment", async () => {
  fetchMock.mockResolvedValueOnce(
    response({ ...draft, documentId: "attached" }),
  );
  await act(async () => current.open("draft"));
  act(() => current.edit({ ...draft.document, label: "Unsaved" }));
  fetchMock.mockResolvedValueOnce(response({ deleted: true }));
  await act(async () => current.removeSelected());
  expect(fetchMock.mock.calls[1][0]).toBe(
    "/api/admin/trip-requests/trip/document-drafts/draft",
  );
  expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ revision: 1 });
  expect(current.selected).toBe(null);
  expect(current.document).toBe(null);
  expect(current.drafts).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it.each([409, 503])(
  "preserves dirty edits/list after deletion failure %s",
  async (status) => {
    fetchMock.mockResolvedValueOnce(response(draft));
    await act(async () => current.open("draft"));
    act(() => current.edit({ ...draft.document, label: "Keep edits" }));
    fetchMock.mockResolvedValueOnce(response({}, status));
    await act(async () => current.removeSelected());
    expect(current.document?.label).toBe("Keep edits");
    expect(current.drafts).toHaveLength(1);
    expect(current.error).toBe(status === 409 ? "conflict" : "unavailable");
  },
);
it("ignores deletion JSON completing after opening another draft and aborts old request", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  let finish!: (value: unknown) => void;
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  let pending!: ReturnType<typeof current.removeSelected>;
  await act(async () => {
    pending = current.removeSelected();
  });
  expect(current.busy).toBe(true);
  const signal = fetchMock.mock.calls[1][1].signal;
  fetchMock.mockResolvedValueOnce(response({ ...draft, id: "other" }));
  await act(async () => current.open("other"));
  await act(async () => {
    finish({ deleted: true });
    await pending;
  });
  expect(signal.aborted).toBe(true);
  expect(current.selected?.id).toBe("other");
  expect(current.drafts).toHaveLength(2);
});

it("ignores an old automatic source load after changing trips", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await act(async () => root.render(<Harness autoLoad />));
  const oldSignal = fetchMock.mock.calls[0][1].signal;
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => root.render(<Harness autoLoad tripId="other" />));
  await act(async () =>
    finish(
      response({
        drafts: [draft],
        candidates: { hotel: [], activity: [], dinner: [] },
      }),
    ),
  );
  expect(oldSignal.aborted).toBe(true);
  expect(current.loaded).toBe(true);
  expect(current.drafts).toEqual([]);
  expect(current.error).toBe(null);
});
it("returns the adopted saved revision and validated edits for Save & preview", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  const validated = { ...draft.document, label: "Ready" };
  const saved = { ...draft, revision: 2, document: validated };
  fetchMock.mockResolvedValueOnce(response(saved));
  let result: unknown;
  await act(async () => {
    result = await current.save(validated);
  });
  expect(result).toEqual(saved);
  expect(current.selected).toEqual(saved);
  expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body)).toEqual({
    revision: 1,
    document: validated,
  });
});
it("returns no saved revision on conflict, preserving editable content", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.open("draft"));
  act(() => current.edit({ ...draft.document, label: "My changes" }));
  fetchMock.mockResolvedValueOnce(response({}, 409));
  let result: unknown;
  await act(async () => {
    result = await current.save();
  });
  expect(result).toBeUndefined();
  expect(current.document?.label).toBe("My changes");
  expect(current.error).toBe("conflict");
});
it.each(["edit", "switch"])(
  "does not return a stale save after %s while response JSON is pending",
  async (action) => {
    fetchMock.mockResolvedValueOnce(response(draft));
    await act(async () => current.open("draft"));
    let finish!: (value: unknown) => void;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    let pending!: ReturnType<typeof current.save>;
    await act(async () => {
      pending = current.save();
    });
    if (action === "edit")
      act(() => current.edit({ ...draft.document, label: "Newer" }));
    else act(() => root.render(<Harness tripId="other" />));
    let result: unknown;
    await act(async () => {
      finish({ ...draft, revision: 2 });
      result = await pending;
    });
    expect(result).toBeUndefined();
    expect(current.selected?.revision).not.toBe(2);
    if (action === "edit") expect(current.document?.label).toBe("Newer");
  },
);
