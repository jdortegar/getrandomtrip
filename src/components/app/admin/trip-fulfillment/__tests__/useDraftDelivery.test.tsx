import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { useDraftDelivery } from "../useDraftDelivery";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const draft = {
  id: "draft",
  tripRequestId: "trip",
  revision: 2,
  document: createTripDocumentSnapshot("hotel-voucher", {}),
  documentId: null,
  publishedRevision: null,
  previewId: null,
  createdAt: "",
  updatedAt: "",
};
let root: Root;
let host: HTMLDivElement;
let current: ReturnType<typeof useDraftDelivery>;
const fetchMock = vi.fn();
const revoke = vi.fn();
function Harness({ dirty = false, id = "draft" }) {
  const value = useDraftDelivery("trip", { ...draft, id }, dirty);
  useEffect(() => {
    current = value;
  });
  return null;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const pdf = () =>
  new Response(new Blob(["%PDF"], { type: "application/pdf" }), {
    headers: { "content-type": "application/pdf" },
  });
beforeEach(() => {
  host = document.createElement("div");
  root = createRoot(host);
  fetchMock.mockReset();
  revoke.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:preview");
      static revokeObjectURL = revoke;
    },
  );
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
async function preview() {
  fetchMock
    .mockResolvedValueOnce(json({ previewId: "preview", revision: 2 }))
    .mockResolvedValueOnce(pdf());
  await act(async () => current.render());
}
it("renders savedrevision then fetchesidentityPDF and attacheswithout rerender", async () => {
  await preview();
  expect(current.url).toBe("blob:preview");
  expect(fetchMock.mock.calls[1][0]).toContain(
    "preview?revision=2&previewId=preview",
  );
  fetchMock.mockResolvedValueOnce(json({ documentId: "published" }));
  await act(async () => current.attach());
  expect(fetchMock.mock.calls[2][0]).toContain("/attach");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    revision: 2,
    previewId: "preview",
    requestId: expect.any(String),
  });
  expect(current.attachedId).toBe("published");
});
it("preserves requestUUID for network/pending retries and only explicitly resets expired", async () => {
  await preview();
  fetchMock.mockRejectedValueOnce(new Error("network"));
  await act(async () => current.attach());
  const first = JSON.parse(fetchMock.mock.calls[2][1].body).requestId;
  fetchMock.mockResolvedValueOnce(json({ error: "attach_in_progress" }, 409));
  await act(async () => current.attach());
  expect(JSON.parse(fetchMock.mock.calls[3][1].body).requestId).toBe(first);
  expect(current.error).toBe("attach_in_progress");
  act(() => current.resetExpiredRequest());
  fetchMock.mockResolvedValueOnce(
    json({ error: "attach_request_expired" }, 409),
  );
  await act(async () => current.attach());
  expect(JSON.parse(fetchMock.mock.calls[4][1].body).requestId).toBe(first);
  act(() => current.resetExpiredRequest());
  fetchMock.mockResolvedValueOnce(json({ documentId: "published" }));
  await act(async () => current.attach());
  expect(JSON.parse(fetchMock.mock.calls[5][1].body).requestId).not.toBe(first);
});
it("invalidates on dirty edit and blocks stale attachment", async () => {
  await preview();
  act(() => root.render(<Harness dirty />));
  expect(current.url).toBe(null);
  expect(revoke).toHaveBeenCalledWith("blob:preview");
  await act(async () => current.attach());
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("aborts pending preview and ignores late bytes afterdirty edit", async () => {
  let finish!: (r: Response) => void;
  fetchMock
    .mockResolvedValueOnce(json({ previewId: "preview", revision: 2 }))
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
  act(() => {
    void current.render();
  });
  await act(async () => {});
  const signal = fetchMock.mock.calls[1][1].signal;
  act(() => root.render(<Harness dirty />));
  expect(signal.aborted).toBe(true);
  await act(async () => finish(pdf()));
  expect(current.url).toBe(null);
});
it("rejects nonPDF and oversized response", async () => {
  fetchMock
    .mockResolvedValueOnce(json({ previewId: "preview", revision: 2 }))
    .mockResolvedValueOnce(json({ secret: true }));
  await act(async () => current.render());
  expect(current.error).toBe("unavailable");
  fetchMock
    .mockResolvedValueOnce(json({ previewId: "preview", revision: 2 }))
    .mockResolvedValueOnce(
      new Response(new Uint8Array(4 * 1024 * 1024 + 1), {
        headers: { "content-type": "application/pdf" },
      }),
    );
  await act(async () => current.render());
  expect(current.error).toBe("unavailable");
});
it("ignores deferred blob completion after invalidation", async () => {
  let finish!: (blob: Blob) => void;
  const response = pdf();
  vi.spyOn(response, "blob").mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  fetchMock
    .mockResolvedValueOnce(json({ previewId: "preview", revision: 2 }))
    .mockResolvedValueOnce(response);
  act(() => {
    void current.render();
  });
  await act(async () => {});
  act(() => root.render(<Harness dirty />));
  await act(async () => finish(new Blob(["%PDF"])));
  expect(current.url).toBe(null);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it("ignores deferred attachment JSON after invalidation", async () => {
  await preview();
  let finish!: (value: unknown) => void;
  const response = json({});
  vi.spyOn(response, "json").mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  fetchMock.mockResolvedValueOnce(response);
  act(() => {
    void current.attach();
  });
  await act(async () => {});
  act(() => root.render(<Harness dirty />));
  await act(async () => finish({ documentId: "late" }));
  expect(current.attachedId).toBe(null);
});
it("aborts requests and revokes preview on unmount", async () => {
  await preview();
  fetchMock.mockReturnValueOnce(new Promise(() => {}));
  act(() => {
    void current.attach();
  });
  const signal = fetchMock.mock.calls[2][1].signal;
  act(() => root.unmount());
  expect(signal.aborted).toBe(true);
  expect(revoke).toHaveBeenCalledWith("blob:preview");
  root = createRoot(host);
});
it("preserves bounded authoritative field errors and clears them on edits", async () => {
  fetchMock.mockResolvedValueOnce(
    json(
      {
        errors: [
          { path: "data.inclusions.0.title", code: "required" },
          { path: "data.holder", code: "private-hostname" },
        ],
      },
      422,
    ),
  );
  await act(async () => current.render());
  expect(current.fieldErrors).toEqual([
    { path: "data.inclusions.0.title", code: "required" },
    { path: "data.holder", code: "invalid_value" },
  ]);
  expect(current.error).toBeNull();
  act(() => root.render(<Harness dirty />));
  expect(current.fieldErrors).toEqual([]);
});
it("ignores stale 422 JSON after a draft identity change", async () => {
  let finish!: (body: unknown) => void;
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 422,
    json: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = current.render();
  });
  act(() => root.render(<Harness id="another-draft" />));
  await act(async () => {
    finish({ errors: [{ path: "label", code: "required" }] });
    await pending;
  });
  expect(current.fieldErrors).toEqual([]);
  expect(current.error).toBeNull();
});
